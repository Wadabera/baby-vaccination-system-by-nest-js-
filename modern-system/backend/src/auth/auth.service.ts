import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionService } from './session.service';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import { User, UserRole } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  clinicId?: string;
  /** Distinguishes access tokens from refresh tokens when both share a secret. */
  typ: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Verify credentials and account state.
   *
   * Accounts migrated from the PHP system still carry an MD5 hash in
   * `legacyPasswordHash`; when that verifies we immediately upgrade the
   * credential to argon2id so the weak hash stops being a valid secret.
   */
  async validateUser(
    identifier: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersService.findOneForAuth(identifier);

    // Always run a hash comparison so that a missing account and a wrong
    // password take a similar amount of time (mitigates user enumeration).
    const hash = user?.passwordHash ?? user?.legacyPasswordHash;
    if (!user || !hash) {
      await argon2
        .verify(
          '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$0000000000000000000000000000000000000000000',
          password,
        )
        .catch(() => false);
      return null;
    }

    if (user.security.lockedUntil && user.security.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Account is temporarily locked. Please try again in a few minutes.',
      );
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Account is deactivated. Please contact an administrator.',
      );
    }

    const isValid = await this.verifyPassword(user, password);

    if (!isValid) {
      await this.recordFailedAttempt(user);
      const attemptsLeft =
        MAX_FAILED_ATTEMPTS - (user.security.failedAttempts + 1);
      if (attemptsLeft <= 0) {
        throw new ForbiddenException(
          'Account locked due to too many failed attempts. Try again in 15 minutes.',
        );
      }
      throw new UnauthorizedException(
        `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      );
    }

    await this.recordSuccessfulLogin(user);
    return user;
  }

  /** argon2 first, falling back to the legacy MD5 hash for migrated accounts. */
  private async verifyPassword(user: User, password: string): Promise<boolean> {
    if (user.passwordHash) {
      try {
        return await argon2.verify(user.passwordHash, password);
      } catch {
        return false;
      }
    }

    if (user.legacyPasswordHash) {
      const candidate = Buffer.from(password, 'utf8');
      const expected = Buffer.from(user.legacyPasswordHash, 'utf8');
      const matches =
        expected.length === candidate.length &&
        crypto.timingSafeEqual(expected, candidate);

      if (matches) {
        // Transparently upgrade the migrated credential to a strong hash.
        const passwordHash = await this.hashPassword(password);
        await this.userModelUpdate(user._id.toString(), {
          passwordHash,
          legacyPasswordHash: undefined,
        });
      }
      return matches;
    }

    return false;
  }

  private hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  private async userModelUpdate(
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.usersService.updateSecurityInfo(id, data);
  }

  private async recordFailedAttempt(user: User): Promise<void> {
    const failedAttempts = user.security.failedAttempts + 1;
    const lockedUntil =
      failedAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCK_DURATION_MS)
        : null;

    await this.usersService.updateSecurityInfo(user._id.toString(), {
      ...user.security,
      failedAttempts,
      lockedUntil,
    });
  }

  private async recordSuccessfulLogin(user: User): Promise<void> {
    await this.usersService.updateSecurityInfo(user._id.toString(), {
      ...user.security,
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    });
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const identifier = loginDto.username || loginDto.email;
    if (!identifier) {
      throw new BadRequestException(
        'Either username or email must be provided',
      );
    }

    const user = await this.validateUser(identifier, loginDto.password);
    if (!user) {
      await this.sessionService.logAuditEvent(
        'unknown',
        'LOGIN_FAILED',
        'user',
        undefined,
        { identifier, reason: 'Invalid credentials' },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.issueTokens(user);
    const sessionToken = this.sessionService.createSession(
      user._id.toString(),
      ipAddress ?? 'unknown',
      userAgent ?? 'unknown',
    );

    await this.sessionService.logAuditEvent(
      user._id.toString(),
      'LOGIN_SUCCESS',
      'user',
      user._id.toString(),
      { method: 'password' },
    );

    return { ...tokens, user: this.toAuthUser(user), sessionToken };
  }

  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    if (await this.usersService.findOneByEmail(registerDto.email)) {
      await this.sessionService.logAuditEvent(
        'unknown',
        'REGISTRATION_FAILED',
        'user',
        undefined,
        { email: registerDto.email, reason: 'Email already exists' },
      );
      throw new BadRequestException('User with this email already exists');
    }

    const userResponse = await this.usersService.create({
      email: registerDto.email,
      username: registerDto.username,
      password: registerDto.password,
      // Self-registration can only ever produce a parent account; elevated
      // roles must be granted by an administrator.
      role: UserRole.PARENT,
      profile: {
        firstName: registerDto.firstName,
        middleName: registerDto.middleName,
        lastName: registerDto.lastName,
        phoneNumber: registerDto.phoneNumber,
      },
      settings: {
        notifications: { email: true, sms: true, push: false },
        language: 'en',
        timezone: 'Africa/Addis_Ababa',
      },
    });

    const tokens = this.signForUser(
      userResponse.id,
      userResponse.email,
      userResponse.role,
      userResponse.clinicId,
    );
    const sessionToken = this.sessionService.createSession(
      userResponse.id,
      ipAddress ?? 'unknown',
      userAgent ?? 'unknown',
    );

    await this.sessionService.logAuditEvent(
      userResponse.id,
      'REGISTRATION_SUCCESS',
      'user',
      userResponse.id,
      { method: 'self_registration' },
    );

    return { ...tokens, user: userResponse, sessionToken };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // A refresh token must not be usable as an access token, and vice versa.
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let userResponse;
    try {
      userResponse = await this.usersService.findByIdOrFail(payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!userResponse.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = this.signForUser(
      userResponse.id,
      userResponse.email,
      userResponse.role,
      userResponse.clinicId,
    );
    return { ...tokens, user: userResponse };
  }

  async logout(userId: string, sessionToken?: string): Promise<void> {
    if (sessionToken) {
      this.sessionService.invalidateSession(sessionToken);
    } else {
      this.sessionService.invalidateAllUserSessions(userId);
    }

    await this.sessionService.logAuditEvent(userId, 'LOGOUT', 'user', userId, {
      sessionInvalidated: true,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
  ): Promise<void> {
    const existing = await this.usersService.findOneByEmailWithHash(
      (await this.usersService.findByIdOrFail(userId)).email,
    );
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (!(await this.verifyPassword(existing, currentPassword))) {
      await this.sessionService.logAuditEvent(
        userId,
        'PASSWORD_CHANGE_FAILED',
        'user',
        userId,
        { reason: 'Incorrect current password', ipAddress },
      );
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    await this.usersService.update(userId, {
      password: newPassword,
      currentPassword,
    });

    await this.sessionService.logAuditEvent(
      userId,
      'PASSWORD_CHANGE_SUCCESS',
      'user',
      userId,
      { ipAddress },
    );

    // Force every other device to sign in again.
    this.sessionService.invalidateAllUserSessions(userId);
  }

  // --- token helpers -------------------------------------------------------

  private issueTokens(
    user: User,
  ): Pick<AuthResponseDto, 'accessToken' | 'refreshToken'> {
    return this.signForUser(
      user._id.toString(),
      user.email,
      user.role,
      user.clinicId?.toString(),
    );
  }

  private signForUser(
    sub: string,
    email: string,
    role: UserRole,
    clinicId?: string,
  ): Pick<AuthResponseDto, 'accessToken' | 'refreshToken'> {
    const base = { sub, email, role, clinicId };
    return {
      accessToken: this.jwtService.sign(
        { ...base, typ: 'access' } satisfies JwtPayload,
        {
          expiresIn: '1h',
        },
      ),
      refreshToken: this.jwtService.sign(
        { ...base, typ: 'refresh' } satisfies JwtPayload,
        {
          expiresIn: '7d',
        },
      ),
    };
  }

  private toAuthUser(user: User): AuthResponseDto['user'] {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.profile.firstName,
        middleName: user.profile.middleName,
        lastName: user.profile.lastName,
        phoneNumber: user.profile.phoneNumber,
        photoUrl: user.profile.photoUrl,
      },
      clinicId: user.clinicId?.toString(),
      settings: user.settings,
    };
  }
}

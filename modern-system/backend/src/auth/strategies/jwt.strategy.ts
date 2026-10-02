import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/schemas/user.schema';
import type { AuthenticatedUser } from '../interfaces/authenticated-request.interface';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  clinicId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  /**
   * Re-check the account on every request so that deactivating a user or
   * changing their role takes effect immediately instead of waiting for the
   * access token to expire.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByIdOrFail(payload.sub);

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    };
  }
}

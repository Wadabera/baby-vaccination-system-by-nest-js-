import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as argon2 from 'argon2';

/**
 * Projection that pulls in the two `select: false` credential fields.
 * Passing this to `findOne` avoids the deprecated `.select()` after a filter.
 */
const USER_CREDENTIAL_SELECTION = '+passwordHash +legacyPasswordHash';

/**
 * Fields `updateSecurityInfo` is allowed to write. Anything else in the payload
 * is ignored, which keeps Mongo's immutable `_id` — present both on the document
 * and on its nested objects — out of the update.
 */
const SECURITY_FIELDS = [
  'lastLogin',
  'failedAttempts',
  'lockedUntil',
  'mfaEnabled',
] as const;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private mapToResponseDto(user: User): UserResponseDto {
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
        birthDate: user.profile.birthDate,
      },
      clinicId: user.clinicId?.toString(),
      childrenIds: user.childrenIds.map((id) => id.toString()),
      settings: {
        notifications: user.settings.notifications,
        language: user.settings.language,
        timezone: user.settings.timezone,
      },
      security: {
        lastLogin: user.security.lastLogin,
        failedAttempts: user.security.failedAttempts,
        lockedUntil: user.security.lockedUntil,
        mfaEnabled: user.security.mfaEnabled,
      },
      audit: {
        createdAt: user.audit.createdAt,
        updatedAt: user.audit.updatedAt,
        createdBy: user.audit.createdBy?.toString(),
        updatedBy: user.audit.updatedBy?.toString(),
      },
      isActive: user.isActive,
    };
  }

  async create(
    createUserDto: CreateUserDto,
    createdBy?: string,
  ): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (createUserDto.username) {
      const existingUsername = await this.userModel.findOne({
        username: createUserDto.username.toLowerCase(),
      });
      if (existingUsername) {
        throw new ConflictException('Username is already taken');
      }
    }

    // Hash password using argon2id
    const passwordHash = await argon2.hash(createUserDto.password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64MB
      timeCost: 3,
      parallelism: 4,
    });

    const userData: any = {
      email: createUserDto.email.toLowerCase(),
      username: createUserDto.username
        ? createUserDto.username.toLowerCase()
        : undefined,
      passwordHash,
      role: createUserDto.role,
      profile: createUserDto.profile,
      settings: createUserDto.settings || {
        notifications: { email: true, sms: true, push: false },
        language: 'en',
        timezone: 'Africa/Addis_Ababa',
      },
      isActive:
        createUserDto.isActive !== undefined ? createUserDto.isActive : true,
      audit: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
      },
    };

    if (createUserDto.clinicId) {
      userData.clinicId = new Types.ObjectId(createUserDto.clinicId);
    }

    if (createUserDto.childrenIds && createUserDto.childrenIds.length > 0) {
      userData.childrenIds = createUserDto.childrenIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    const createdUser = new this.userModel(userData);
    const savedUser = await createdUser.save();
    return this.mapToResponseDto(savedUser);
  }

  async findAll(activeOnly: boolean = true): Promise<UserResponseDto[]> {
    const query = activeOnly ? { isActive: true } : {};
    const users = await this.userModel.find(query).exec();
    return users.map((user) => this.mapToResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapToResponseDto(user);
  }

  /**
   * Load a user for authentication.
   *
   * `passwordHash` and `legacyPasswordHash` are `select: false` on the schema,
   * so they are requested explicitly here. Passing `{ projection: false }`
   * suppresses the deprecation warning raised by including an excluded field.
   */
  async findOneForAuth(identifier: string): Promise<User | null> {
    const normalised = identifier.trim().toLowerCase();
    const query = normalised.includes('@')
      ? { email: normalised }
      : { username: normalised };
    return this.userModel.findOne(query, USER_CREDENTIAL_SELECTION).exec();
  }

  /** Look up by email, including the password hash. Used by token refresh. */
  async findOneByEmailWithHash(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() }, USER_CREDENTIAL_SELECTION)
      .exec();
  }

  /** Load a user by id, throwing when absent. Used by the JWT strategy. */
  async findByIdOrFail(id: string): Promise<UserResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapToResponseDto(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    updatedBy?: string,
  ): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {
      'audit.updatedAt': new Date(),
      'audit.updatedBy': updatedBy ? new Types.ObjectId(updatedBy) : undefined,
    };

    if (
      updateUserDto.username &&
      updateUserDto.username.toLowerCase() !== user.username
    ) {
      const existingUsername = await this.userModel.findOne({
        username: updateUserDto.username.toLowerCase(),
      });
      if (existingUsername && existingUsername._id.toString() !== id) {
        throw new ConflictException('Username is already taken');
      }
      updateData.username = updateUserDto.username.toLowerCase();
    }

    // Update password if provided
    if (updateUserDto.password) {
      if (!updateUserDto.currentPassword) {
        throw new BadRequestException(
          'Current password is required to change password',
        );
      }

      // Verify current password
      const isValidPassword = await argon2.verify(
        user.passwordHash,
        updateUserDto.currentPassword,
      );
      if (!isValidPassword) {
        throw new ForbiddenException('Current password is incorrect');
      }

      // Hash new password
      updateData.passwordHash = await argon2.hash(updateUserDto.password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
      // Drop any legacy MD5 credential once the account is re-hashed.
      updateData.legacyPasswordHash = undefined;
    }

    // Update other fields
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email.toLowerCase(),
      });
      if (existingUser && existingUser._id.toString() !== id) {
        throw new ConflictException('Email already in use by another user');
      }
      updateData.email = updateUserDto.email.toLowerCase();
    }

    if (updateUserDto.role) {
      updateData.role = updateUserDto.role;
    }

    if (updateUserDto.profile) {
      updateData.profile = { ...user.profile, ...updateUserDto.profile };
    }

    if (updateUserDto.settings) {
      updateData.settings = { ...user.settings, ...updateUserDto.settings };
    }

    if (updateUserDto.clinicId !== undefined) {
      updateData.clinicId = updateUserDto.clinicId
        ? new Types.ObjectId(updateUserDto.clinicId)
        : null;
    }

    if (updateUserDto.childrenIds !== undefined) {
      updateData.childrenIds = updateUserDto.childrenIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (updateUserDto.isActive !== undefined) {
      updateData.isActive = updateUserDto.isActive;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return this.mapToResponseDto(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async deactivate(id: string, updatedBy?: string): Promise<UserResponseDto> {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          isActive: false,
          'audit.updatedAt': new Date(),
          'audit.updatedBy': updatedBy
            ? new Types.ObjectId(updatedBy)
            : undefined,
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToResponseDto(user);
  }

  /**
   * Update the security block and/or rotate credential material.
   *
   * Callers pass a full `security` object (spread from the current document) so
   * sub-fields are replaced atomically rather than merged field by field.
   */
  async updateSecurityInfo(
    id: string,
    securityData: Partial<User['security']> | Record<string, unknown>,
  ): Promise<void> {
    const payload = securityData as Record<string, unknown>;
    const set: Record<string, unknown> = { 'audit.updatedAt': new Date() };
    const unset: Record<string, ''> = {};

    if (payload.security && typeof payload.security === 'object') {
      const next = payload.security as Record<string, unknown>;
      for (const field of SECURITY_FIELDS) {
        if (field in next) {
          set[`security.${field}`] = next[field] ?? null;
        }
      }
    }

    // Credential rotation. `undefined` removes the field rather than storing null.
    if ('passwordHash' in payload) {
      if (payload.passwordHash === undefined) {
        unset.passwordHash = '';
      } else {
        set.passwordHash = payload.passwordHash;
      }
    }
    if ('legacyPasswordHash' in payload) {
      if (payload.legacyPasswordHash === undefined) {
        unset.legacyPasswordHash = '';
      } else {
        set.legacyPasswordHash = payload.legacyPasswordHash;
      }
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length > 0) update.$set = set;
    if (Object.keys(unset).length > 0) update.$unset = unset;

    await this.userModel.findByIdAndUpdate(id, update).exec();
  }

  async findByRole(
    role: UserRole,
    activeOnly: boolean = true,
  ): Promise<UserResponseDto[]> {
    const query: any = { role };
    if (activeOnly) {
      query.isActive = true;
    }
    const users = await this.userModel.find(query).exec();
    return users.map((user) => this.mapToResponseDto(user));
  }

  async findByClinic(
    clinicId: string,
    activeOnly: boolean = true,
  ): Promise<UserResponseDto[]> {
    const query: any = { clinicId: new Types.ObjectId(clinicId) };
    if (activeOnly) {
      query.isActive = true;
    }
    const users = await this.userModel.find(query).exec();
    return users.map((user) => this.mapToResponseDto(user));
  }

  async searchUsers(
    searchTerm: string,
    role?: UserRole,
  ): Promise<UserResponseDto[]> {
    const query: any = {
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { 'profile.firstName': { $regex: searchTerm, $options: 'i' } },
        { 'profile.lastName': { $regex: searchTerm, $options: 'i' } },
        { 'profile.phoneNumber': { $regex: searchTerm, $options: 'i' } },
      ],
      isActive: true,
    };

    if (role) {
      query.role = role;
    }

    const users = await this.userModel.find(query).limit(50).exec();
    return users.map((user) => this.mapToResponseDto(user));
  }
}

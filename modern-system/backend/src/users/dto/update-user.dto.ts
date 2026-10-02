import {
  IsOptional,
  IsString,
  Matches,
  IsEnum,
  IsPhoneNumber,
  IsBoolean,
  IsMongoId,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserProfileDto, UserSettingsDto } from './create-user.dto';
import { UserRole } from '../schemas/user.schema';

// Re-exported so the nested DTOs above can be reused for partial updates.
class UpdateUserProfileDto implements Partial<UserProfileDto> {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsPhoneNumber('ET') phoneNumber?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() birthDate?: string;
}

class UpdateUserSettingsDto implements Partial<UserSettingsDto> {
  @IsOptional() notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsString() timezone?: string;
}

// Deliberately NOT `PartialType(CreateUserDto)`: the nested `profile` and
// `settings` types are narrowed to partial shapes below, which conflicts with
// the required nested types inherited from CreateUserDto.
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9._-]{3,45}$/, {
    message:
      'Username must be 3-45 characters and contain only letters, numbers, dots, underscores or hyphens',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
    },
  )
  password?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(Object.values(UserRole))
  role?: UserRole;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserProfileDto)
  profile?: UpdateUserProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserSettingsDto)
  settings?: UpdateUserSettingsDto;

  @IsOptional()
  @IsMongoId()
  clinicId?: string;

  @IsOptional()
  childrenIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

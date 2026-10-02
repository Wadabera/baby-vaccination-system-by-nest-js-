import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
  IsPhoneNumber,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../schemas/user.schema';

export class UserProfileDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsPhoneNumber('ET') // Ethiopian phone numbers
  phoneNumber: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;
}

export class UserSettingsDto {
  @IsOptional()
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9._-]{3,45}$/, {
    message:
      'Username must be 3-45 characters and contain only letters, numbers, dots, underscores or hyphens',
  })
  username?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
    },
  )
  password: string;

  @IsNotEmpty()
  @IsEnum(Object.values(UserRole))
  role: UserRole;

  @ValidateNested()
  @Type(() => UserProfileDto)
  profile: UserProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserSettingsDto)
  settings?: UserSettingsDto;

  @IsOptional()
  @IsMongoId()
  clinicId?: string;

  @IsOptional()
  childrenIds?: string[];

  @IsOptional()
  isActive?: boolean;
}

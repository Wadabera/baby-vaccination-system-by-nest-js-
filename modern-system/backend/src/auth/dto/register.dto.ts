import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  /**
   * Optional username: an account can be identified by email alone.
   *
   * `ValidateIf` is used instead of relying on `@IsOptional()` because that
   * decorator only skips validation for `undefined` and `null`. A client
   * sending an empty string for a field it considers optional — which the
   * registration form does — would otherwise be rejected by the pattern
   * below with no obvious cause.
   */
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
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
  @IsString()
  firstName: string;

  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  middleName?: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsPhoneNumber('ET') // Ethiopian phone numbers
  phoneNumber: string;
}

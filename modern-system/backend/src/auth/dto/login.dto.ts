import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * Accepts either the legacy `username` or an `email` address.
 *
 * Exactly one of the two must be supplied; `identifier` is set by the
 * controller from whichever field arrived so the service only deals with a
 * single value.
 */
export class LoginDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password: string;
}

import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsEmail,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PersonalInfoDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() middleName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsDateString() @IsOptional() birthDate?: string;
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  @IsOptional()
  bloodType?: string;
  @IsString() @IsOptional() photoUrl?: string;
}

class ContactInfoDto {
  @IsString() @IsOptional() phoneNumber?: string;
  @IsString() @IsOptional() alternatePhone?: string;
  @IsEmail() @IsOptional() email?: string;
}

class AddressDto {
  @IsString() @IsOptional() zone?: string;
  @IsString() @IsOptional() wereda?: string;
  @IsString() @IsOptional() kebele?: string;
  @IsString() @IsOptional() houseNumber?: string;
}

class MedicalHistoryDto {
  @IsArray() @IsString({ each: true }) @IsOptional() allergies?: string[];
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  chronicConditions?: string[];
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  previousAdverseReactions?: string[];
  @IsString() @IsOptional() notes?: string;
}

/**
 * Every field is optional, but nested groups are merged rather than replaced so
 * a partial payload cannot silently clear unrelated values.
 */
export class UpdateMotherDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo?: PersonalInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalHistoryDto)
  medicalHistory?: MedicalHistoryDto;
}

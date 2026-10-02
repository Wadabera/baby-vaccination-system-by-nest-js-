import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

class PersonalInfoDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  @IsOptional()
  bloodType?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}

class MedicalInfoDto {
  @IsOptional()
  birthWeight?: number;

  @IsOptional()
  birthHeight?: number;

  @IsOptional()
  allergies?: string[];
}

export class CreateChildDto {
  @IsMongoId()
  @IsNotEmpty()
  motherId: string;

  @IsMongoId()
  @IsOptional()
  clinicId?: string;

  @ValidateNested()
  @Type(() => PersonalInfoDto)
  @IsNotEmpty()
  personalInfo: PersonalInfoDto;

  @ValidateNested()
  @Type(() => MedicalInfoDto)
  @IsOptional()
  medicalInfo?: MedicalInfoDto;

  @IsMongoId()
  @IsOptional()
  createdBy?: string;
}

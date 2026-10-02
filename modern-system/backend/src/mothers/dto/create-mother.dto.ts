import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsEmail,
  IsNumber,
  IsArray,
  ValidateNested,
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

class ContactInfoDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

// Declared before AddressDto: `emitDecoratorMetadata` references the class at
// decoration time, so a forward reference throws at module load.
class GpsCoordinatesDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

class AddressDto {
  @IsString()
  @IsNotEmpty()
  zone: string;

  @IsString()
  @IsNotEmpty()
  wereda: string;

  @IsString()
  @IsNotEmpty()
  kebele: string;

  @IsString()
  @IsOptional()
  houseNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GpsCoordinatesDto)
  gpsCoordinates?: GpsCoordinatesDto;
}

class MedicalHistoryDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  chronicConditions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  previousAdverseReactions?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateMotherDto {
  /**
   * Date the TT schedule is anchored to, normally the pregnancy/registration
   * date. TT1 is due on this date and the remaining doses follow from it.
   * Defaults to the current date when omitted.
   */
  @IsDateString()
  @IsOptional()
  scheduleReferenceDate?: string;

  @ValidateNested()
  @Type(() => PersonalInfoDto)
  @IsNotEmpty()
  personalInfo: PersonalInfoDto;

  @ValidateNested()
  @Type(() => ContactInfoDto)
  @IsNotEmpty()
  contactInfo: ContactInfoDto;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;

  @ValidateNested()
  @Type(() => MedicalHistoryDto)
  @IsOptional()
  medicalHistory?: MedicalHistoryDto;
}

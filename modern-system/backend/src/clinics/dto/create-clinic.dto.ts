import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class ContactInfoDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;
}

class GpsCoordinatesDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
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
  street?: string;

  @IsString()
  @IsOptional()
  building?: string;

  @ValidateNested()
  @Type(() => GpsCoordinatesDto)
  @IsNotEmpty()
  gpsCoordinates: GpsCoordinatesDto;
}

class FacilitiesDto {
  @IsBoolean()
  @IsOptional()
  hasColdStorage?: boolean;

  @IsBoolean()
  @IsOptional()
  hasGenerator?: boolean;

  @IsBoolean()
  @IsOptional()
  hasInternet?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  capacity?: number;
}

class OperatingHoursDto {
  @IsString()
  @IsOptional()
  open?: string;

  @IsString()
  @IsOptional()
  close?: string;
}

class WeeklyOperatingHoursDto {
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  monday?: OperatingHoursDto;

  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  tuesday?: OperatingHoursDto;

  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  wednesday?: OperatingHoursDto;

  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  thursday?: OperatingHoursDto;

  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  friday?: OperatingHoursDto;

  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  saturday?: OperatingHoursDto;

  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  sunday?: OperatingHoursDto;
}

export class CreateClinicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['hospital', 'health_center', 'clinic', 'health_post'])
  @IsNotEmpty()
  type: 'hospital' | 'health_center' | 'clinic' | 'health_post';

  @ValidateNested()
  @Type(() => ContactInfoDto)
  @IsNotEmpty()
  contactInfo: ContactInfoDto;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;

  @ValidateNested()
  @Type(() => FacilitiesDto)
  @IsOptional()
  facilities?: FacilitiesDto;

  @ValidateNested()
  @Type(() => WeeklyOperatingHoursDto)
  @IsOptional()
  operatingHours?: WeeklyOperatingHoursDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  vaccineTypes?: string[];

  @IsString()
  @IsOptional()
  createdBy?: string;
}

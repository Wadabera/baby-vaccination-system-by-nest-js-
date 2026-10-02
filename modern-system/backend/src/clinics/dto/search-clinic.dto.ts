import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchClinicDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  maxDistanceKm?: number;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  wereda?: string;

  @IsOptional()
  @IsString()
  kebele?: string;

  @IsOptional()
  @IsEnum(['hospital', 'health_center', 'clinic', 'health_post'])
  type?: 'hospital' | 'health_center' | 'clinic' | 'health_post';

  @IsOptional()
  @IsString()
  name?: string;
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateClinicDto } from './create-clinic.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateClinicDto extends PartialType(CreateClinicDto) {
  @IsString()
  @IsOptional()
  updatedBy?: string;
}

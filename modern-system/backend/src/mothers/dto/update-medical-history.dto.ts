import { IsArray, IsString, IsOptional } from 'class-validator';

export class UpdateMedicalHistoryDto {
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

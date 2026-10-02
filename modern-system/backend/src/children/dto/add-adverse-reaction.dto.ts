import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsMongoId,
} from 'class-validator';

export class AddAdverseReactionDto {
  @IsString()
  @IsNotEmpty()
  vaccineType: string;

  @IsString()
  @IsNotEmpty()
  reaction: string;

  @IsEnum(['mild', 'moderate', 'severe'])
  @IsNotEmpty()
  severity: 'mild' | 'moderate' | 'severe';

  @IsMongoId()
  @IsNotEmpty()
  reportedBy: string;

  @IsString()
  @IsOptional()
  treatment?: string;
}

import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class AddContraindicationDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsMongoId()
  @IsNotEmpty()
  flaggedBy: string;
}

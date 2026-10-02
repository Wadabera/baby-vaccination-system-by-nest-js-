import { IsOptional, IsBoolean } from 'class-validator';

export class GenerateDigitalCardDto {
  @IsBoolean()
  @IsOptional()
  includeQRCode?: boolean = true;

  @IsBoolean()
  @IsOptional()
  generateShareToken?: boolean = false;
}

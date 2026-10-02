import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class LinkChildDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  childId: string;
}

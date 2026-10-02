import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  category: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString({ each: true })
  images?: string[];
}

export class UpdatePostDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString({ each: true }) images?: string[];
}

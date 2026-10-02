import { IsMongoId, IsNotEmpty, IsEnum } from 'class-validator';

export class AssignStaffDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsEnum(['doctor', 'nurse', 'admin'])
  @IsNotEmpty()
  role: 'doctor' | 'nurse' | 'admin';
}

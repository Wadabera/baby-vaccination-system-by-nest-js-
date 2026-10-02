import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsNumber,
  IsDateString,
  Min,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * DTO for recording vaccination administration
 * Requirements 4.5, 5.3, 9.5: Vaccine batch tracking, healthcare worker assignment, clinic location
 */
export class RecordVaccinationDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  doseIndex: number;

  /**
   * Healthcare worker who administered the vaccine.
   *
   * Optional on the wire: the controller always overrides this with the
   * signed-in user taken from the JWT, so a client cannot record a dose in
   * someone else's name.
   */
  @IsMongoId()
  @IsOptional()
  administeredBy?: string;

  /**
   * Vaccine batch number for tracking and quality control
   * Format: Alphanumeric, 6-20 characters (e.g., "BATCH123456", "VAC-2024-001")
   * Required for proper vaccine traceability
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]{6,20}$/i, {
    message:
      'Batch number must be 6-20 alphanumeric characters (letters, numbers, hyphens only)',
  })
  batchNumber: string;

  /**
   * Clinic where vaccination was administered
   * Must be a valid clinic ID
   */
  @IsMongoId()
  @IsNotEmpty()
  clinicId: string;

  /**
   * Doctor who approved the vaccination (optional)
   * Must be a valid user ID with doctor role if provided
   */
  @IsMongoId()
  @IsOptional()
  approvedBy?: string;

  /**
   * Additional notes about the vaccination administration
   */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

/**
 * Record a dose by name rather than array position, which is what the mother's
 * TT schedule uses (`TT1`, `TT2`, ... `RH`).
 */
export class RecordDoseDto {
  @IsString()
  @IsNotEmpty()
  vaccineName: string;

  @IsString()
  @IsOptional()
  @IsDateString()
  givenDate?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Z0-9-]{6,20}$/i, {
    message:
      'Batch number must be 6-20 alphanumeric characters (letters, numbers, hyphens only)',
  })
  batchNumber?: string;

  @IsMongoId()
  @IsOptional()
  clinicId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

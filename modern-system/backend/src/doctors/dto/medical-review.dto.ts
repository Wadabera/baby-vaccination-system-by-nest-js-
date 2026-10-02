import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';

/**
 * DTO for medical history review
 * Requirement 21.1: Medical history review system
 */
export class MedicalReviewDto {
  @IsNotEmpty()
  @IsString()
  patientId: string; // Child ID

  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergiesReviewed?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditionsReviewed?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previousAdverseReactionsReviewed?: string[];

  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @IsOptional()
  @IsEnum(['safe_to_vaccinate', 'requires_approval', 'contraindicated'])
  recommendation?:
    | 'safe_to_vaccinate'
    | 'requires_approval'
    | 'contraindicated';
}

/**
 * Response DTO for medical review
 */
export class MedicalReviewResponseDto {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  reviewDate: Date;
  allergies: string[];
  chronicConditions: string[];
  previousAdverseReactions: {
    vaccineType: string;
    reaction: string;
    severity: string;
    dateReported: Date;
  }[];
  activeContraindications: {
    type: string;
    reason: string;
    flaggedBy: string;
    dateFlagged: Date;
  }[];
  vaccinationHistory: {
    vaccineName: string;
    status: string;
    dueDate: Date;
    givenDate?: Date;
  }[];
  clinicalNotes?: string;
  recommendation?:
    | 'safe_to_vaccinate'
    | 'requires_approval'
    | 'contraindicated';
}

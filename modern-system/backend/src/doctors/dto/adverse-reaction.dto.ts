import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';

/**
 * DTO for reporting adverse reactions
 * Requirement 21.8: Adverse reaction tracking system
 */
export class ReportAdverseReactionDto {
  @IsNotEmpty()
  @IsString()
  childId: string;

  @IsNotEmpty()
  @IsString()
  vaccineType: string;

  @IsNotEmpty()
  @IsString()
  reaction: string; // Description of the reaction

  @IsNotEmpty()
  @IsEnum(['mild', 'moderate', 'severe', 'life_threatening'])
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';

  @IsNotEmpty()
  @IsString()
  reportedBy: string; // Doctor ID

  @IsOptional()
  @IsString()
  treatment?: string; // Treatment provided

  @IsOptional()
  @IsDateString()
  onsetDate?: string; // When the reaction started

  @IsOptional()
  @IsString()
  duration?: string; // How long the reaction lasted

  @IsOptional()
  @IsString()
  outcome?: string; // Final outcome (recovered, ongoing, etc.)

  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string; // Vaccine batch number if known
}

/**
 * DTO for updating adverse reaction
 * Requirement 21.9: Severity classification
 */
export class UpdateAdverseReactionDto {
  @IsNotEmpty()
  @IsString()
  childId: string;

  @IsNotEmpty()
  @IsString()
  reactionId: string;

  @IsOptional()
  @IsEnum(['mild', 'moderate', 'severe', 'life_threatening'])
  severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  followUpNotes?: string;

  @IsNotEmpty()
  @IsString()
  updatedBy: string; // Doctor ID
}

/**
 * Response DTO for adverse reaction
 */
export class AdverseReactionResponseDto {
  id: string;
  childId: string;
  childName: string;
  vaccineType: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  dateReported: Date;
  reportedBy: string;
  reportedByName: string;
  treatment?: string;
  onsetDate?: Date;
  duration?: string;
  outcome?: string;
  clinicalNotes?: string;
  batchNumber?: string;
  followUpRequired: boolean;
  auditTrail: {
    action: string;
    performedBy: string;
    performedAt: Date;
    notes: string;
  }[];
}

/**
 * DTO for treatment documentation
 * Requirement 21.10: Treatment documentation
 */
export class DocumentTreatmentDto {
  @IsNotEmpty()
  @IsString()
  childId: string;

  @IsNotEmpty()
  @IsString()
  reactionId: string;

  @IsNotEmpty()
  @IsString()
  treatment: string;

  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsOptional()
  @IsString()
  medications?: string;

  @IsOptional()
  @IsString()
  procedures?: string;

  @IsOptional()
  @IsString()
  followUpPlan?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}

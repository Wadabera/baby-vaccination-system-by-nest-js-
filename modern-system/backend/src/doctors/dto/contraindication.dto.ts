import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

/**
 * DTO for flagging contraindications
 * Requirement 21.3: Contraindication flagging system
 */
export class FlagContraindicationDto {
  @IsNotEmpty()
  @IsString()
  childId: string;

  @IsNotEmpty()
  @IsString()
  type: string; // e.g., "Severe Allergy", "Immunodeficiency", "Previous Adverse Reaction"

  @IsNotEmpty()
  @IsString()
  reason: string; // Detailed medical reason

  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsOptional()
  @IsString()
  clinicalEvidence?: string; // Supporting evidence or test results

  @IsOptional()
  @IsEnum(['permanent', 'temporary', 'conditional'])
  duration?: 'permanent' | 'temporary' | 'conditional';

  @IsOptional()
  @IsString()
  reviewDate?: string; // For temporary contraindications
}

/**
 * DTO for removing/deactivating contraindications
 */
export class RemoveContraindicationDto {
  @IsNotEmpty()
  @IsString()
  childId: string;

  @IsNotEmpty()
  @IsString()
  contraindicationId: string;

  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsNotEmpty()
  @IsString()
  removalReason: string; // Why the contraindication is being removed

  @IsOptional()
  @IsString()
  clinicalEvidence?: string; // Supporting evidence for removal
}

/**
 * Response DTO for contraindication
 */
export class ContraindicationResponseDto {
  id: string;
  childId: string;
  childName: string;
  type: string;
  reason: string;
  flaggedBy: string;
  flaggedByName: string;
  dateFlagged: Date;
  isActive: boolean;
  clinicalEvidence?: string;
  duration?: 'permanent' | 'temporary' | 'conditional';
  reviewDate?: Date;
  auditTrail: {
    action: string;
    performedBy: string;
    performedAt: Date;
    reason: string;
  }[];
}

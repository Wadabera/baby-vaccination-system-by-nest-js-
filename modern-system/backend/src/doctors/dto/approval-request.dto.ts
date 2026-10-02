import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';

/**
 * DTO for vaccination approval request
 * Requirement 21.2: Doctor approval system for vaccinations
 */
export class ApprovalRequestDto {
  @IsNotEmpty()
  @IsString()
  childId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  doseIndex: number;

  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsNotEmpty()
  @IsEnum(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @IsNotEmpty()
  @IsString()
  medicalJustification: string; // Mandatory justification

  @IsOptional()
  @IsString()
  conditions?: string; // Special conditions or instructions

  @IsOptional()
  @IsString()
  alternativeRecommendation?: string; // If rejected, suggest alternative
}

/**
 * Response DTO for approval request
 */
export class ApprovalResponseDto {
  approvalId: string;
  childId: string;
  childName: string;
  doseIndex: number;
  vaccineName: string;
  doctorId: string;
  doctorName: string;
  decision: 'approved' | 'rejected';
  medicalJustification: string;
  conditions?: string;
  alternativeRecommendation?: string;
  approvalDate: Date;
  status: 'pending' | 'completed' | 'expired';
}

/**
 * DTO for dual doctor approval (against medical advice)
 * Requirement 21.6: Dual doctor approval for vaccinations against medical advice
 */
export class DualApprovalRequestDto {
  @IsNotEmpty()
  @IsString()
  childId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  doseIndex: number;

  @IsNotEmpty()
  @IsString()
  primaryDoctorId: string;

  @IsNotEmpty()
  @IsString()
  secondaryDoctorId: string;

  @IsNotEmpty()
  @IsString()
  primaryJustification: string;

  @IsNotEmpty()
  @IsString()
  secondaryJustification: string;

  @IsNotEmpty()
  @IsString()
  rationale: string; // Why vaccination is needed despite medical advice

  @IsOptional()
  @IsString()
  parentConsent?: string; // Documentation of informed consent
}

export class VaccineDoseResponseDto {
  vaccineName: string;
  dueDate: Date;
  status: string;
  givenDate?: Date;
  batchNumber?: string;
  administeredBy?: string;
  clinicId?: string;
  approvedBy?: string;
  notes?: string;
}

export class ContraindicationResponseDto {
  type: string;
  reason: string;
  flaggedBy: string;
  dateFlagged: Date;
  isActive: boolean;
}

export class AdverseReactionResponseDto {
  vaccineType: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  dateReported: Date;
  reportedBy: string;
  treatment?: string;
}

export class MedicalInfoResponseDto {
  birthWeight?: number;
  birthHeight?: number;
  allergies: string[];
  contraindications: ContraindicationResponseDto[];
  adverseReactions: AdverseReactionResponseDto[];
}

export class PersonalInfoResponseDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: Date;
  bloodType?: string;
  photoUrl?: string;
}

export class DigitalCardResponseDto {
  qrCode?: string;
  lastGenerated?: Date;
  version: number;
  shareToken?: string;
}

export class ChildProfileResponseDto {
  _id: string;
  childId: string;
  motherId: string;
  clinicId?: string;
  personalInfo: PersonalInfoResponseDto;
  schedule: VaccineDoseResponseDto[];
  medicalInfo: MedicalInfoResponseDto;
  digitalCard?: DigitalCardResponseDto;
  audit: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
  };
  isActive: boolean;
}

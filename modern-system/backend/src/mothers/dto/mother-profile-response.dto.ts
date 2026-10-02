export class MotherProfileResponseDto {
  _id: string;
  motherId: string;
  personalInfo: {
    firstName: string;
    middleName?: string;
    lastName: string;
    birthDate: Date;
    bloodType?: string;
    photoUrl?: string;
  };
  contactInfo: {
    phoneNumber: string;
    alternatePhone?: string;
    email?: string;
  };
  address: {
    zone: string;
    wereda: string;
    kebele: string;
    houseNumber?: string;
    gpsCoordinates?: {
      lat: number;
      lng: number;
    };
  };
  schedule: Array<{
    vaccineName: string;
    dueDate: Date;
    status: string;
    givenDate?: Date;
    batchNumber?: string;
  }>;
  medicalHistory: {
    allergies: string[];
    chronicConditions: string[];
    previousAdverseReactions: string[];
    notes?: string;
  };
  children: Array<{
    _id: string;
    childId: string;
    personalInfo: {
      firstName: string;
      middleName?: string;
      lastName: string;
      birthDate: Date;
      bloodType?: string;
      photoUrl?: string;
    };
    schedule: Array<{
      vaccineName: string;
      dueDate: Date;
      status: string;
      givenDate?: Date;
    }>;
    medicalInfo: {
      birthWeight?: number;
      birthHeight?: number;
      allergies: string[];
      contraindications: any[];
      adverseReactions: any[];
    };
  }>;
  audit: {
    createdAt: Date;
    updatedAt: Date;
  };
  isActive: boolean;
}

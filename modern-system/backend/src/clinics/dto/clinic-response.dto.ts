export class ClinicResponseDto {
  id: string;
  clinicId: string;
  name: string;
  type: string;
  contactInfo: {
    phone: string;
    email?: string;
    emergencyContact?: string;
  };
  address: {
    zone: string;
    wereda: string;
    kebele: string;
    street?: string;
    building?: string;
    gpsCoordinates: {
      lat: number;
      lng: number;
    };
  };
  facilities: {
    hasColdStorage: boolean;
    hasGenerator: boolean;
    hasInternet: boolean;
    capacity: number;
  };
  staff?: {
    doctorIds: string[];
    nurseIds: string[];
    adminIds: string[];
  };
  inventory?: {
    vaccineTypes: string[];
    lastRestocked?: Date;
    currentStock: Record<string, number>;
  };
  operatingHours?: Record<string, { open: string; close: string }>;
  distance?: number; // Distance in kilometers (for geospatial queries)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

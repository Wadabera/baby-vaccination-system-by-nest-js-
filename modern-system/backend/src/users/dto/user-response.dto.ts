import { UserRole } from '../schemas/user.schema';

export class UserProfileResponseDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;
  photoUrl?: string;
  birthDate?: Date;
}

export class UserSettingsResponseDto {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
  timezone: string;
}

export class UserSecurityResponseDto {
  lastLogin: Date | null;
  failedAttempts: number;
  lockedUntil: Date | null;
  mfaEnabled: boolean;
}

export class UserAuditResponseDto {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class UserResponseDto {
  id: string;
  username?: string;
  email: string;
  role: UserRole;
  profile: UserProfileResponseDto;
  clinicId?: string;
  childrenIds: string[];
  settings: UserSettingsResponseDto;
  security: UserSecurityResponseDto;
  audit: UserAuditResponseDto;
  isActive: boolean;
}

import { UserRole } from '../../users/schemas/user.schema';

export class UserProfileAuthDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;
  photoUrl?: string;
}

export class UserSettingsAuthDto {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
  timezone: string;
}

export class UserAuthDto {
  id: string;
  username?: string;
  email: string;
  role: UserRole;
  profile: UserProfileAuthDto;
  clinicId?: string;
  settings: UserSettingsAuthDto;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserAuthDto;
  sessionToken?: string;
}

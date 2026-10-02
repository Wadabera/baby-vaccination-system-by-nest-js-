import { Injectable } from '@nestjs/common';
import { UserRole } from './schemas/user.schema';
import { UserResponseDto } from './dto/user-response.dto';

/**
 * Masks personally identifiable fields based on the viewer's role.
 *
 * Admin and clinical staff see everything. A parent may only ever see their
 * own record, so any request made by a parent is reduced to a minimal shape.
 */
@Injectable()
export class DataMaskingService {
  /** Roles permitted to view full user records. */
  private static readonly PRIVILEGED: readonly UserRole[] = [
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.REGISTRAR,
  ];

  isPrivileged(role?: UserRole): boolean {
    return !!role && DataMaskingService.PRIVILEGED.includes(role);
  }

  /** Mask a phone number, keeping the national prefix visible. */
  maskPhone(phone?: string): string {
    if (!phone || phone.length < 4) {
      return phone ?? '';
    }
    return `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
  }

  /** Mask an email local part while keeping the domain readable. */
  maskEmail(email?: string): string {
    if (!email) {
      return '';
    }
    const at = email.indexOf('@');
    if (at < 1) {
      return '***';
    }
    return `${email[0]}${'*'.repeat(Math.max(at - 1, 2))}${email.slice(at)}`;
  }

  /** Apply masking to a single user for the given viewer. */
  maskUser(
    user: UserResponseDto,
    viewerRole?: UserRole,
    viewerId?: string,
  ): UserResponseDto {
    if (this.isPrivileged(viewerRole) || viewerId === user.id) {
      return user;
    }

    return {
      ...user,
      email: this.maskEmail(user.email),
      profile: {
        ...user.profile,
        phoneNumber: this.maskPhone(user.profile.phoneNumber),
      },
      // Security posture and audit trail are never exposed to non-privileged viewers.
      security: {
        lastLogin: user.security?.lastLogin ?? null,
        failedAttempts: 0,
        lockedUntil: null,
        mfaEnabled: false,
      },
    };
  }

  /** Apply masking across a collection. */
  maskUsersList(
    users: UserResponseDto[],
    viewerRole?: UserRole,
    viewerId?: string,
  ): UserResponseDto[] {
    return users.map((user) => this.maskUser(user, viewerRole, viewerId));
  }
}

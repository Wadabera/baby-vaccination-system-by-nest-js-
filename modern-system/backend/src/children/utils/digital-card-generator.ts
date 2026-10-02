import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

export interface DigitalCardData {
  childId: string;
  childName: string;
  birthDate: Date;
  vaccinations: {
    name: string;
    dueDate: Date;
    status: string;
    givenDate?: Date;
  }[];
  qrCodeUrl?: string;
  shareToken?: string;
}

/**
 * Generate a QR code for a child's vaccination record
 * Requirement 7.2: QR code links to child's vaccination record
 */
export async function generateQRCode(
  childId: string,
  baseUrl: string = '',
): Promise<string> {
  const url = `${baseUrl}/vaccination-card/${childId}`;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Generate a secure share token for vaccination card
 * Requirement 7.4: Card sharing system allows parents to share records
 */
export function generateShareToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Prepare digital card data for PDF generation
 * Requirement 7.1: Digital vaccination card system with child info and vaccination history
 */
export function prepareDigitalCardData(
  child: any,
  includeQRCode: boolean = true,
  qrCodeDataUrl?: string,
  shareToken?: string,
): DigitalCardData {
  // Build child name, handling optional middle name
  const nameParts = [
    child.personalInfo.firstName,
    child.personalInfo.middleName,
    child.personalInfo.lastName,
  ].filter(Boolean); // Remove undefined/null/empty values

  const cardData: DigitalCardData = {
    childId: child.childId,
    childName: nameParts.join(' '),
    birthDate: child.personalInfo.birthDate,
    vaccinations: child.schedule.map((dose: any) => ({
      name: dose.vaccineName,
      dueDate: dose.dueDate,
      status: dose.status,
      givenDate: dose.givenDate,
    })),
  };

  if (includeQRCode && qrCodeDataUrl) {
    cardData.qrCodeUrl = qrCodeDataUrl;
  }

  if (shareToken) {
    cardData.shareToken = shareToken;
  }

  return cardData;
}

/**
 * Calculate vaccination completion percentage
 */
export function calculateVaccinationProgress(schedule: any[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = schedule.length;
  const completed = schedule.filter(
    (dose) => dose.status === 'completed',
  ).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * Get upcoming vaccinations (next 30 days)
 */
export function getUpcomingVaccinations(schedule: any[]): any[] {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  return schedule.filter((dose) => {
    if (dose.status !== 'pending') return false;
    const dueDate = new Date(dose.dueDate);
    return dueDate >= now && dueDate <= thirtyDaysFromNow;
  });
}

/**
 * Get overdue vaccinations
 */
export function getOverdueVaccinations(schedule: any[]): any[] {
  const now = new Date();
  return schedule.filter((dose) => {
    if (dose.status !== 'pending') return false;
    const dueDate = new Date(dose.dueDate);
    return dueDate < now;
  });
}

/**
 * Update vaccination statuses based on due dates
 * Requirement 5.4: System highlights overdue vaccinations
 */
export function updateVaccinationStatuses(schedule: any[]): any[] {
  const now = new Date();

  return schedule.map((dose) => {
    if (dose.status === 'pending') {
      const dueDate = new Date(dose.dueDate);
      if (dueDate < now) {
        return { ...dose, status: 'overdue' };
      }
    }
    return dose;
  });
}

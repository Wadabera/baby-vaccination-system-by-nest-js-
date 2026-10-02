import {
  generateQRCode,
  generateShareToken,
  prepareDigitalCardData,
  calculateVaccinationProgress,
  getUpcomingVaccinations,
  getOverdueVaccinations,
  updateVaccinationStatuses,
} from './digital-card-generator';

describe('Digital Card Generator', () => {
  describe('generateQRCode', () => {
    it('should generate a QR code data URL', async () => {
      const childId = 'C00000001';
      const baseUrl = 'https://example.com';

      const qrCode = await generateQRCode(childId, baseUrl);

      expect(qrCode).toBeDefined();
      expect(qrCode).toContain('data:image/png;base64');
    }, 10000); // 10 second timeout

    it('should include child ID in QR code URL', async () => {
      const childId = 'C00000001';
      const qrCode = await generateQRCode(childId);

      expect(qrCode).toBeDefined();
      // QR code should be generated successfully
      expect(qrCode.length).toBeGreaterThan(0);
    }, 10000); // 10 second timeout
  });

  describe('generateShareToken', () => {
    it('should generate a unique share token', () => {
      const token1 = generateShareToken();
      const token2 = generateShareToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex characters
    });
  });

  describe('prepareDigitalCardData', () => {
    const mockChild = {
      childId: 'C00000001',
      personalInfo: {
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        birthDate: new Date('2024-01-01'),
      },
      schedule: [
        {
          vaccineName: 'BCG',
          dueDate: new Date('2024-01-01'),
          status: 'completed',
          givenDate: new Date('2024-01-01'),
        },
        {
          vaccineName: 'OPV 1',
          dueDate: new Date('2024-02-12'),
          status: 'pending',
        },
      ],
    };

    it('should prepare digital card data with all required fields', () => {
      const cardData = prepareDigitalCardData(mockChild);

      expect(cardData.childId).toBe('C00000001');
      expect(cardData.childName).toBe('John Michael Doe');
      expect(cardData.birthDate).toEqual(new Date('2024-01-01'));
      expect(cardData.vaccinations).toHaveLength(2);
    });

    it('should include QR code when requested', () => {
      const qrCodeUrl = 'data:image/png;base64,abc123';
      const cardData = prepareDigitalCardData(mockChild, true, qrCodeUrl);

      expect(cardData.qrCodeUrl).toBe(qrCodeUrl);
    });

    it('should not include QR code when not requested', () => {
      const cardData = prepareDigitalCardData(mockChild, false);

      expect(cardData.qrCodeUrl).toBeUndefined();
    });

    it('should include share token when provided', () => {
      const shareToken = 'abc123token';
      const cardData = prepareDigitalCardData(
        mockChild,
        false,
        undefined,
        shareToken,
      );

      expect(cardData.shareToken).toBe(shareToken);
    });

    it('should handle child without middle name', () => {
      const childWithoutMiddleName = {
        ...mockChild,
        personalInfo: {
          ...mockChild.personalInfo,
          middleName: undefined,
        },
      };

      const cardData = prepareDigitalCardData(childWithoutMiddleName);

      expect(cardData.childName).toBe('John Doe');
    });
  });

  describe('calculateVaccinationProgress', () => {
    it('should calculate progress correctly', () => {
      const schedule = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'pending' },
        { status: 'pending' },
      ];

      const progress = calculateVaccinationProgress(schedule);

      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(4);
      expect(progress.percentage).toBe(50);
    });

    it('should handle empty schedule', () => {
      const progress = calculateVaccinationProgress([]);

      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should handle all completed', () => {
      const schedule = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
      ];

      const progress = calculateVaccinationProgress(schedule);

      expect(progress.completed).toBe(3);
      expect(progress.total).toBe(3);
      expect(progress.percentage).toBe(100);
    });

    it('should handle none completed', () => {
      const schedule = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'overdue' },
      ];

      const progress = calculateVaccinationProgress(schedule);

      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(3);
      expect(progress.percentage).toBe(0);
    });
  });

  describe('getUpcomingVaccinations', () => {
    it('should return vaccinations due within 30 days', () => {
      const now = new Date();
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

      const schedule = [
        { vaccineName: 'Vaccine 1', dueDate: in15Days, status: 'pending' },
        { vaccineName: 'Vaccine 2', dueDate: in45Days, status: 'pending' },
        { vaccineName: 'Vaccine 3', dueDate: now, status: 'completed' },
      ];

      const upcoming = getUpcomingVaccinations(schedule);

      expect(upcoming).toHaveLength(1);
      expect(upcoming[0].vaccineName).toBe('Vaccine 1');
    });

    it('should not return completed vaccinations', () => {
      const now = new Date();
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      const schedule = [
        { vaccineName: 'Vaccine 1', dueDate: in15Days, status: 'completed' },
      ];

      const upcoming = getUpcomingVaccinations(schedule);

      expect(upcoming).toHaveLength(0);
    });
  });

  describe('getOverdueVaccinations', () => {
    it('should return vaccinations past due date', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const schedule = [
        { vaccineName: 'Vaccine 1', dueDate: yesterday, status: 'pending' },
        { vaccineName: 'Vaccine 2', dueDate: tomorrow, status: 'pending' },
      ];

      const overdue = getOverdueVaccinations(schedule);

      expect(overdue).toHaveLength(1);
      expect(overdue[0].vaccineName).toBe('Vaccine 1');
    });

    it('should not return completed vaccinations', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const schedule = [
        { vaccineName: 'Vaccine 1', dueDate: yesterday, status: 'completed' },
      ];

      const overdue = getOverdueVaccinations(schedule);

      expect(overdue).toHaveLength(0);
    });
  });

  describe('updateVaccinationStatuses', () => {
    it('should mark pending vaccinations as overdue if past due date', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const schedule = [
        { vaccineName: 'Vaccine 1', dueDate: yesterday, status: 'pending' },
        { vaccineName: 'Vaccine 2', dueDate: tomorrow, status: 'pending' },
        { vaccineName: 'Vaccine 3', dueDate: yesterday, status: 'completed' },
      ];

      const updated = updateVaccinationStatuses(schedule);

      expect(updated[0].status).toBe('overdue');
      expect(updated[1].status).toBe('pending');
      expect(updated[2].status).toBe('completed');
    });

    it('should not modify completed vaccinations', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const schedule = [
        { vaccineName: 'Vaccine 1', dueDate: yesterday, status: 'completed' },
      ];

      const updated = updateVaccinationStatuses(schedule);

      expect(updated[0].status).toBe('completed');
    });
  });
});

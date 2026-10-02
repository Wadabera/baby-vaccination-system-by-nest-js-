import { generateSchedule, VACCINE_PROTOCOLS } from './schedule-generator';

describe('Schedule Generator', () => {
  describe('generateSchedule', () => {
    it('should generate correct number of vaccine doses', () => {
      const birthDate = new Date('2024-01-01');
      const schedule = generateSchedule(birthDate);

      expect(schedule).toHaveLength(VACCINE_PROTOCOLS.length);
    });

    it('should generate BCG and OPV 0 at birth (day 0)', () => {
      const birthDate = new Date('2024-01-01');
      const schedule = generateSchedule(birthDate);

      const bcg = schedule.find((dose) => dose.vaccineName === 'BCG');
      const opv0 = schedule.find((dose) => dose.vaccineName === 'OPV 0');

      expect(bcg).toBeDefined();
      expect(opv0).toBeDefined();
      expect(bcg?.dueDate).toEqual(birthDate);
      expect(opv0?.dueDate).toEqual(birthDate);
    });

    it('should generate 6-week vaccines at correct date', () => {
      const birthDate = new Date('2024-01-01');
      const schedule = generateSchedule(birthDate);

      const opv1 = schedule.find((dose) => dose.vaccineName === 'OPV 1');
      const penta1 = schedule.find(
        (dose) => dose.vaccineName === 'Pentavalent 1',
      );
      const pcv1 = schedule.find((dose) => dose.vaccineName === 'PCV 1');
      const rota1 = schedule.find((dose) => dose.vaccineName === 'Rota 1');

      const expectedDate = new Date('2024-01-01');
      expectedDate.setDate(expectedDate.getDate() + 42); // 6 weeks = 42 days

      expect(opv1?.dueDate).toEqual(expectedDate);
      expect(penta1?.dueDate).toEqual(expectedDate);
      expect(pcv1?.dueDate).toEqual(expectedDate);
      expect(rota1?.dueDate).toEqual(expectedDate);
    });

    it('should generate 10-week vaccines at correct date', () => {
      const birthDate = new Date('2024-01-01');
      const schedule = generateSchedule(birthDate);

      const opv2 = schedule.find((dose) => dose.vaccineName === 'OPV 2');
      const penta2 = schedule.find(
        (dose) => dose.vaccineName === 'Pentavalent 2',
      );

      const expectedDate = new Date('2024-01-01');
      expectedDate.setDate(expectedDate.getDate() + 70); // 10 weeks = 70 days

      expect(opv2?.dueDate).toEqual(expectedDate);
      expect(penta2?.dueDate).toEqual(expectedDate);
    });

    it('should generate 14-week vaccines at correct date', () => {
      const birthDate = new Date('2024-01-01');
      const schedule = generateSchedule(birthDate);

      const opv3 = schedule.find((dose) => dose.vaccineName === 'OPV 3');
      const penta3 = schedule.find(
        (dose) => dose.vaccineName === 'Pentavalent 3',
      );
      const pcv3 = schedule.find((dose) => dose.vaccineName === 'PCV 3');
      const ipv = schedule.find((dose) => dose.vaccineName === 'IPV');

      const expectedDate = new Date('2024-01-01');
      expectedDate.setDate(expectedDate.getDate() + 98); // 14 weeks = 98 days

      expect(opv3?.dueDate).toEqual(expectedDate);
      expect(penta3?.dueDate).toEqual(expectedDate);
      expect(pcv3?.dueDate).toEqual(expectedDate);
      expect(ipv?.dueDate).toEqual(expectedDate);
    });

    it('should generate 9-month vaccines at correct date', () => {
      const birthDate = new Date('2024-01-01');
      const schedule = generateSchedule(birthDate);

      const measles1 = schedule.find(
        (dose) => dose.vaccineName === 'Measles 1',
      );

      const expectedDate = new Date('2024-01-01');
      expectedDate.setDate(expectedDate.getDate() + 270); // 9 months ≈ 270 days

      expect(measles1?.dueDate).toEqual(expectedDate);
    });

    it('should generate 15-month vaccines at correct date', () => {
      const birthDate = new Date('2024-01-01');
      const schedule = generateSchedule(birthDate);

      const measles2 = schedule.find(
        (dose) => dose.vaccineName === 'Measles 2',
      );

      const expectedDate = new Date('2024-01-01');
      expectedDate.setDate(expectedDate.getDate() + 450); // 15 months ≈ 450 days

      expect(measles2?.dueDate).toEqual(expectedDate);
    });

    it('should set all doses to pending status initially', () => {
      const birthDate = new Date('2024-01-01');
      const schedule = generateSchedule(birthDate);

      schedule.forEach((dose) => {
        expect(dose.status).toBe('pending');
      });
    });

    it('should handle different birth dates correctly', () => {
      const birthDate1 = new Date('2023-06-15');
      const birthDate2 = new Date('2024-12-25');

      const schedule1 = generateSchedule(birthDate1);
      const schedule2 = generateSchedule(birthDate2);

      expect(schedule1).toHaveLength(schedule2.length);
      expect(schedule1[0].dueDate).toEqual(birthDate1);
      expect(schedule2[0].dueDate).toEqual(birthDate2);
    });
  });
});

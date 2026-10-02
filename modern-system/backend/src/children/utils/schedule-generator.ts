export const VACCINE_PROTOCOLS = [
  { name: 'BCG', offsetDays: 0 },
  { name: 'OPV 0', offsetDays: 0 },
  { name: 'OPV 1', offsetDays: 42 }, // 6 weeks
  { name: 'Pentavalent 1', offsetDays: 42 },
  { name: 'PCV 1', offsetDays: 42 },
  { name: 'Rota 1', offsetDays: 42 },
  { name: 'OPV 2', offsetDays: 70 }, // 10 weeks
  { name: 'Pentavalent 2', offsetDays: 70 },
  { name: 'PCV 2', offsetDays: 70 },
  { name: 'Rota 2', offsetDays: 70 },
  { name: 'OPV 3', offsetDays: 98 }, // 14 weeks
  { name: 'Pentavalent 3', offsetDays: 98 },
  { name: 'PCV 3', offsetDays: 98 },
  { name: 'IPV', offsetDays: 98 },
  { name: 'Measles 1', offsetDays: 270 }, // 9 months
  { name: 'Measles 2', offsetDays: 450 }, // 15 months
];

export function generateSchedule(birthDate: Date) {
  return VACCINE_PROTOCOLS.map((protocol) => {
    const dueDate = new Date(birthDate);
    dueDate.setDate(dueDate.getDate() + protocol.offsetDays);
    return {
      vaccineName: protocol.name,
      dueDate,
      status: 'pending',
    };
  });
}

/**
 * Tetanus toxoid schedule for expectant mothers.
 *
 * Replaces the legacy `mother_vaccin` table, which stored bare tt1..tt5/rh
 * flags with no dates. TT1 is given during pregnancy; TT2-TT5 follow the
 * national tetanus-elimination schedule, and RH status is screened in the same
 * clinical visit.
 */
export const MOTHER_VACCINE_PROTOCOLS = [
  {
    name: 'TT1',
    offsetDays: 0,
    description: 'Tetanus toxoid 1 - during pregnancy',
  },
  {
    name: 'TT2',
    offsetDays: 28,
    description: 'Tetanus toxoid 2 - 4 weeks after TT1',
  },
  {
    name: 'TT3',
    offsetDays: 180,
    description: 'Tetanus toxoid 3 - 6 months after TT2',
  },
  {
    name: 'TT4',
    offsetDays: 365,
    description: 'Tetanus toxoid 4 - 12 months after TT3',
  },
  {
    name: 'TT5',
    offsetDays: 730,
    description: 'Tetanus toxoid 5 - 24 months after TT4',
  },
  {
    name: 'RH',
    offsetDays: 0,
    description: 'Rh factor screening and prophylaxis',
  },
];

export function generateMotherSchedule(referenceDate: Date) {
  return MOTHER_VACCINE_PROTOCOLS.map((protocol) => {
    const dueDate = new Date(referenceDate);
    dueDate.setDate(dueDate.getDate() + protocol.offsetDays);
    return {
      vaccineName: protocol.name,
      dueDate,
      status: 'pending',
    };
  });
}

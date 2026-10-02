import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ChildrenService } from './children.service';
import { Child } from './schemas/child.schema';
import {
  ContraindicationEntry,
  AdverseReactionEntry,
} from './schemas/contraindication-entry.schema';
import { MothersService } from '../mothers/mothers.service';
import { UsersService } from '../users/users.service';
import { ClinicsService } from '../clinics/clinics.service';
import { RecordVaccinationDto } from './dto/record-vaccination.dto';
import type { VaccineDose } from './schemas/child.schema';
import { UserRole } from '../users/schemas/user.schema';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Unit tests for vaccination administration system
 * Tests Requirements 4.5, 5.3, 9.5:
 * - Vaccine batch number tracking
 * - Healthcare worker assignment with validation
 * - Clinic location recording
 */
describe('ChildrenService - Vaccination Administration', () => {
  let service: ChildrenService;
  // The suite drives ChildrenService through spies on these collaborators, so
  // only the models need to be reachable from the test body.
  let usersService: UsersService;
  let clinicsService: ClinicsService;

  const mockChildId = new Types.ObjectId();
  const mockMotherId = new Types.ObjectId();
  const mockClinicianId = new Types.ObjectId();
  const mockDoctorId = new Types.ObjectId();
  const mockClinicId = new Types.ObjectId();
  const mockParentId = new Types.ObjectId();

  // Annotated so the tests can read back the optional fields
  // (givenDate, batchNumber, ...) that the service writes onto each dose.
  const mockChild: Record<string, any> & {
    schedule: VaccineDose[];
    save: jest.Mock;
  } = {
    _id: mockChildId,
    childId: 'C00000001',
    motherId: mockMotherId,
    personalInfo: {
      firstName: 'Test',
      lastName: 'Child',
      birthDate: new Date('2024-01-01'),
    },
    schedule: [
      {
        vaccineName: 'BCG',
        dueDate: new Date('2024-01-01'),
        status: 'pending',
      },
      {
        vaccineName: 'OPV 1',
        dueDate: new Date('2024-02-01'),
        status: 'pending',
      },
    ],
    medicalInfo: {
      allergies: [],
      contraindications: [],
      adverseReactions: [],
    },
    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    isActive: true,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockClinician = {
    id: mockClinicianId.toString(),
    email: 'registrar@test.com',
    role: UserRole.REGISTRAR,
    isActive: true,
    profile: {
      firstName: 'Test',
      lastName: 'Registrar',
      phoneNumber: '1234567890',
    },
  };

  const mockDoctor = {
    id: mockDoctorId.toString(),
    email: 'doctor@test.com',
    role: UserRole.DOCTOR,
    isActive: true,
    profile: {
      firstName: 'Test',
      lastName: 'Doctor',
      phoneNumber: '1234567890',
    },
  };

  const mockParent = {
    id: mockParentId.toString(),
    email: 'parent@test.com',
    role: UserRole.PARENT,
    isActive: true,
    profile: {
      firstName: 'Test',
      lastName: 'Parent',
      phoneNumber: '1234567890',
    },
  };

  const mockClinic = {
    _id: mockClinicId,
    clinicId: 'CL000001',
    name: 'Test Clinic',
    isActive: true,
    address: {
      zone: 'Test Zone',
      wereda: 'Test Wereda',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChildrenService,
        {
          provide: getModelToken(Child.name),
          useValue: {
            findById: jest.fn(),
            findOne: jest.fn(),
            countDocuments: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        // Safety gate: both collections return no active blockers by default.
        {
          provide: getModelToken(ContraindicationEntry.name),
          useValue: {
            find: jest.fn(() => ({ exec: jest.fn().mockResolvedValue([]) })),
          },
        },
        {
          provide: getModelToken(AdverseReactionEntry.name),
          useValue: {
            find: jest.fn(() => ({ exec: jest.fn().mockResolvedValue([]) })),
          },
        },
        {
          provide: MothersService,
          useValue: {
            findOne: jest.fn(),
            addChild: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ClinicsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChildrenService>(ChildrenService);
    usersService = module.get<UsersService>(UsersService);
    clinicsService = module.get<ClinicsService>(ClinicsService);

    // Reset mockChild schedule status before each test
    mockChild.schedule[0].status = 'pending';
    mockChild.schedule[0].givenDate = undefined;
    mockChild.schedule[0].batchNumber = undefined;
    mockChild.schedule[0].administeredBy = undefined;
    mockChild.schedule[0].clinicId = undefined;
    mockChild.schedule[0].approvedBy = undefined;
    mockChild.schedule[0].notes = undefined;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordVaccination', () => {
    const validRecordDto: RecordVaccinationDto = {
      doseIndex: 0,
      administeredBy: mockClinicianId.toString(),
      batchNumber: 'BATCH123456',
      clinicId: mockClinicId.toString(),
      notes: 'Vaccination administered successfully',
    };

    it('should successfully record a vaccination with all valid data', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(mockClinician as any);
      jest
        .spyOn(clinicsService, 'findOne')
        .mockResolvedValue(mockClinic as any);
      mockChild.save.mockResolvedValue(mockChild);

      // Act
      const result = await service.recordVaccination(
        mockChildId.toString(),
        validRecordDto,
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockChild.schedule[0].status).toBe('completed');
      expect(mockChild.schedule[0].batchNumber).toBe('BATCH123456');
      expect(mockChild.schedule[0].administeredBy).toEqual(
        new Types.ObjectId(mockClinicianId),
      );
      expect(mockChild.schedule[0].clinicId).toEqual(
        new Types.ObjectId(mockClinicId),
      );
      expect(mockChild.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when child does not exist', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.recordVaccination('invalid-id', validRecordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid dose index', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      const invalidDto = { ...validRecordDto, doseIndex: 99 };

      // Act & Assert
      await expect(
        service.recordVaccination(mockChildId.toString(), invalidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when vaccination is already completed', async () => {
      // Arrange
      const completedChild = {
        ...mockChild,
        schedule: [
          {
            ...mockChild.schedule[0],
            status: 'completed',
          },
        ],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(completedChild as any);

      // Act & Assert
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(/already been administered/);
    });

    it('should throw NotFoundException when healthcare worker does not exist', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(null as unknown as UserResponseDto);

      // Act & Assert
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(/Healthcare worker.*not found/);
    });

    it('should throw ForbiddenException when user is not a clinical role', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockParent as any);

      // Act & Assert
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(/does not have permission to administer vaccinations/);
    });

    it('should throw ForbiddenException when healthcare worker is not active', async () => {
      // Arrange
      const inactiveClinician = { ...mockClinician, isActive: false };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(inactiveClinician as any);

      // Act & Assert
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(/is not active and cannot administer vaccinations/);
    });

    it('should throw NotFoundException when clinic does not exist', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(mockClinician as any);
      jest.spyOn(clinicsService, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(/Clinic.*not found/);
    });

    it('should throw BadRequestException when clinic is not active', async () => {
      // Arrange
      const inactiveClinic = { ...mockClinic, isActive: false };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(mockClinician as any);
      jest
        .spyOn(clinicsService, 'findOne')
        .mockResolvedValue(inactiveClinic as any);

      // Act & Assert
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(/is not active and cannot be used for vaccination/);
    });

    it('should successfully record vaccination with doctor approval', async () => {
      // Arrange
      const dtoWithApproval = {
        ...validRecordDto,
        approvedBy: mockDoctorId.toString(),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValueOnce(mockClinician as any)
        .mockResolvedValueOnce(mockDoctor as any);
      jest
        .spyOn(clinicsService, 'findOne')
        .mockResolvedValue(mockClinic as any);
      mockChild.save.mockResolvedValue(mockChild);

      // Act
      const result = await service.recordVaccination(
        mockChildId.toString(),
        dtoWithApproval,
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockChild.schedule[0].approvedBy).toEqual(
        new Types.ObjectId(mockDoctorId),
      );
    });

    it('should throw NotFoundException when approving doctor does not exist', async () => {
      // Arrange
      const dtoWithApproval = {
        ...validRecordDto,
        approvedBy: 'invalid-doctor-id',
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValueOnce(mockClinician as any) // First call for administeredBy
        // Second call for approvedBy
        .mockResolvedValueOnce(null as unknown as UserResponseDto);
      jest
        .spyOn(clinicsService, 'findOne')
        .mockResolvedValue(mockClinic as any);

      // Act & Assert
      await expect(
        service.recordVaccination(mockChildId.toString(), dtoWithApproval),
      ).rejects.toThrow(/Doctor.*not found/);
    });

    it('should throw ForbiddenException when approver is not a doctor', async () => {
      // Arrange
      const dtoWithApproval = {
        ...validRecordDto,
        approvedBy: mockClinicianId.toString(),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValueOnce(mockClinician as any) // First call for administeredBy
        .mockResolvedValueOnce(mockClinician as any); // Second call for approvedBy - Registrar trying to approve
      jest
        .spyOn(clinicsService, 'findOne')
        .mockResolvedValue(mockClinic as any);

      // Act & Assert
      await expect(
        service.recordVaccination(mockChildId.toString(), dtoWithApproval),
      ).rejects.toThrow(/is not a doctor and cannot approve vaccinations/);
    });

    it('should throw ForbiddenException when child has active contraindications', async () => {
      // Arrange
      const childWithContraindication = {
        ...mockChild,
        medicalInfo: {
          ...mockChild.medicalInfo,
          contraindications: [
            {
              type: 'Allergy',
              reason: 'Severe allergic reaction',
              flaggedBy: mockDoctorId,
              dateFlagged: new Date(),
              isActive: true,
            },
          ],
        },
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(childWithContraindication as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(mockClinician as any);
      jest
        .spyOn(clinicsService, 'findOne')
        .mockResolvedValue(mockClinic as any);

      // Act & Assert
      // An unresolved contraindication is a clinical gate, so it is reported
      // as a bad request naming the blocker.
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.recordVaccination(mockChildId.toString(), validRecordDto),
      ).rejects.toThrow(/contraindication/);
    });

    it('should accept vaccination when contraindications are inactive', async () => {
      // Arrange
      const childWithInactiveContraindication = {
        ...mockChild,
        medicalInfo: {
          ...mockChild.medicalInfo,
          contraindications: [
            {
              type: 'Allergy',
              reason: 'Resolved allergic reaction',
              flaggedBy: mockDoctorId,
              dateFlagged: new Date(),
              isActive: false,
            },
          ],
        },
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(childWithInactiveContraindication as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(mockClinician as any);
      jest
        .spyOn(clinicsService, 'findOne')
        .mockResolvedValue(mockClinic as any);
      mockChild.save.mockResolvedValue(mockChild);

      // Act
      const result = await service.recordVaccination(
        mockChildId.toString(),
        validRecordDto,
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockChild.save).toHaveBeenCalled();
    });

    it('should validate batch number format', async () => {
      // Arrange
      const invalidBatchDto = {
        ...validRecordDto,
        batchNumber: 'ABC', // Too short
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(mockClinician as any);
      jest
        .spyOn(clinicsService, 'findOne')
        .mockResolvedValue(mockClinic as any);

      // Act & Assert
      await expect(
        service.recordVaccination(mockChildId.toString(), invalidBatchDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.recordVaccination(mockChildId.toString(), invalidBatchDto),
      ).rejects.toThrow(/Invalid batch number format/);
    });

    it('should accept various valid batch number formats', async () => {
      // Arrange
      const validBatchNumbers = [
        'BATCH123456',
        'VAC-2024-001',
        'LOT-ABC-123',
        'B123456789',
        '2024-BATCH-001',
      ];

      for (const batchNumber of validBatchNumbers) {
        // Reset mock child status before each iteration
        mockChild.schedule[0].status = 'pending';

        const dto = { ...validRecordDto, batchNumber };
        jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
        jest
          .spyOn(usersService, 'findOne')
          .mockResolvedValue(mockClinician as any);
        jest
          .spyOn(clinicsService, 'findOne')
          .mockResolvedValue(mockClinic as any);
        mockChild.save.mockResolvedValue(mockChild);

        // Act
        const result = await service.recordVaccination(
          mockChildId.toString(),
          dto,
        );

        // Assert
        expect(result).toBeDefined();
        expect(mockChild.schedule[0].batchNumber).toBe(batchNumber);
      }
    });

    it('should allow doctor to administer vaccination', async () => {
      // Arrange
      const dtoWithDoctor = {
        ...validRecordDto,
        administeredBy: mockDoctorId.toString(),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockDoctor as any);
      jest
        .spyOn(clinicsService, 'findOne')
        .mockResolvedValue(mockClinic as any);
      mockChild.save.mockResolvedValue(mockChild);

      // Act
      const result = await service.recordVaccination(
        mockChildId.toString(),
        dtoWithDoctor,
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockChild.schedule[0].administeredBy).toEqual(
        new Types.ObjectId(mockDoctorId),
      );
    });

    it('should update audit information when recording vaccination', async () => {
      // Arrange
      const originalUpdatedAt = mockChild.audit.updatedAt;
      jest.spyOn(service, 'findOne').mockResolvedValue(mockChild as any);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(mockClinician as any);
      jest
        .spyOn(clinicsService, 'findOne')
        .mockResolvedValue(mockClinic as any);
      mockChild.save.mockResolvedValue(mockChild);

      // Act
      await service.recordVaccination(mockChildId.toString(), validRecordDto);

      // Assert
      expect(mockChild.audit.updatedAt).not.toBe(originalUpdatedAt);
    });
  });
});

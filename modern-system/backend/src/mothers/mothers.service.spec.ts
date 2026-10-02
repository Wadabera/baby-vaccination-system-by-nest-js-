import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MothersService } from './mothers.service';
import { Mother } from './schemas/mother.schema';
import { Child } from '../children/schemas/child.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('MothersService - Mother-Child Relationship Management', () => {
  let service: MothersService;
  let motherModel: any;
  let childModel: any;

  const mockMotherId = new Types.ObjectId();
  const mockChildId = new Types.ObjectId();

  /**
   * Mongoose documents resolve `save()` with the document itself, so services
   * that mutate and then save observe the mutated state. Typing the receiver as
   * the enclosing mock would be a circular reference, hence `unknown`.
   */
  const echoingSave = (): jest.Mock =>
    jest.fn(function (this: unknown) {
      return Promise.resolve(this);
    });

  const mockMother = {
    _id: mockMotherId,
    motherId: 'M00000001',
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Doe',
      birthDate: new Date('1990-01-01'),
    },
    contactInfo: {
      phoneNumber: '+251911234567',
    },
    address: {
      zone: 'Zone1',
      wereda: 'Wereda1',
      kebele: 'Kebele1',
    },
    // TT1-TT5 + Rh as dated doses, matching the modern schema.
    schedule: [
      { vaccineName: 'TT1', dueDate: new Date(), status: 'pending' },
      { vaccineName: 'TT2', dueDate: new Date(), status: 'pending' },
      { vaccineName: 'RH', dueDate: new Date(), status: 'pending' },
    ],
    medicalHistory: {
      allergies: [],
      chronicConditions: [],
      previousAdverseReactions: [],
      notes: '',
    },
    childrenIds: [],
    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    isActive: true,
    // Echo the document back the way Mongoose does, so services that mutate
    // then save return the mutated state.
    save: echoingSave(),
  };

  const mockChild = {
    _id: mockChildId,
    childId: 'C00000001',
    motherId: mockMotherId,
    personalInfo: {
      firstName: 'Baby',
      lastName: 'Doe',
      birthDate: new Date('2023-01-01'),
    },
    schedule: [],
    medicalInfo: {
      allergies: [],
      contraindications: [],
      adverseReactions: [],
    },
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const mockMotherModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockMother]),
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMother),
      }),
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMother),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMother),
      }),
      findByIdAndDelete: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMother),
      }),
    };

    const mockChildModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockChild]),
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MothersService,
        {
          provide: getModelToken(Mother.name),
          useValue: mockMotherModel,
        },
        {
          provide: getModelToken(Child.name),
          useValue: mockChildModel,
        },
      ],
    }).compile();

    service = module.get<MothersService>(MothersService);
    motherModel = module.get(getModelToken(Mother.name));
    childModel = module.get(getModelToken(Child.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMotherProfile', () => {
    it('should return mother profile with populated children', async () => {
      const motherWithChildren = {
        ...mockMother,
        childrenIds: [mockChildId],
      };

      motherModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(motherWithChildren),
      });

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(motherWithChildren),
      });

      childModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockChild]),
      });

      const profile = await service.getMotherProfile(mockMotherId.toString());

      expect(profile).toBeDefined();
      expect(profile.motherId).toBe('M00000001');
      expect(profile.children).toHaveLength(1);
      expect(profile.children[0].childId).toBe('C00000001');
    });

    it('should throw NotFoundException if mother not found', async () => {
      motherModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getMotherProfile('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMedicalHistory', () => {
    it('should update medical history', async () => {
      const medicalHistoryDto = {
        allergies: ['Penicillin'],
        chronicConditions: ['Diabetes'],
        notes: 'Test notes',
      };

      motherModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMother),
      });

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMother),
      });

      // The service merges the DTO onto the document and calls `save`, so the
      // mock must echo the mutated document back.
      const updatedMother = {
        ...mockMother,
        medicalHistory: {
          ...mockMother.medicalHistory,
          ...medicalHistoryDto,
        },
        save: echoingSave(),
      };

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedMother),
      });

      const result = await service.updateMedicalHistory(
        mockMotherId.toString(),
        medicalHistoryDto,
      );

      expect(result.medicalHistory.allergies).toContain('Penicillin');
      expect(result.medicalHistory.chronicConditions).toContain('Diabetes');
    });
  });

  describe('linkChild', () => {
    it('should link a child to a mother', async () => {
      const motherWithoutChildren = {
        ...mockMother,
        childrenIds: [],
        save: jest.fn().mockResolvedValue({
          ...mockMother,
          childrenIds: [mockChildId],
        }),
      };

      motherModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(motherWithoutChildren),
      });

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(motherWithoutChildren),
      });

      childModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      await service.linkChild(mockMotherId.toString(), mockChildId.toString());

      expect(motherWithoutChildren.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if mother not found', async () => {
      motherModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.linkChild('invalid-id', mockChildId.toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if child not found', async () => {
      motherModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMother),
      });

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMother),
      });

      childModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.linkChild(mockMotherId.toString(), mockChildId.toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid child ID', async () => {
      motherModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMother),
      });

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMother),
      });

      await expect(
        service.linkChild(mockMotherId.toString(), 'invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unlinkChild', () => {
    it('should unlink a child from a mother', async () => {
      const motherWithChildren = {
        ...mockMother,
        childrenIds: [mockChildId],
        save: echoingSave(),
      };

      motherModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(motherWithChildren),
      });

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(motherWithChildren),
      });

      childModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChild),
      });

      const result = await service.unlinkChild(
        mockMotherId.toString(),
        mockChildId.toString(),
      );

      expect(result.childrenIds).toHaveLength(0);
      expect(motherWithChildren.save).toHaveBeenCalled();
    });
  });

  describe('addAllergy', () => {
    it('should add an allergy to medical history', async () => {
      // Allergies start empty so the service actually performs the push, and
      // `save` echoes the mutated document back as Mongoose does.
      const motherWithSave = {
        ...mockMother,
        medicalHistory: {
          ...mockMother.medicalHistory,
          allergies: [] as string[],
        },
        save: echoingSave(),
      };

      motherModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(motherWithSave),
      });

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(motherWithSave),
      });

      const result = await service.addAllergy(
        mockMotherId.toString(),
        'Penicillin',
      );

      expect(result.medicalHistory.allergies).toContain('Penicillin');
      expect(motherWithSave.save).toHaveBeenCalled();
    });
  });

  describe('getMotherChildren', () => {
    it('should return all children for a mother', async () => {
      const motherWithChildren = {
        ...mockMother,
        childrenIds: [mockChildId],
      };

      motherModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(motherWithChildren),
      });

      motherModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(motherWithChildren),
      });

      childModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockChild]),
      });

      const children = await service.getMotherChildren(mockMotherId.toString());

      expect(children).toHaveLength(1);
      expect(children[0].childId).toBe('C00000001');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ClinicsService } from './clinics.service';
import { Clinic } from './schemas/clinic.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ClinicsService', () => {
  let service: ClinicsService;
  // Assertions target `mockClinicModel` directly, so no model handle is needed.

  const mockClinic = {
    _id: new Types.ObjectId(),
    clinicId: 'CL000001',
    name: 'Test Health Center',
    type: 'health_center',
    contactInfo: {
      phone: '+251911234567',
      email: 'test@clinic.com',
    },
    address: {
      zone: 'Addis Ababa',
      wereda: 'Bole',
      kebele: '03',
      gpsCoordinates: {
        lat: 9.0,
        lng: 38.7,
      },
    },
    facilities: {
      hasColdStorage: true,
      hasGenerator: true,
      hasInternet: true,
      capacity: 100,
    },
    staff: {
      doctorIds: [],
      nurseIds: [],
      adminIds: [],
    },
    inventory: {
      vaccineTypes: ['BCG', 'OPV'],
      currentStock: new Map([
        ['BCG', 50],
        ['OPV', 100],
      ]),
      lastRestocked: new Date(),
    },
    isActive: true,
    save: jest.fn().mockResolvedValue(this),
  };

  // Typed as `any` because the suite treats it as both a constructor and a
  // static model (find/findById/aggregate), which jest.Mock cannot express.
  const mockClinicModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockClinic, ...dto }),
  }));

  mockClinicModel.find = jest.fn();
  mockClinicModel.findOne = jest.fn();
  mockClinicModel.findById = jest.fn();
  mockClinicModel.findByIdAndUpdate = jest.fn();
  mockClinicModel.countDocuments = jest.fn();
  mockClinicModel.aggregate = jest.fn();
  mockClinicModel.exec = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicsService,
        {
          provide: getModelToken(Clinic.name),
          useValue: mockClinicModel,
        },
      ],
    }).compile();

    service = module.get<ClinicsService>(ClinicsService);
    // Assertions go through `mockClinicModel`, so the resolved model is unused.
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new clinic with auto-generated ID', async () => {
      const createDto = {
        name: 'New Clinic',
        type: 'clinic' as const,
        contactInfo: {
          phone: '+251911234567',
        },
        address: {
          zone: 'Addis Ababa',
          wereda: 'Bole',
          kebele: '03',
          gpsCoordinates: {
            lat: 9.0,
            lng: 38.7,
          },
        },
      };

      mockClinicModel.countDocuments.mockResolvedValue(0);

      const result = await service.create(createDto);

      expect(mockClinicModel.countDocuments).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
    });
  });

  describe('findAll', () => {
    it('should return all active clinics', async () => {
      const clinics = [mockClinic];
      mockClinicModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(clinics),
      });

      const result = await service.findAll();

      expect(mockClinicModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(result).toEqual(clinics);
    });
  });

  describe('findOne', () => {
    it('should find clinic by ObjectId', async () => {
      const id = new Types.ObjectId().toString();
      mockClinicModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockClinic),
      });

      const result = await service.findOne(id);

      expect(mockClinicModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockClinic);
    });

    it('should find clinic by clinicId', async () => {
      const clinicId = 'CL000001';
      mockClinicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockClinic),
      });

      const result = await service.findOne(clinicId);

      expect(mockClinicModel.findOne).toHaveBeenCalledWith({
        clinicId,
        isActive: true,
      });
      expect(result).toEqual(mockClinic);
    });
  });

  describe('update', () => {
    it('should update a clinic', async () => {
      const id = 'CL000001';
      const updateDto = { name: 'Updated Clinic' };

      mockClinicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockClinic),
      });

      mockClinicModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockClinic, ...updateDto }),
      });

      const result = await service.update(id, updateDto);

      expect(result?.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException if clinic not found', async () => {
      mockClinicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('invalid', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a clinic', async () => {
      const id = 'CL000001';

      mockClinicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockClinic),
      });

      mockClinicModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockClinic, isActive: false }),
      });

      const result = await service.remove(id);

      expect(result.isActive).toBe(false);
    });
  });

  describe('findNearby', () => {
    it('should find clinics near a location', async () => {
      const lat = 9.0;
      const lng = 38.7;
      const maxDistanceKm = 10;

      mockClinicModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockClinic]),
      });

      const result = await service.findNearby(lat, lng, maxDistanceKm);

      expect(mockClinicModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual([mockClinic]);
    });
  });

  describe('updateInventory', () => {
    it('should update vaccine inventory', async () => {
      const clinicId = 'CL000001';
      const updateDto = {
        vaccineType: 'BCG',
        quantity: 10,
      };

      const clinicWithSave = {
        ...mockClinic,
        save: jest.fn().mockResolvedValue({
          ...mockClinic,
          inventory: {
            ...mockClinic.inventory,
            currentStock: new Map([['BCG', 60]]),
          },
        }),
      };

      mockClinicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(clinicWithSave),
      });

      const result = await service.updateInventory(clinicId, updateDto);

      expect(clinicWithSave.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      const clinicId = 'CL000001';
      const updateDto = {
        vaccineType: 'BCG',
        quantity: -100, // More than available
      };

      const clinicWithSave = {
        ...mockClinic,
        save: jest.fn(),
      };

      mockClinicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(clinicWithSave),
      });

      await expect(
        service.updateInventory(clinicId, updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignStaff', () => {
    it('should assign staff to clinic', async () => {
      const clinicId = 'CL000001';
      const userId = new Types.ObjectId().toString();
      const role = 'doctor';

      const clinicWithSave = {
        ...mockClinic,
        save: jest.fn().mockResolvedValue(mockClinic),
      };

      mockClinicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(clinicWithSave),
      });

      const result = await service.assignStaff(clinicId, userId, role);

      expect(clinicWithSave.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if user already assigned', async () => {
      const clinicId = 'CL000001';
      const userId = new Types.ObjectId();
      const role = 'doctor';

      const clinicWithExistingStaff = {
        ...mockClinic,
        staff: {
          doctorIds: [userId],
          nurseIds: [],
          adminIds: [],
        },
        save: jest.fn(),
      };

      mockClinicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(clinicWithExistingStaff),
      });

      await expect(
        service.assignStaff(clinicId, userId.toString(), role),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getInventory', () => {
    it('should return clinic inventory', async () => {
      mockClinicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockClinic),
      });

      const result = await service.getInventory('CL000001');

      expect(result).toHaveProperty('clinicId');
      expect(result).toHaveProperty('currentStock');
      expect(result.currentStock).toHaveProperty('BCG');
    });
  });

  describe('getStatistics', () => {
    it('should return clinic statistics', async () => {
      const stats = [
        {
          type: 'hospital',
          count: 5,
          avgCapacity: 200,
          withColdStorage: 5,
          withGenerator: 4,
          withInternet: 3,
        },
      ];

      mockClinicModel.aggregate.mockReturnValue(stats);
      mockClinicModel.countDocuments.mockResolvedValue(10);

      const result = await service.getStatistics();

      expect(result).toHaveProperty('totalClinics');
      expect(result).toHaveProperty('byType');
    });
  });
});

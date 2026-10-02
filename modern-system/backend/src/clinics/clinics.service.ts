import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Clinic } from './schemas/clinic.schema';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { SearchClinicDto } from './dto/search-clinic.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ClinicResponseDto } from './dto/clinic-response.dto';

/**
 * Keys of the clinic's `staff` subdocument that hold assigned user ids.
 *
 * `assignStaff`/`removeStaff` derive the field name from a `role` union as
 * ``` `${role}Ids` ```. Without this alias that template literal types as
 * `string`, which cannot index the staff object — the compiler cannot see
 * that `role` is a closed union. Declaring it once here keeps both call
 * sites honest.
 */
type StaffRoleKey = keyof Clinic['staff'];

@Injectable()
export class ClinicsService {
  private readonly logger = new Logger(ClinicsService.name);

  constructor(@InjectModel(Clinic.name) private clinicModel: Model<Clinic>) {}

  /**
   * Create a new clinic with auto-generated clinic ID
   */
  async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
    try {
      const count = await this.clinicModel.countDocuments();
      const clinicId = `CL${String(count + 1).padStart(6, '0')}`;

      const clinicData: any = {
        ...createClinicDto,
        clinicId,
        audit: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: createClinicDto.createdBy
            ? new Types.ObjectId(createClinicDto.createdBy)
            : undefined,
        },
      };

      // Initialize inventory if vaccine types are provided
      if (
        createClinicDto.vaccineTypes &&
        createClinicDto.vaccineTypes.length > 0
      ) {
        clinicData.inventory = {
          vaccineTypes: createClinicDto.vaccineTypes,
          currentStock: new Map(),
          lastRestocked: new Date(),
        };
      }

      const createdClinic = new this.clinicModel(clinicData);
      const saved = await createdClinic.save();
      this.logger.log(`Created clinic: ${clinicId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create clinic: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all active clinics
   */
  async findAll(): Promise<Clinic[]> {
    return this.clinicModel.find({ isActive: true }).exec();
  }

  /**
   * Find a clinic by MongoDB ObjectId or clinicId
   */
  async findOne(id: string): Promise<Clinic | null> {
    if (Types.ObjectId.isValid(id)) {
      return this.clinicModel.findById(id).exec();
    }
    return this.clinicModel.findOne({ clinicId: id, isActive: true }).exec();
  }

  /**
   * Update clinic information
   */
  async update(
    id: string,
    updateClinicDto: UpdateClinicDto,
  ): Promise<Clinic | null> {
    const clinic = await this.findOne(id);
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }

    const updateData: any = {
      ...updateClinicDto,
      'audit.updatedAt': new Date(),
    };

    if (updateClinicDto.updatedBy) {
      updateData['audit.updatedBy'] = new Types.ObjectId(
        updateClinicDto.updatedBy,
      );
    }

    const updated = await this.clinicModel
      .findByIdAndUpdate(clinic._id, updateData, { new: true })
      .exec();

    this.logger.log(`Updated clinic: ${clinic.clinicId}`);
    return updated;
  }

  /**
   * Soft delete a clinic by setting isActive to false
   */
  async remove(id: string): Promise<Clinic> {
    const clinic = await this.findOne(id);
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }

    const deleted = await this.clinicModel
      .findByIdAndUpdate(
        clinic._id,
        {
          isActive: false,
          'audit.updatedAt': new Date(),
        },
        { new: true },
      )
      .exec();

    if (!deleted) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }

    this.logger.log(`Soft deleted clinic: ${clinic.clinicId}`);
    return deleted;
  }

  /**
   * Search clinics with various filters including geospatial search
   */
  async search(searchDto: SearchClinicDto): Promise<ClinicResponseDto[]> {
    const query: any = { isActive: true };

    // Geospatial search
    if (searchDto.lat !== undefined && searchDto.lng !== undefined) {
      const maxDistance = (searchDto.maxDistanceKm || 10) * 1000; // Convert to meters

      return this.clinicModel
        .aggregate([
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [searchDto.lng, searchDto.lat],
              },
              distanceField: 'distance',
              maxDistance: maxDistance,
              spherical: true,
              query: { isActive: true },
            },
          },
          {
            $addFields: {
              distanceKm: { $divide: ['$distance', 1000] },
            },
          },
        ])
        .exec();
    }

    // Address-based filters
    if (searchDto.zone) {
      query['address.zone'] = new RegExp(searchDto.zone, 'i');
    }
    if (searchDto.wereda) {
      query['address.wereda'] = new RegExp(searchDto.wereda, 'i');
    }
    if (searchDto.kebele) {
      query['address.kebele'] = new RegExp(searchDto.kebele, 'i');
    }

    // Type filter
    if (searchDto.type) {
      query.type = searchDto.type;
    }

    // Name search
    if (searchDto.name) {
      query.name = new RegExp(searchDto.name, 'i');
    }

    const results = await this.clinicModel.find(query).exec();
    return results as unknown as ClinicResponseDto[];
  }

  /**
   * Find clinics near a specific location
   */
  async findNearby(
    lat: number,
    lng: number,
    maxDistanceKm: number = 10,
  ): Promise<Clinic[]> {
    return this.clinicModel
      .aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            distanceField: 'distance',
            maxDistance: maxDistanceKm * 1000,
            spherical: true,
            query: { isActive: true },
          },
        },
        {
          $addFields: {
            distanceKm: { $divide: ['$distance', 1000] },
          },
        },
      ])
      .exec();
  }

  /**
   * Find clinics by zone and wereda
   */
  async findByZoneWereda(zone: string, wereda: string): Promise<Clinic[]> {
    return this.clinicModel
      .find({
        'address.zone': new RegExp(zone, 'i'),
        'address.wereda': new RegExp(wereda, 'i'),
        isActive: true,
      })
      .exec();
  }

  /**
   * Update vaccine inventory for a clinic
   */
  async updateInventory(
    clinicId: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Clinic> {
    const clinic = await this.findOne(clinicId);
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    const { vaccineType, quantity } = updateInventoryDto;

    // Initialize inventory if not exists
    if (!clinic.inventory) {
      clinic.inventory = {
        vaccineTypes: [],
        currentStock: new Map(),
      };
    }

    // Add vaccine type if not already in the list
    if (!clinic.inventory.vaccineTypes.includes(vaccineType)) {
      clinic.inventory.vaccineTypes.push(vaccineType);
    }

    // Update stock quantity
    const currentStock = clinic.inventory.currentStock.get(vaccineType) || 0;
    const newStock = currentStock + quantity;

    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock for ${vaccineType}. Current: ${currentStock}, Requested: ${Math.abs(quantity)}`,
      );
    }

    clinic.inventory.currentStock.set(vaccineType, newStock);
    clinic.inventory.lastRestocked = new Date();

    const saved = await clinic.save();
    this.logger.log(
      `Updated inventory for clinic ${clinicId}: ${vaccineType} = ${newStock}`,
    );
    return saved;
  }

  /**
   * Get current inventory for a clinic
   */
  async getInventory(clinicId: string): Promise<any> {
    const clinic = await this.findOne(clinicId);
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    const inventory = clinic.inventory || {
      vaccineTypes: [],
      currentStock: new Map(),
      lastRestocked: null,
    };

    // Convert Map to object for JSON serialization
    const stockObject: Record<string, number> = {};
    if (inventory.currentStock) {
      inventory.currentStock.forEach((value, key) => {
        stockObject[key] = value;
      });
    }

    return {
      clinicId: clinic.clinicId,
      clinicName: clinic.name,
      vaccineTypes: inventory.vaccineTypes,
      currentStock: stockObject,
      lastRestocked: inventory.lastRestocked,
    };
  }

  /**
   * Assign staff member to a clinic
   */
  async assignStaff(
    clinicId: string,
    userId: string,
    role: 'doctor' | 'nurse' | 'admin',
  ): Promise<Clinic> {
    const clinic = await this.findOne(clinicId);
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(`Invalid user ID: ${userId}`);
    }

    const userObjectId = new Types.ObjectId(userId);

    // Initialize staff object if not exists
    if (!clinic.staff) {
      clinic.staff = {
        doctorIds: [],
        nurseIds: [],
        adminIds: [],
      };
    }

    // `role` is a closed union, so the derived key is always a real staff field.
    const roleKey = `${role}Ids` as StaffRoleKey;

    if (!clinic.staff[roleKey]) {
      clinic.staff[roleKey] = [];
    }

    // Check if user is already assigned
    const isAlreadyAssigned = clinic.staff[roleKey].some(
      (id) => id.toString() === userObjectId.toString(),
    );

    if (isAlreadyAssigned) {
      throw new BadRequestException(
        `User ${userId} is already assigned as ${role} to clinic ${clinicId}`,
      );
    }

    clinic.staff[roleKey].push(userObjectId);
    const saved = await clinic.save();
    this.logger.log(`Assigned ${role} ${userId} to clinic ${clinicId}`);
    return saved;
  }

  /**
   * Remove staff member from a clinic
   */
  async removeStaff(
    clinicId: string,
    userId: string,
    role: 'doctor' | 'nurse' | 'admin',
  ): Promise<Clinic> {
    const clinic = await this.findOne(clinicId);
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(`Invalid user ID: ${userId}`);
    }

    const userObjectId = new Types.ObjectId(userId);
    const roleKey = `${role}Ids` as StaffRoleKey;

    if (!clinic.staff || !clinic.staff[roleKey]) {
      throw new NotFoundException(`No ${role}s assigned to clinic ${clinicId}`);
    }

    const initialLength = clinic.staff[roleKey].length;
    clinic.staff[roleKey] = clinic.staff[roleKey].filter(
      (id) => id.toString() !== userObjectId.toString(),
    );

    if (clinic.staff[roleKey].length === initialLength) {
      throw new NotFoundException(
        `User ${userId} is not assigned as ${role} to clinic ${clinicId}`,
      );
    }

    const saved = await clinic.save();
    this.logger.log(`Removed ${role} ${userId} from clinic ${clinicId}`);
    return saved;
  }

  /**
   * Get all staff members for a clinic
   */
  async getStaff(clinicId: string): Promise<any> {
    const clinic = await this.findOne(clinicId);
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    return {
      clinicId: clinic.clinicId,
      clinicName: clinic.name,
      staff: clinic.staff || {
        doctorIds: [],
        nurseIds: [],
        adminIds: [],
      },
    };
  }

  /**
   * Get clinics by staff member
   */
  async findByStaffMember(userId: string): Promise<Clinic[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(`Invalid user ID: ${userId}`);
    }

    const userObjectId = new Types.ObjectId(userId);

    return this.clinicModel
      .find({
        $or: [
          { 'staff.doctorIds': userObjectId },
          { 'staff.nurseIds': userObjectId },
          { 'staff.adminIds': userObjectId },
        ],
        isActive: true,
      })
      .exec();
  }

  /**
   * Get clinic statistics
   */
  async getStatistics(): Promise<any> {
    const stats = await this.clinicModel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgCapacity: { $avg: '$facilities.capacity' },
          withColdStorage: {
            $sum: { $cond: ['$facilities.hasColdStorage', 1, 0] },
          },
          withGenerator: {
            $sum: { $cond: ['$facilities.hasGenerator', 1, 0] },
          },
          withInternet: {
            $sum: { $cond: ['$facilities.hasInternet', 1, 0] },
          },
        },
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          avgCapacity: { $round: ['$avgCapacity', 0] },
          withColdStorage: 1,
          withGenerator: 1,
          withInternet: 1,
          _id: 0,
        },
      },
    ]);

    const totalClinics = await this.clinicModel.countDocuments({
      isActive: true,
    });

    return {
      totalClinics,
      byType: stats,
    };
  }
}

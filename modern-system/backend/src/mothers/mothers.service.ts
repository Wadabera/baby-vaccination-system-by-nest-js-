import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Mother } from './schemas/mother.schema';
import { Child } from '../children/schemas/child.schema';
import { CreateMotherDto } from './dto/create-mother.dto';
import { UpdateMotherDto } from './dto/update-mother.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';
import { MotherProfileResponseDto } from './dto/mother-profile-response.dto';
import { generateMotherSchedule } from '../children/utils/schedule-generator';
import { RecordDoseDto } from '../children/dto/record-vaccination.dto';

@Injectable()
export class MothersService {
  constructor(
    @InjectModel(Mother.name) private readonly motherModel: Model<Mother>,
    @InjectModel(Child.name) private readonly childModel: Model<Child>,
  ) {}

  async create(dto: CreateMotherDto): Promise<Mother> {
    // Sequential IDs are allocated from the highest existing number rather than
    // the document count, so deletions cannot cause a collision.
    const last = await this.motherModel
      .findOne({ motherId: /^M\d{8}$/ }, { motherId: 1 })
      .sort({ motherId: -1 })
      .exec();
    const next = last ? Number(last.motherId.slice(1)) + 1 : 1;
    const motherId = `M${String(next).padStart(8, '0')}`;

    // TT1 is anchored to the pregnancy/registration date.
    const referenceDate = dto.scheduleReferenceDate
      ? new Date(dto.scheduleReferenceDate)
      : new Date();

    return new this.motherModel({
      ...dto,
      motherId,
      schedule: generateMotherSchedule(referenceDate),
      audit: { createdAt: new Date(), updatedAt: new Date() },
    }).save();
  }

  async findAll(): Promise<Mother[]> {
    return this.motherModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Mother | null> {
    if (Types.ObjectId.isValid(id)) {
      const mother = await this.motherModel.findById(id).exec();
      if (mother) return mother;
    }
    return this.motherModel.findOne({ motherId: id }).exec();
  }

  private async requireOne(id: string): Promise<Mother> {
    const mother = await this.findOne(id);
    if (!mother) {
      throw new NotFoundException(`Mother with ID ${id} not found`);
    }
    return mother;
  }

  async findByPhone(phone: string): Promise<Mother | null> {
    return this.motherModel
      .findOne({ 'contactInfo.phoneNumber': phone })
      .exec();
  }

  async update(id: string, dto: UpdateMotherDto): Promise<Mother> {
    const mother = await this.requireOne(id);
    Object.assign(mother, dto, {
      audit: { ...mother.audit, updatedAt: new Date() },
    });
    return mother.save();
  }

  /**
   * Soft delete. Children stay linked so records are never silently lost, but
   * the mother stops appearing in active listings.
   */
  async remove(id: string): Promise<Mother> {
    const mother = await this.requireOne(id);
    mother.isActive = false;
    mother.audit = { ...mother.audit, updatedAt: new Date() };
    return mother.save();
  }

  /** Mark a TT/RH dose as administered, mirroring the child workflow. */
  async recordDose(
    id: string,
    dto: RecordDoseDto,
    administeredBy: string,
  ): Promise<Mother> {
    const mother = await this.requireOne(id);
    const index = mother.schedule.findIndex(
      (d) => d.vaccineName === dto.vaccineName,
    );

    if (index === -1) {
      throw new NotFoundException(
        `Dose ${dto.vaccineName} is not part of this mother's schedule`,
      );
    }
    if (mother.schedule[index].status === 'completed') {
      throw new BadRequestException(
        `${dto.vaccineName} has already been administered`,
      );
    }

    // Mutate the sub-document in place; replacing the array entry would detach it
    // from the schema and the subsequent save would fail validation.
    const dose = mother.schedule[index];
    dose.status = 'completed';
    dose.givenDate = dto.givenDate ? new Date(dto.givenDate) : new Date();
    if (dto.batchNumber) dose.batchNumber = dto.batchNumber;
    if (dto.notes) dose.notes = dto.notes;
    if (administeredBy)
      dose.administeredBy = new Types.ObjectId(administeredBy);
    if (dto.clinicId) dose.clinicId = new Types.ObjectId(dto.clinicId);

    mother.audit = { ...mother.audit, updatedAt: new Date() };
    return mother.save();
  }

  /** Flip a dose back to pending, e.g. when a record was entered in error. */
  async revokeDose(id: string, vaccineName: string): Promise<Mother> {
    const mother = await this.requireOne(id);
    const index = mother.schedule.findIndex(
      (d) => d.vaccineName === vaccineName,
    );

    if (index === -1) {
      throw new NotFoundException(
        `Dose ${vaccineName} is not part of this mother's schedule`,
      );
    }

    // Mutate the existing sub-document rather than replacing the array entry:
    // assigning a plain object here detaches it from Mongoose's schema and the
    // save is then rejected for missing required fields.
    const dose = mother.schedule[index];
    dose.status = 'pending';
    delete dose.givenDate;
    delete dose.batchNumber;
    delete dose.notes;
    delete dose.administeredBy;
    delete dose.clinicId;

    mother.audit = { ...mother.audit, updatedAt: new Date() };
    return mother.save();
  }

  /** Mark doses past their due date as overdue. Returns the number changed. */
  async refreshOverdue(): Promise<number> {
    const result = await this.motherModel.updateMany(
      {
        'schedule.status': 'pending',
        'schedule.dueDate': { $lte: new Date() },
      },
      { $set: { 'schedule.$.status': 'overdue' } },
    );
    return result.modifiedCount ?? 0;
  }

  /** Mothers with a TT or RH dose due now or overdue. */
  async findDueForVaccination(): Promise<Mother[]> {
    return this.motherModel
      .find({
        isActive: true,
        schedule: {
          $elemMatch: {
            status: { $in: ['pending', 'overdue'] },
            dueDate: { $lte: new Date() },
          },
        },
      })
      .sort({ 'contactInfo.phoneNumber': 1 })
      .exec();
  }

  async addChild(
    motherId: string,
    childId: Types.ObjectId,
  ): Promise<Mother | null> {
    const mother = await this.findOne(motherId);
    if (!mother) {
      throw new NotFoundException(`Mother with ID ${motherId} not found`);
    }

    if (mother.childrenIds.includes(childId)) {
      return mother;
    }

    mother.childrenIds.push(childId);
    return mother.save();
  }

  async removeChild(
    motherId: string,
    childId: Types.ObjectId,
  ): Promise<Mother | null> {
    const mother = await this.findOne(motherId);
    if (!mother) {
      throw new NotFoundException(`Mother with ID ${motherId} not found`);
    }

    mother.childrenIds = mother.childrenIds.filter(
      (id) => id.toString() !== childId.toString(),
    );
    return mother.save();
  }

  async search(criteria: {
    zone?: string;
    wereda?: string;
    kebele?: string;
    phoneNumber?: string;
    name?: string;
  }): Promise<Mother[]> {
    const query: any = {};

    if (criteria.zone) {
      query['address.zone'] = new RegExp(criteria.zone, 'i');
    }
    if (criteria.wereda) {
      query['address.wereda'] = new RegExp(criteria.wereda, 'i');
    }
    if (criteria.kebele) {
      query['address.kebele'] = new RegExp(criteria.kebele, 'i');
    }
    if (criteria.phoneNumber) {
      query['contactInfo.phoneNumber'] = new RegExp(criteria.phoneNumber, 'i');
    }
    if (criteria.name) {
      query.$or = [
        { 'personalInfo.firstName': new RegExp(criteria.name, 'i') },
        { 'personalInfo.lastName': new RegExp(criteria.name, 'i') },
      ];
    }

    return this.motherModel.find(query).exec();
  }

  /**
   * Get mother profile with populated children information
   * Requirement 3.6: Mother profile displays all registered children linked to the mother
   */
  async getMotherProfile(id: string): Promise<MotherProfileResponseDto> {
    const mother = await this.findOne(id);
    if (!mother) {
      throw new NotFoundException(`Mother with ID ${id} not found`);
    }

    // Populate children information
    const children = await this.childModel
      .find({
        _id: { $in: mother.childrenIds },
      })
      .exec();

    // Transform to response DTO
    const profile: MotherProfileResponseDto = {
      _id: mother._id.toString(),
      motherId: mother.motherId,
      personalInfo: mother.personalInfo,
      contactInfo: mother.contactInfo,
      address: mother.address,
      schedule: mother.schedule,
      medicalHistory: mother.medicalHistory,
      children: children.map((child) => ({
        _id: child._id.toString(),
        childId: child.childId,
        personalInfo: child.personalInfo,
        schedule: child.schedule.map((dose) => ({
          vaccineName: dose.vaccineName,
          dueDate: dose.dueDate,
          status: dose.status,
          givenDate: dose.givenDate,
        })),
        medicalInfo: {
          birthWeight: child.medicalInfo.birthWeight,
          birthHeight: child.medicalInfo.birthHeight,
          allergies: child.medicalInfo.allergies,
          contraindications: child.medicalInfo.contraindications,
          adverseReactions: child.medicalInfo.adverseReactions,
        },
      })),
      audit: mother.audit,
      isActive: mother.isActive,
    };

    return profile;
  }

  /**
   * Update medical history for a mother
   * Requirement 21.1: Medical history review system allows viewing complete medical history
   */
  async updateMedicalHistory(
    id: string,
    dto: UpdateMedicalHistoryDto,
  ): Promise<Mother> {
    const mother = await this.requireOne(id);

    mother.medicalHistory = {
      allergies: dto.allergies ?? mother.medicalHistory.allergies,
      chronicConditions:
        dto.chronicConditions ?? mother.medicalHistory.chronicConditions,
      previousAdverseReactions:
        dto.previousAdverseReactions ??
        mother.medicalHistory.previousAdverseReactions,
      notes: dto.notes ?? mother.medicalHistory.notes,
    };
    mother.audit = { ...mother.audit, updatedAt: new Date() };

    return mother.save();
  }

  /**
   * Add allergy to mother's medical history
   */
  async addAllergy(id: string, allergy: string): Promise<Mother> {
    const mother = await this.requireOne(id);
    if (!mother.medicalHistory.allergies.includes(allergy)) {
      mother.medicalHistory.allergies.push(allergy);
      mother.audit = { ...mother.audit, updatedAt: new Date() };
      return mother.save();
    }
    return mother;
  }

  async removeAllergy(id: string, allergy: string): Promise<Mother> {
    const mother = await this.requireOne(id);
    mother.medicalHistory.allergies = mother.medicalHistory.allergies.filter(
      (a) => a !== allergy,
    );
    mother.audit = { ...mother.audit, updatedAt: new Date() };
    return mother.save();
  }

  async addChronicCondition(id: string, condition: string): Promise<Mother> {
    const mother = await this.requireOne(id);
    if (!mother.medicalHistory.chronicConditions.includes(condition)) {
      mother.medicalHistory.chronicConditions.push(condition);
      mother.audit = { ...mother.audit, updatedAt: new Date() };
      return mother.save();
    }
    return mother;
  }

  async removeChronicCondition(id: string, condition: string): Promise<Mother> {
    const mother = await this.requireOne(id);
    mother.medicalHistory.chronicConditions =
      mother.medicalHistory.chronicConditions.filter((c) => c !== condition);
    mother.audit = { ...mother.audit, updatedAt: new Date() };
    return mother.save();
  }

  /**
   * Link a child to a mother
   * Requirement 4.1: Child registration system links to mother
   */
  async linkChild(motherId: string, childId: string): Promise<Mother> {
    const mother = await this.requireOne(motherId);

    if (!Types.ObjectId.isValid(childId)) {
      throw new BadRequestException(`Invalid child ID: ${childId}`);
    }

    const childObjectId = new Types.ObjectId(childId);
    const child = await this.childModel.findById(childObjectId).exec();
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    if (!mother.childrenIds.some((id) => id.equals(childObjectId))) {
      mother.childrenIds.push(childObjectId);
      mother.audit = { ...mother.audit, updatedAt: new Date() };
      await mother.save();
    }

    // Keep the child's own motherId in step with the link.
    if (
      !child.motherId.equals(childObjectId) &&
      !child.motherId.equals(mother._id)
    ) {
      child.motherId = mother._id;
      await child.save();
    }

    return mother;
  }

  async unlinkChild(motherId: string, childId: string): Promise<Mother> {
    const mother = await this.requireOne(motherId);

    if (!Types.ObjectId.isValid(childId)) {
      throw new BadRequestException(`Invalid child ID: ${childId}`);
    }

    const childObjectId = new Types.ObjectId(childId);
    mother.childrenIds = mother.childrenIds.filter(
      (id) => !id.equals(childObjectId),
    );
    mother.audit = { ...mother.audit, updatedAt: new Date() };
    await mother.save();

    const child = await this.childModel.findById(childObjectId).exec();
    if (child && child.motherId.equals(mother._id)) {
      child.motherId = undefined as never;
      await child.save();
    }

    return mother;
  }

  async getMotherChildren(motherId: string): Promise<Child[]> {
    const mother = await this.requireOne(motherId);
    return this.childModel.find({ _id: { $in: mother.childrenIds } }).exec();
  }
}

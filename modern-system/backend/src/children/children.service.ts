import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Child } from './schemas/child.schema';
import { generateSchedule } from './utils/schedule-generator';
import {
  generateQRCode,
  generateShareToken,
  updateVaccinationStatuses,
  getOverdueVaccinations,
  getUpcomingVaccinations,
  calculateVaccinationProgress,
} from './utils/digital-card-generator';
import { MothersService } from '../mothers/mothers.service';
import { UsersService } from '../users/users.service';
import { ClinicsService } from '../clinics/clinics.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { RecordVaccinationDto } from './dto/record-vaccination.dto';
import { AddContraindicationDto } from './dto/add-contraindication.dto';
import { AddAdverseReactionDto } from './dto/add-adverse-reaction.dto';
import { ChildProfileResponseDto } from './dto/child-profile-response.dto';
import { UserRole } from '../users/schemas/user.schema';
import {
  ContraindicationEntry,
  AdverseReactionEntry,
  BLOCKING_SEVERITIES,
} from './schemas/contraindication-entry.schema';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<Child>,
    @InjectModel(ContraindicationEntry.name)
    private contraindicationModel: Model<ContraindicationEntry>,
    @InjectModel(AdverseReactionEntry.name)
    private reactionModel: Model<AdverseReactionEntry>,
    private mothersService: MothersService,
    private usersService: UsersService,
    private clinicsService: ClinicsService,
  ) {}

  /**
   * Blockers that must be resolved before a dose can be administered.
   *
   * Both the dedicated collections and the embedded `medicalInfo` arrays are
   * checked, because older records may only have the embedded form.
   */
  private async vaccinationBlockers(child: Child): Promise<string[]> {
    const [activeContraindications, severeReactions] = await Promise.all([
      this.contraindicationModel
        .find({ childId: child._id, isActive: true })
        .exec(),
      this.reactionModel
        .find({
          childId: child._id,
          severity: { $in: [...BLOCKING_SEVERITIES] },
        })
        .exec(),
    ]);

    const reasons: string[] = [];

    if (activeContraindications.length > 0) {
      reasons.push(
        `active contraindication: ${activeContraindications.map((c) => c.type).join(', ')}`,
      );
    }
    if (severeReactions.length > 0) {
      reasons.push(
        `history of severe adverse reaction: ${severeReactions.map((r) => r.reaction).join(', ')}`,
      );
    }

    const embedded =
      child.medicalInfo?.contraindications?.filter((c) => c.isActive) ?? [];
    if (embedded.length > 0) {
      reasons.push(
        `active contraindication: ${embedded.map((c) => c.type).join(', ')}`,
      );
    }

    const severeEmbedded =
      child.medicalInfo?.adverseReactions?.filter(
        (r) => r.severity === 'severe' || r.severity === 'life_threatening',
      ) ?? [];
    if (severeEmbedded.length > 0) {
      reasons.push(
        `history of severe adverse reaction: ${severeEmbedded.map((r) => r.reaction).join(', ')}`,
      );
    }

    return reasons;
  }

  /**
   * Create a new child with automated vaccination schedule
   * Requirement 4.1: Child registration system captures required information
   * Requirement 5.1: Automated vaccination schedule generation based on birthdate
   */
  async create(createChildDto: CreateChildDto): Promise<Child> {
    // Verify mother exists
    const mother = await this.mothersService.findOne(createChildDto.motherId);
    if (!mother) {
      throw new NotFoundException(
        `Mother with ID ${createChildDto.motherId} not found`,
      );
    }

    // Allocate the next ID from the highest existing number, not the document
    // count, so a deletion can never produce a duplicate id.
    const last = await this.childModel
      .findOne({ childId: /^C\d{8}$/ }, { childId: 1 })
      .sort({ childId: -1 })
      .exec();
    const next = last ? Number(last.childId.slice(1)) + 1 : 1;
    const childId = `C${String(next).padStart(8, '0')}`;

    // Generate vaccination schedule based on birthdate
    const birthDate = new Date(createChildDto.personalInfo.birthDate);
    const schedule = generateSchedule(birthDate);

    // Prepare child data
    const childData: any = {
      childId,
      motherId: new Types.ObjectId(createChildDto.motherId),
      personalInfo: {
        ...createChildDto.personalInfo,
        birthDate,
      },
      schedule,
      medicalInfo: {
        birthWeight: createChildDto.medicalInfo?.birthWeight,
        birthHeight: createChildDto.medicalInfo?.birthHeight,
        allergies: createChildDto.medicalInfo?.allergies || [],
        contraindications: [],
        adverseReactions: [],
      },
      audit: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createChildDto.createdBy
          ? new Types.ObjectId(createChildDto.createdBy)
          : undefined,
      },
      isActive: true,
    };

    if (createChildDto.clinicId) {
      childData.clinicId = new Types.ObjectId(createChildDto.clinicId);
    }

    const createdChild = new this.childModel(childData);
    const savedChild = await createdChild.save();

    // Link child to mother (bidirectional relationship)
    await this.mothersService.addChild(createChildDto.motherId, savedChild._id);

    return savedChild;
  }

  async findAll(): Promise<Child[]> {
    return this.childModel.find().populate('motherId').exec();
  }

  async findByMother(motherId: string): Promise<Child[]> {
    const objectId = Types.ObjectId.isValid(motherId)
      ? new Types.ObjectId(motherId)
      : null;
    if (!objectId) {
      throw new BadRequestException(`Invalid mother ID: ${motherId}`);
    }
    return this.childModel.find({ motherId: objectId }).exec();
  }

  /** Children linked to a given parent account. */
  async findByParent(parentId: string): Promise<Child[]> {
    if (!Types.ObjectId.isValid(parentId)) {
      throw new BadRequestException(`Invalid parent ID: ${parentId}`);
    }
    return this.childModel
      .find({ _id: { $in: await this.parentsChildIds(parentId) } })
      .populate('motherId')
      .exec();
  }

  /** Resolve the child's ObjectIds from the parent's `childrenIds` array. */
  private async parentsChildIds(parentId: string): Promise<Types.ObjectId[]> {
    const parent = await this.usersService.findByIdOrFail(parentId);
    return parent.childrenIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
  }

  async findOne(id: string): Promise<Child | null> {
    // Try MongoDB _id first
    if (Types.ObjectId.isValid(id)) {
      const child = await this.childModel
        .findById(id)
        .populate('motherId')
        .exec();
      if (child) return child;
    }
    // Then try childId
    return this.childModel.findOne({ childId: id }).populate('motherId').exec();
  }

  async update(
    id: string,
    updateChildDto: UpdateChildDto,
  ): Promise<Child | null> {
    const child = await this.findOne(id);
    if (!child) {
      throw new NotFoundException(`Child with ID ${id} not found`);
    }

    // Update audit information
    const updateData: any = {
      ...updateChildDto,
      'audit.updatedAt': new Date(),
    };

    if (updateChildDto.personalInfo?.birthDate) {
      updateData.personalInfo = {
        ...updateChildDto.personalInfo,
        birthDate: new Date(updateChildDto.personalInfo.birthDate),
      };
    }

    return this.childModel
      .findByIdAndUpdate(child._id, updateData, { new: true })
      .exec();
  }

  /**
   * Soft delete. The child stops appearing in active listings but the
   * vaccination history is retained for reporting.
   */
  async remove(id: string): Promise<Child> {
    const child = await this.findOne(id);
    if (!child) {
      throw new NotFoundException(`Child with ID ${id} not found`);
    }

    child.isActive = false;
    child.audit = { ...child.audit, updatedAt: new Date() };
    await child.save();

    if (child.motherId) {
      await this.mothersService.removeChild(
        child.motherId.toString(),
        child._id,
      );
    }

    return child;
  }

  /** Children whose next dose is due now or already overdue. */
  async findDueForVaccination(withinDays = 14): Promise<Child[]> {
    const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    return this.childModel
      .find({
        isActive: true,
        schedule: {
          $elemMatch: {
            status: { $in: ['pending', 'overdue'] },
            dueDate: { $lte: cutoff },
          },
        },
      })
      .populate('motherId')
      .exec();
  }

  /** Flip elapsed pending doses to overdue. Returns the number changed. */
  async refreshOverdue(): Promise<number> {
    const result = await this.childModel.updateMany(
      {
        'schedule.status': 'pending',
        'schedule.dueDate': { $lte: new Date() },
      },
      { $set: { 'schedule.$.status': 'overdue' } },
    );
    return result.modifiedCount ?? 0;
  }

  /**
   * Record a vaccination administration
   * Requirement 4.5: Record vaccination with date, batch number, and healthcare worker
   * Requirement 5.3: Healthcare worker assignment with validation
   * Requirement 9.5: Clinic location recording for each vaccination
   */
  async recordVaccination(
    childId: string,
    recordDto: RecordVaccinationDto,
  ): Promise<Child | null> {
    // The controller always supplies the clinician from the JWT; guard here so
    // a direct call cannot record an anonymous dose.
    if (!recordDto.administeredBy) {
      throw new BadRequestException('administeredBy is required');
    }

    // 1. Validate child exists
    const child = await this.findOne(childId);
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    // 2. Validate dose index
    if (!child.schedule || !child.schedule[recordDto.doseIndex]) {
      throw new BadRequestException(
        `Invalid dose index: ${recordDto.doseIndex}`,
      );
    }

    // 3. Check if vaccination is already completed
    if (child.schedule[recordDto.doseIndex].status === 'completed') {
      throw new BadRequestException(
        `Vaccination at dose index ${recordDto.doseIndex} has already been administered`,
      );
    }

    // 4. Validate healthcare worker exists and has appropriate role
    const clinicianId = recordDto.administeredBy;
    const healthcareWorker = await this.usersService.findOne(clinicianId);
    if (!healthcareWorker) {
      throw new NotFoundException(
        `Healthcare worker with ID ${recordDto.administeredBy} not found`,
      );
    }

    // Only clinical staff may administer a dose. `registrar` covers the health
    // centre staff who recorded doses in the legacy `health` module.
    const CLINICAL_ROLES = [UserRole.DOCTOR, UserRole.REGISTRAR];
    if (!CLINICAL_ROLES.includes(healthcareWorker.role)) {
      throw new ForbiddenException(
        `User ${recordDto.administeredBy} does not have permission to administer vaccinations. ` +
          `Current role: ${healthcareWorker.role}`,
      );
    }

    // Check if healthcare worker is active
    if (!healthcareWorker.isActive) {
      throw new ForbiddenException(
        `Healthcare worker ${recordDto.administeredBy} is not active and cannot administer vaccinations`,
      );
    }

    // 5. Refuse to vaccinate a child with an unresolved safety flag
    const blockers = await this.vaccinationBlockers(child);
    if (blockers.length > 0) {
      throw new BadRequestException(
        `Vaccination cannot be administered: ${blockers.join('; ')}. ` +
          `Clear the contraindication first via the doctor module.`,
      );
    }

    // 6. Validate clinic exists
    const clinic = await this.clinicsService.findOne(recordDto.clinicId);
    if (!clinic) {
      throw new NotFoundException(
        `Clinic with ID ${recordDto.clinicId} not found`,
      );
    }

    // Check if clinic is active
    if (!clinic.isActive) {
      throw new BadRequestException(
        `Clinic ${recordDto.clinicId} is not active and cannot be used for vaccination administration`,
      );
    }

    // 6. Validate doctor approval if provided
    if (recordDto.approvedBy) {
      const doctor = await this.usersService.findOne(recordDto.approvedBy);
      if (!doctor) {
        throw new NotFoundException(
          `Doctor with ID ${recordDto.approvedBy} not found`,
        );
      }

      if (doctor.role !== UserRole.DOCTOR) {
        throw new ForbiddenException(
          `User ${recordDto.approvedBy} is not a doctor and cannot approve vaccinations. ` +
            `Current role: ${doctor.role}`,
        );
      }

      if (!doctor.isActive) {
        throw new ForbiddenException(
          `Doctor ${recordDto.approvedBy} is not active and cannot approve vaccinations`,
        );
      }
    }

    // 7. Check for active contraindications
    const activeContraindications = child.medicalInfo.contraindications.filter(
      (c) => c.isActive,
    );
    if (activeContraindications.length > 0) {
      throw new ForbiddenException(
        `Cannot administer vaccination. Child has ${activeContraindications.length} active contraindication(s): ` +
          activeContraindications.map((c) => c.type).join(', '),
      );
    }

    // 8. Validate batch number format (already validated by DTO, but double-check)
    const batchNumberRegex = /^[A-Z0-9-]{6,20}$/i;
    if (!batchNumberRegex.test(recordDto.batchNumber)) {
      throw new BadRequestException(
        `Invalid batch number format: ${recordDto.batchNumber}. ` +
          `Batch number must be 6-20 alphanumeric characters (letters, numbers, hyphens only)`,
      );
    }

    // 9. Update the vaccination dose
    child.schedule[recordDto.doseIndex].status = 'completed';
    child.schedule[recordDto.doseIndex].givenDate = new Date();
    child.schedule[recordDto.doseIndex].administeredBy = new Types.ObjectId(
      recordDto.administeredBy,
    );
    child.schedule[recordDto.doseIndex].batchNumber = recordDto.batchNumber;
    child.schedule[recordDto.doseIndex].clinicId = new Types.ObjectId(
      recordDto.clinicId,
    );

    if (recordDto.approvedBy) {
      child.schedule[recordDto.doseIndex].approvedBy = new Types.ObjectId(
        recordDto.approvedBy,
      );
    }

    if (recordDto.notes) {
      child.schedule[recordDto.doseIndex].notes = recordDto.notes;
    }

    // 10. Update audit information
    child.audit.updatedAt = new Date();

    return child.save();
  }

  /**
   * Add contraindication to child's medical record
   * Requirement 21.3: Contraindication flagging system
   */
  async addContraindication(
    childId: string,
    contraindicationDto: AddContraindicationDto,
  ): Promise<Child | null> {
    const child = await this.findOne(childId);
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    child.medicalInfo.contraindications.push({
      type: contraindicationDto.type,
      reason: contraindicationDto.reason,
      flaggedBy: new Types.ObjectId(contraindicationDto.flaggedBy),
      dateFlagged: new Date(),
      isActive: true,
    });

    child.audit.updatedAt = new Date();
    return child.save();
  }

  /**
   * Deactivate a contraindication
   */
  async deactivateContraindication(
    childId: string,
    contraindicationIndex: number,
  ): Promise<Child | null> {
    const child = await this.findOne(childId);
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    if (!child.medicalInfo.contraindications[contraindicationIndex]) {
      throw new BadRequestException(
        `Invalid contraindication index: ${contraindicationIndex}`,
      );
    }

    child.medicalInfo.contraindications[contraindicationIndex].isActive = false;
    child.audit.updatedAt = new Date();
    return child.save();
  }

  /**
   * Add adverse reaction to child's medical record
   * Requirement 21.8: Adverse reaction tracking system
   */
  async addAdverseReaction(
    childId: string,
    reactionDto: AddAdverseReactionDto,
  ): Promise<Child | null> {
    const child = await this.findOne(childId);
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    child.medicalInfo.adverseReactions.push({
      vaccineType: reactionDto.vaccineType,
      reaction: reactionDto.reaction,
      severity: reactionDto.severity,
      dateReported: new Date(),
      reportedBy: new Types.ObjectId(reactionDto.reportedBy),
      treatment: reactionDto.treatment,
    });

    child.audit.updatedAt = new Date();
    return child.save();
  }

  async search(criteria: {
    zone?: string;
    wereda?: string;
    kebele?: string;
    name?: string;
  }): Promise<Child[]> {
    const query: any = {};

    if (criteria.name) {
      query.$or = [
        { 'personalInfo.firstName': new RegExp(criteria.name, 'i') },
        { 'personalInfo.lastName': new RegExp(criteria.name, 'i') },
      ];
    }

    return this.childModel.find(query).populate('motherId').exec();
  }

  /**
   * Generate digital vaccination card with QR code
   * Requirement 7.1: Digital vaccination card system
   * Requirement 7.2: QR code links to child's vaccination record
   */
  async generateDigitalCard(
    childId: string,
    includeQRCode: boolean = true,
    generateShare: boolean = false,
    baseUrl: string = '',
  ): Promise<Child> {
    const child = await this.findOne(childId);
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    // Generate QR code if requested
    let qrCode: string | undefined;
    if (includeQRCode) {
      qrCode = await generateQRCode(child.childId, baseUrl);
    }

    // Generate share token if requested
    let shareToken: string | undefined;
    if (generateShare) {
      shareToken = generateShareToken();
    }

    // Update digital card information
    child.digitalCard = {
      qrCode,
      lastGenerated: new Date(),
      version: (child.digitalCard?.version || 0) + 1,
      shareToken: shareToken || child.digitalCard?.shareToken,
    };

    child.audit.updatedAt = new Date();
    return child.save();
  }

  /**
   * Get child profile with complete information
   * Requirement 4.6: Child profile displays complete vaccination history and upcoming schedule
   */
  async getChildProfile(id: string): Promise<ChildProfileResponseDto> {
    const child = await this.findOne(id);
    if (!child) {
      throw new NotFoundException(`Child with ID ${id} not found`);
    }

    // Update vaccination statuses based on current date
    const updatedSchedule = updateVaccinationStatuses(child.schedule);

    const profile: ChildProfileResponseDto = {
      _id: child._id.toString(),
      childId: child.childId,
      motherId: child.motherId.toString(),
      clinicId: child.clinicId?.toString(),
      personalInfo: child.personalInfo,
      schedule: updatedSchedule.map((dose) => ({
        vaccineName: dose.vaccineName,
        dueDate: dose.dueDate,
        status: dose.status,
        givenDate: dose.givenDate,
        batchNumber: dose.batchNumber,
        administeredBy: dose.administeredBy?.toString(),
        clinicId: dose.clinicId?.toString(),
        approvedBy: dose.approvedBy?.toString(),
        notes: dose.notes,
      })),
      medicalInfo: {
        birthWeight: child.medicalInfo.birthWeight,
        birthHeight: child.medicalInfo.birthHeight,
        allergies: child.medicalInfo.allergies,
        contraindications: child.medicalInfo.contraindications.map((c) => ({
          type: c.type,
          reason: c.reason,
          flaggedBy: c.flaggedBy.toString(),
          dateFlagged: c.dateFlagged,
          isActive: c.isActive,
        })),
        adverseReactions: child.medicalInfo.adverseReactions.map((r) => ({
          vaccineType: r.vaccineType,
          reaction: r.reaction,
          severity: r.severity,
          dateReported: r.dateReported,
          reportedBy: r.reportedBy.toString(),
          treatment: r.treatment,
        })),
      },
      digitalCard: child.digitalCard,
      audit: {
        createdAt: child.audit.createdAt,
        updatedAt: child.audit.updatedAt,
        createdBy: child.audit.createdBy?.toString(),
        updatedBy: child.audit.updatedBy?.toString(),
      },
      isActive: child.isActive,
    };

    return profile;
  }

  /**
   * Get upcoming vaccinations for a child
   * Requirement 5.1: Vaccination scheduler displays upcoming schedule
   */
  async getUpcomingVaccinations(childId: string): Promise<any[]> {
    const child = await this.findOne(childId);
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    return getUpcomingVaccinations(child.schedule);
  }

  /**
   * Get overdue vaccinations for a child
   * Requirement 5.4: System highlights overdue vaccinations
   */
  async getOverdueVaccinations(childId: string): Promise<any[]> {
    const child = await this.findOne(childId);
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    return getOverdueVaccinations(child.schedule);
  }

  /**
   * Calculate vaccination progress for a child
   */
  async getVaccinationProgress(childId: string): Promise<{
    completed: number;
    total: number;
    percentage: number;
  }> {
    const child = await this.findOne(childId);
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    return calculateVaccinationProgress(child.schedule);
  }

  /**
   * Update vaccination schedule statuses for all children
   * This should be run periodically (e.g., daily cron job)
   */
  async updateAllVaccinationStatuses(): Promise<void> {
    const children = await this.childModel.find().exec();

    for (const child of children) {
      const updatedSchedule = updateVaccinationStatuses(child.schedule);
      child.schedule = updatedSchedule;
      await child.save();
    }
  }

  /**
   * Add allergy to child's medical history
   */
  async addAllergy(childId: string, allergy: string): Promise<Child> {
    const child = await this.findOne(childId);
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    if (!child.medicalInfo.allergies.includes(allergy)) {
      child.medicalInfo.allergies.push(allergy);
      child.audit.updatedAt = new Date();
      return child.save();
    }

    return child;
  }

  /**
   * Remove allergy from child's medical history
   */
  async removeAllergy(childId: string, allergy: string): Promise<Child> {
    const child = await this.findOne(childId);
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    child.medicalInfo.allergies = child.medicalInfo.allergies.filter(
      (a) => a !== allergy,
    );
    child.audit.updatedAt = new Date();
    return child.save();
  }
}

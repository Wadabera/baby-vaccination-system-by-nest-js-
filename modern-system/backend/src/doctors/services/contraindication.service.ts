import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Child } from '../../children/schemas/child.schema';
import { User, UserRole } from '../../users/schemas/user.schema';
import { ContraindicationEntry } from '../../children/schemas/contraindication-entry.schema';
import {
  FlagContraindicationDto,
  RemoveContraindicationDto,
  ContraindicationResponseDto,
} from '../dto/contraindication.dto';

/**
 * Records and clears contraindications that temporarily or permanently block
 * vaccination. Each change is retained (never deleted) so the clinical history
 * stays auditable.
 */
@Injectable()
export class ContraindicationService {
  constructor(
    @InjectModel(ContraindicationEntry.name)
    private readonly contraindicationModel: Model<ContraindicationEntry>,
    @InjectModel(Child.name) private readonly childModel: Model<Child>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async flag(
    dto: FlagContraindicationDto,
  ): Promise<ContraindicationResponseDto> {
    const doctor = await this.requireDoctor(dto.doctorId);
    const child = await this.requireChild(dto.childId);

    // A temporary contraindication needs a review date so it can lapse.
    if (dto.duration === 'temporary' && !dto.reviewDate) {
      throw new BadRequestException(
        'A review date is required for temporary contraindications',
      );
    }

    const created = await this.contraindicationModel.create({
      childId: child._id,
      type: dto.type,
      reason: dto.reason,
      flaggedBy: doctor._id,
      dateFlagged: new Date(),
      isActive: true,
      clinicalEvidence: dto.clinicalEvidence,
      duration: dto.duration ?? 'temporary',
      reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
    });

    return this.toResponse(created, child, doctor);
  }

  async remove(
    dto: RemoveContraindicationDto,
  ): Promise<ContraindicationResponseDto> {
    const doctor = await this.requireDoctor(dto.doctorId);
    const child = await this.requireChild(dto.childId);

    const entry = await this.contraindicationModel
      .findOne({
        _id: dto.contraindicationId,
        childId: child._id,
        isActive: true,
      })
      .exec();

    if (!entry) {
      throw new NotFoundException(
        'Active contraindication not found for this child',
      );
    }

    // A permanent contraindication cannot simply be cleared.
    if (entry.duration === 'permanent') {
      throw new ForbiddenException(
        'A permanent contraindication cannot be removed. Record a medical review instead.',
      );
    }

    entry.isActive = false;
    entry.removedBy = doctor._id;
    entry.removedAt = new Date();
    entry.removalReason = dto.removalReason;
    if (dto.clinicalEvidence) {
      entry.clinicalEvidence = dto.clinicalEvidence;
    }
    await entry.save();

    return this.toResponse(entry, child, doctor);
  }

  /** List contraindications for a child, newest first. */
  async findByChild(
    childId: string,
    activeOnly = false,
  ): Promise<ContraindicationResponseDto[]> {
    const child = await this.requireChild(childId);
    const doctor = await this.userModel
      .findOne({ role: UserRole.DOCTOR, isActive: true })
      .exec();

    const query: Record<string, unknown> = { childId: child._id };
    if (activeOnly) {
      query.isActive = true;
    }

    const entries = await this.contraindicationModel
      .find(query)
      .sort({ dateFlagged: -1 })
      .exec();

    return Promise.all(
      entries.map((entry) => this.toResponse(entry, child, doctor)),
    );
  }

  /**
   * Expire temporary contraindications whose review date has passed.
   * Returns the number of entries closed.
   */
  async expireStale(): Promise<number> {
    const result = await this.contraindicationModel.updateMany(
      {
        isActive: true,
        duration: 'temporary',
        reviewDate: { $lte: new Date() },
      },
      { $set: { isActive: false, removedAt: new Date() } },
    );
    return result.modifiedCount ?? 0;
  }

  // --- helpers -------------------------------------------------------------

  private async requireChild(childId: string) {
    if (!Types.ObjectId.isValid(childId)) {
      throw new NotFoundException('Child not found');
    }
    const child = await this.childModel.findById(childId).exec();
    if (!child) {
      throw new NotFoundException('Child not found');
    }
    return child;
  }

  private async requireDoctor(doctorId: string) {
    if (!Types.ObjectId.isValid(doctorId)) {
      throw new NotFoundException('Doctor not found');
    }
    const doctor = await this.userModel.findById(doctorId).exec();
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    if (doctor.role !== UserRole.DOCTOR) {
      throw new ForbiddenException(
        'Only a doctor can manage contraindications',
      );
    }
    if (!doctor.isActive) {
      throw new ForbiddenException('Doctor account is deactivated');
    }
    return doctor;
  }

  private async toResponse(
    entry: ContraindicationEntry,
    child: Child,
    flagger?: User | null,
  ): Promise<ContraindicationResponseDto> {
    const auditTrail: ContraindicationResponseDto['auditTrail'] = [
      {
        action: 'flagged',
        performedBy: entry.flaggedBy.toString(),
        performedAt: entry.dateFlagged,
        reason: entry.reason,
      },
    ];

    if (!entry.isActive && entry.removedAt) {
      auditTrail.push({
        action: 'removed',
        performedBy: entry.removedBy?.toString() ?? 'system',
        performedAt: entry.removedAt,
        reason: entry.removalReason ?? '',
      });
    }

    return {
      id: entry._id.toString(),
      childId: child._id.toString(),
      childName: `${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
      type: entry.type,
      reason: entry.reason,
      flaggedBy: entry.flaggedBy.toString(),
      flaggedByName: flagger
        ? `${flagger.profile.firstName} ${flagger.profile.lastName}`
        : 'Unknown',
      dateFlagged: entry.dateFlagged,
      isActive: entry.isActive,
      clinicalEvidence: entry.clinicalEvidence,
      duration: entry.duration,
      reviewDate: entry.reviewDate,
      auditTrail,
    };
  }
}

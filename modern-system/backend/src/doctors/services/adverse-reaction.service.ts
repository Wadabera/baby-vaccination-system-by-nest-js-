import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Child } from '../../children/schemas/child.schema';
import { User, UserRole } from '../../users/schemas/user.schema';
import {
  AdverseReactionEntry,
  ReactionSeverity,
  BLOCKING_SEVERITIES,
} from '../../children/schemas/contraindication-entry.schema';
import {
  ReportAdverseReactionDto,
  UpdateAdverseReactionDto,
  DocumentTreatmentDto,
  AdverseReactionResponseDto,
} from '../dto/adverse-reaction.dto';

/**
 * Tracks adverse reactions reported after vaccination, including treatment
 * documentation and follow-up requirements.
 */
@Injectable()
export class AdverseReactionService {
  constructor(
    @InjectModel(AdverseReactionEntry.name)
    private readonly reactionModel: Model<AdverseReactionEntry>,
    @InjectModel(Child.name) private readonly childModel: Model<Child>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async report(
    dto: ReportAdverseReactionDto,
  ): Promise<AdverseReactionResponseDto> {
    const doctor = await this.requireDoctor(dto.reportedBy);
    const child = await this.requireChild(dto.childId);

    // Build the document explicitly so the enum-typed `severity` field is
    // accepted and unset optional fields are simply omitted.
    const created = await new this.reactionModel({
      childId: child._id,
      vaccineType: dto.vaccineType,
      reaction: dto.reaction,
      severity: dto.severity as ReactionSeverity,
      dateReported: new Date(),
      reportedBy: doctor._id,
      ...(dto.treatment !== undefined && { treatment: dto.treatment }),
      ...(dto.onsetDate !== undefined && {
        onsetDate: new Date(dto.onsetDate),
      }),
      ...(dto.duration !== undefined && { duration: dto.duration }),
      ...(dto.outcome !== undefined && { outcome: dto.outcome }),
      ...(dto.clinicalNotes !== undefined && {
        clinicalNotes: dto.clinicalNotes,
      }),
      ...(dto.batchNumber !== undefined && { batchNumber: dto.batchNumber }),
      // Anything severe automatically needs a follow-up appointment.
      followUpRequired: BLOCKING_SEVERITIES.includes(
        dto.severity as ReactionSeverity,
      ),
    }).save();

    return this.toResponse(created, child, doctor);
  }

  async update(
    dto: UpdateAdverseReactionDto,
  ): Promise<AdverseReactionResponseDto> {
    const doctor = await this.requireDoctor(dto.updatedBy);
    const child = await this.requireChild(dto.childId);

    const reaction = await this.reactionModel
      .findOne({ _id: dto.reactionId, childId: child._id })
      .exec();

    if (!reaction) {
      throw new NotFoundException('Adverse reaction not found for this child');
    }

    if (dto.severity) {
      reaction.severity = dto.severity as ReactionSeverity;
      reaction.followUpRequired = BLOCKING_SEVERITIES.includes(
        reaction.severity,
      );
    }
    if (dto.treatment !== undefined) reaction.treatment = dto.treatment;
    if (dto.outcome !== undefined) reaction.outcome = dto.outcome;
    if (dto.followUpNotes !== undefined) {
      reaction.clinicalNotes = [reaction.clinicalNotes, dto.followUpNotes]
        .filter(Boolean)
        .join('\n');
    }

    await reaction.save();
    return this.toResponse(reaction, child, doctor);
  }

  async documentTreatment(
    dto: DocumentTreatmentDto,
  ): Promise<AdverseReactionResponseDto> {
    const doctor = await this.requireDoctor(dto.doctorId);
    const child = await this.requireChild(dto.childId);

    const reaction = await this.reactionModel
      .findOne({ _id: dto.reactionId, childId: child._id })
      .exec();

    if (!reaction) {
      throw new NotFoundException('Adverse reaction not found for this child');
    }

    const parts = [dto.treatment];
    if (dto.medications) parts.push(`Medications: ${dto.medications}`);
    if (dto.procedures) parts.push(`Procedures: ${dto.procedures}`);
    if (dto.followUpPlan) parts.push(`Follow-up: ${dto.followUpPlan}`);

    reaction.treatment = [reaction.treatment, ...parts]
      .filter(Boolean)
      .join('\n');
    reaction.followUpRequired = true;

    await reaction.save();
    return this.toResponse(reaction, child, doctor);
  }

  async findByChild(childId: string): Promise<AdverseReactionResponseDto[]> {
    const child = await this.requireChild(childId);
    const entries = await this.reactionModel
      .find({ childId: child._id })
      .sort({ dateReported: -1 })
      .exec();

    return Promise.all(
      entries.map((entry) => this.toResponse(entry, child, null)),
    );
  }

  /** Recent reactions across all patients, for the clinician dashboard. */
  async findRecent(limit = 20): Promise<AdverseReactionResponseDto[]> {
    const entries = await this.reactionModel
      .find()
      .sort({ dateReported: -1 })
      .limit(limit)
      .populate('childId')
      .exec();

    // `childId` is populated into a full Child document by the populate above.
    return Promise.all(
      entries.map((entry) =>
        this.toResponse(
          entry as unknown as AdverseReactionEntry,
          (entry as unknown as { childId: Child }).childId,
          null,
          true,
        ),
      ),
    );
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

  private async requireDoctor(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Doctor not found');
    }
    const doctor = await this.userModel.findById(userId).exec();
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    if (doctor.role !== UserRole.DOCTOR) {
      throw new ForbiddenException(
        'Only a doctor can report adverse reactions',
      );
    }
    if (!doctor.isActive) {
      throw new ForbiddenException('Doctor account is deactivated');
    }
    return doctor;
  }

  private async toResponse(
    entry: AdverseReactionEntry,
    child: Child,
    reporter?: User | null,
    nameResolved = false,
  ): Promise<AdverseReactionResponseDto> {
    let reporterName = 'Unknown';
    if (reporter) {
      reporterName = `${reporter.profile.firstName} ${reporter.profile.lastName}`;
    } else if (!nameResolved) {
      const found = await this.userModel.findById(entry.reportedBy).exec();
      if (found) {
        reporterName = `${found.profile.firstName} ${found.profile.lastName}`;
      }
    }

    const auditTrail: AdverseReactionResponseDto['auditTrail'] = [
      {
        action: 'reported',
        performedBy: entry.reportedBy.toString(),
        performedAt: entry.dateReported,
        notes: entry.clinicalNotes ?? '',
      },
    ];

    if (entry.treatment) {
      auditTrail.push({
        action: 'treated',
        performedBy: entry.reportedBy.toString(),
        performedAt: entry.dateReported,
        notes: entry.treatment,
      });
    }

    return {
      id: entry._id.toString(),
      childId: child._id.toString(),
      childName: `${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
      vaccineType: entry.vaccineType,
      reaction: entry.reaction,
      severity: entry.severity,
      dateReported: entry.dateReported,
      reportedBy: entry.reportedBy.toString(),
      reportedByName: reporterName,
      treatment: entry.treatment,
      onsetDate: entry.onsetDate,
      duration: entry.duration,
      outcome: entry.outcome,
      clinicalNotes: entry.clinicalNotes,
      batchNumber: entry.batchNumber,
      followUpRequired: entry.followUpRequired ?? false,
      auditTrail,
    };
  }
}

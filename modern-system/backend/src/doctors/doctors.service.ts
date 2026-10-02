import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Child } from '../children/schemas/child.schema';
import { User, UserRole } from '../users/schemas/user.schema';
import {
  ContraindicationEntry,
  AdverseReactionEntry,
  BLOCKING_SEVERITIES,
} from '../children/schemas/contraindication-entry.schema';
import type {
  MedicalReviewResponseDto,
  MedicalReviewDto,
} from './dto/medical-review.dto';

export interface VaccinationSafetyResult {
  isSafe: boolean;
  reasons: string[];
  activeContraindications: number;
  severeAdverseReactions: number;
  requiresApproval: boolean;
}

export interface ReviewQueueItem {
  childId: string;
  childName: string;
  dateOfBirth: Date;
  ageInMonths: number;
  activeContraindications: number;
  severeAdverseReactions: number;
  nextDueDose?: string;
  nextDueDate?: Date;
}

/**
 * Read-oriented clinical queries that span children, users and the safety
 * collections. Mutating workflows live in the dedicated services.
 */
@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Child.name) private readonly childModel: Model<Child>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(ContraindicationEntry.name)
    private readonly contraindicationModel: Model<ContraindicationEntry>,
    @InjectModel(AdverseReactionEntry.name)
    private readonly reactionModel: Model<AdverseReactionEntry>,
  ) {}

  async countPatients(): Promise<{ children: number; mothers: number }> {
    const [children, mothers] = await Promise.all([
      this.childModel.countDocuments({ isActive: true }),
      this.childModel.db
        .collection('mothers')
        .countDocuments({ isActive: true }),
    ]);
    return { children, mothers };
  }

  /** Compile a child's full clinical picture for a doctor to review. */
  async review(dto: MedicalReviewDto): Promise<MedicalReviewResponseDto> {
    const doctor = await this.requireDoctor(dto.doctorId);
    const child = await this.requireChild(dto.patientId);

    const [contraindications, reactions] = await Promise.all([
      this.contraindicationModel
        .find({ childId: child._id, isActive: true })
        .exec(),
      this.reactionModel
        .find({ childId: child._id })
        .sort({ dateReported: -1 })
        .exec(),
    ]);

    const mother = child.motherId
      ? await this.childModel.db
          .collection('mothers')
          .findOne({ _id: child.motherId })
      : null;

    return {
      patientId: child._id.toString(),
      patientName: `${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
      doctorId: doctor._id.toString(),
      doctorName: `${doctor.profile.firstName} ${doctor.profile.lastName}`,
      reviewDate: new Date(),
      allergies: child.medicalInfo?.allergies ?? [],
      chronicConditions:
        (mother?.medicalHistory?.chronicConditions as string[]) ?? [],
      previousAdverseReactions: reactions.map((r) => ({
        vaccineType: r.vaccineType,
        reaction: r.reaction,
        severity: r.severity,
        dateReported: r.dateReported,
      })),
      activeContraindications: contraindications.map((c) => ({
        type: c.type,
        reason: c.reason,
        flaggedBy: c.flaggedBy.toString(),
        dateFlagged: c.dateFlagged,
      })),
      vaccinationHistory: child.schedule.map((dose) => ({
        vaccineName: dose.vaccineName,
        status: dose.status,
        dueDate: dose.dueDate,
        givenDate: dose.givenDate,
      })),
      clinicalNotes: dto.clinicalNotes,
      recommendation: dto.recommendation,
    };
  }

  /**
   * Decide whether a child may receive a dose.
   *
   * An active contraindication or a prior severe reaction blocks vaccination
   * outright; recorded allergies require a doctor to sign off first.
   */
  async checkSafety(childId: string): Promise<VaccinationSafetyResult> {
    const child = await this.requireChild(childId);

    const [contraindications, severeReactions] = await Promise.all([
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
    let isSafe = true;
    let requiresApproval = false;

    if (contraindications.length > 0) {
      isSafe = false;
      reasons.push(
        `Active contraindication(s): ${contraindications.map((c) => c.type).join(', ')}`,
      );
    }

    if (severeReactions.length > 0) {
      isSafe = false;
      requiresApproval = true;
      reasons.push(
        `History of ${severeReactions.length} severe adverse reaction(s): ${severeReactions
          .map((r) => r.reaction)
          .join(', ')}`,
      );
    }

    const allergies = child.medicalInfo?.allergies ?? [];
    if (allergies.length > 0) {
      requiresApproval = true;
      reasons.push(`Known allergies require review: ${allergies.join(', ')}`);
    }

    if (reasons.length === 0) {
      reasons.push('No contraindications or adverse reactions on record');
    }

    return {
      isSafe,
      reasons,
      activeContraindications: contraindications.length,
      severeAdverseReactions: severeReactions.length,
      requiresApproval,
    };
  }

  /**
   * Children a doctor should look at: those with an unresolved safety flag and
   * those whose next dose is due now or overdue.
   */
  async reviewQueue(limit = 50): Promise<ReviewQueueItem[]> {
    const children = await this.childModel
      .find({ isActive: true })
      .sort({ 'personalInfo.birthDate': -1 })
      .limit(limit)
      .exec();

    const ids = children.map((c) => c._id);

    const [contraindications, reactions] = await Promise.all([
      this.contraindicationModel
        .find({ childId: { $in: ids }, isActive: true })
        .exec(),
      this.reactionModel
        .find({
          childId: { $in: ids },
          severity: { $in: [...BLOCKING_SEVERITIES] },
        })
        .exec(),
    ]);

    const now = Date.now();
    const byChild = (list: Array<{ childId: unknown }>, id: string) =>
      list.filter((item) => String(item.childId) === id).length;

    return children
      .map((child) => {
        const id = child._id.toString();
        const pending = child.schedule
          .filter((d) => d.status === 'pending' || d.status === 'overdue')
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        const next = pending[0];
        const dueCount = byChild(contraindications, id);
        const severeCount = byChild(reactions, id);

        return {
          childId: id,
          childName: `${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
          dateOfBirth: child.personalInfo.birthDate,
          ageInMonths: monthsBetween(child.personalInfo.birthDate, new Date()),
          activeContraindications: dueCount,
          severeAdverseReactions: severeCount,
          nextDueDose: next?.vaccineName,
          nextDueDate: next?.dueDate,
        };
      })
      .filter(
        (item) =>
          item.activeContraindications > 0 ||
          item.severeAdverseReactions > 0 ||
          (!!item.nextDueDate && item.nextDueDate.getTime() <= now),
      );
  }

  // --- helpers -------------------------------------------------------------

  private async requireChild(childId: string) {
    const child = await this.childModel.findById(childId).exec();
    if (!child) {
      throw new NotFoundException('Child not found');
    }
    return child;
  }

  private async requireDoctor(doctorId: string) {
    const doctor = await this.userModel.findById(doctorId).exec();
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    if (doctor.role !== UserRole.DOCTOR || !doctor.isActive) {
      throw new NotFoundException('Active doctor not found');
    }
    return doctor;
  }
}

export function monthsBetween(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  return from.getDate() > to.getDate() ? months - 1 : months;
}

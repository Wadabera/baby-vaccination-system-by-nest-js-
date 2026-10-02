import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Child } from '../../children/schemas/child.schema';
import { Mother } from '../../mothers/schemas/mother.schema';
import { User, UserRole } from '../../users/schemas/user.schema';
import {
  MedicalReviewDto,
  MedicalReviewResponseDto,
} from '../dto/medical-review.dto';

/**
 * Medical history review: assembles a child's allergies, chronic conditions,
 * prior adverse reactions and contraindications into a single review record.
 */
@Injectable()
export class MedicalReviewService {
  constructor(
    @InjectModel(Child.name) private readonly childModel: Model<Child>,
    @InjectModel(Mother.name) private readonly motherModel: Model<Mother>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async performMedicalReview(
    dto: MedicalReviewDto,
  ): Promise<MedicalReviewResponseDto> {
    const doctor = await this.requireDoctor(dto.doctorId);

    const child = await this.childModel.findById(dto.patientId).exec();
    if (!child) {
      throw new NotFoundException(`Child with ID ${dto.patientId} not found`);
    }

    const mother = child.motherId
      ? await this.motherModel.findById(child.motherId).exec()
      : null;

    return {
      patientId: child._id.toString(),
      patientName: `${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
      doctorId: doctor._id.toString(),
      doctorName: `${doctor.profile.firstName} ${doctor.profile.lastName}`,
      reviewDate: new Date(),
      allergies: child.medicalInfo?.allergies ?? [],
      chronicConditions: mother?.medicalHistory?.chronicConditions ?? [],
      previousAdverseReactions: (child.medicalInfo?.adverseReactions ?? []).map(
        (reaction) => ({
          vaccineType: reaction.vaccineType,
          reaction: reaction.reaction,
          severity: reaction.severity,
          dateReported: reaction.dateReported,
        }),
      ),
      activeContraindications: (child.medicalInfo?.contraindications ?? [])
        .filter((c) => c.isActive)
        .map((c) => ({
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

  async getMedicalHistory(
    childId: string,
    doctorId: string,
  ): Promise<MedicalReviewResponseDto> {
    await this.requireDoctor(doctorId);
    return this.performMedicalReview({ patientId: childId, doctorId });
  }

  /**
   * Quick safety verdict used before administering a dose.
   * Blocks on active contraindications or severe reactions; allergies alone
   * flag the case for review rather than blocking it.
   */
  async checkVaccinationSafety(childId: string): Promise<{
    isSafe: boolean;
    reasons: string[];
    activeContraindications: number;
    severeAdverseReactions: number;
  }> {
    const child = await this.childModel.findById(childId).exec();
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    const reasons: string[] = [];
    let isSafe = true;

    const activeContraindications = (
      child.medicalInfo?.contraindications ?? []
    ).filter((c) => c.isActive);
    if (activeContraindications.length > 0) {
      isSafe = false;
      reasons.push(
        `Child has ${activeContraindications.length} active contraindication(s): ${activeContraindications
          .map((c) => c.type)
          .join(', ')}`,
      );
    }

    const severeReactions = (child.medicalInfo?.adverseReactions ?? []).filter(
      (r) => r.severity === 'severe' || r.severity === 'life_threatening',
    );
    if (severeReactions.length > 0) {
      isSafe = false;
      reasons.push(
        `Child has history of ${severeReactions.length} severe adverse reaction(s)`,
      );
    }

    const allergies = child.medicalInfo?.allergies ?? [];
    if (allergies.length > 0) {
      reasons.push(
        `Child has known allergies: ${allergies.join(', ')} - requires review`,
      );
    }

    return {
      isSafe,
      reasons,
      activeContraindications: activeContraindications.length,
      severeAdverseReactions: severeReactions.length,
    };
  }

  /** Children carrying an unresolved safety flag, for the doctor's worklist. */
  async getChildrenRequiringReview(): Promise<
    Array<{
      childId: string;
      childName: string;
      activeContraindications: number;
      severeAdverseReactions: number;
      lastReviewDate?: Date;
    }>
  > {
    const children = await this.childModel.find().exec();

    return children
      .map((child) => {
        const activeContraindications = (
          child.medicalInfo?.contraindications ?? []
        ).filter((c) => c.isActive).length;
        const severeReactions = (
          child.medicalInfo?.adverseReactions ?? []
        ).filter(
          (r) => r.severity === 'severe' || r.severity === 'life_threatening',
        ).length;

        return {
          childId: child._id.toString(),
          childName: `${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
          activeContraindications,
          severeAdverseReactions: severeReactions,
          lastReviewDate: child.audit?.updatedAt,
        };
      })
      .filter(
        (item) =>
          item.activeContraindications > 0 || item.severeAdverseReactions > 0,
      );
  }

  private async requireDoctor(doctorId: string) {
    const doctor = await this.userModel.findById(doctorId).exec();
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
    if (doctor.role !== UserRole.DOCTOR) {
      throw new ForbiddenException(
        `User ${doctorId} is not a doctor and cannot perform medical reviews`,
      );
    }
    if (!doctor.isActive) {
      throw new ForbiddenException(`Doctor ${doctorId} is not active`);
    }
    return doctor;
  }
}

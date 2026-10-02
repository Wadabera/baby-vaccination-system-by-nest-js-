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
import {
  ApprovalRequestDto,
  ApprovalResponseDto,
  DualApprovalRequestDto,
} from '../dto/approval-request.dto';

/**
 * Service for vaccination approval workflow
 * Requirement 21.2: Doctor approval system for vaccinations (approve/reject with mandatory medical justification)
 * Requirement 21.6: Dual doctor approval for vaccinations against medical advice
 */
@Injectable()
export class ApprovalService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<Child>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Process vaccination approval request
   * Requires mandatory medical justification
   */
  async processApproval(
    approvalDto: ApprovalRequestDto,
  ): Promise<ApprovalResponseDto> {
    // 1. Validate doctor
    const doctor = await this.userModel.findById(approvalDto.doctorId).exec();
    if (!doctor) {
      throw new NotFoundException(
        `Doctor with ID ${approvalDto.doctorId} not found`,
      );
    }

    if (doctor.role !== UserRole.DOCTOR) {
      throw new ForbiddenException(
        `User ${approvalDto.doctorId} is not a doctor and cannot approve vaccinations`,
      );
    }

    if (!doctor.isActive) {
      throw new ForbiddenException(
        `Doctor ${approvalDto.doctorId} is not active and cannot approve vaccinations`,
      );
    }

    // 2. Validate child and dose
    const child = await this.childModel.findById(approvalDto.childId).exec();
    if (!child) {
      throw new NotFoundException(
        `Child with ID ${approvalDto.childId} not found`,
      );
    }

    if (!child.schedule || !child.schedule[approvalDto.doseIndex]) {
      throw new BadRequestException(
        `Invalid dose index: ${approvalDto.doseIndex}`,
      );
    }

    const dose = child.schedule[approvalDto.doseIndex];

    // 3. Check if already completed
    if (dose.status === 'completed') {
      throw new BadRequestException(
        `Vaccination at dose index ${approvalDto.doseIndex} has already been administered`,
      );
    }

    // 4. Validate medical justification is provided
    if (
      !approvalDto.medicalJustification ||
      approvalDto.medicalJustification.trim().length < 10
    ) {
      throw new BadRequestException(
        'Medical justification is mandatory and must be at least 10 characters',
      );
    }

    // 5. Process approval or rejection
    if (approvalDto.decision === 'approved') {
      // Mark as approved
      dose.approvedBy = new Types.ObjectId(approvalDto.doctorId);
      dose.notes = `APPROVED by Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}. Justification: ${approvalDto.medicalJustification}`;

      if (approvalDto.conditions) {
        dose.notes += ` | Conditions: ${approvalDto.conditions}`;
      }
    } else {
      // Mark as rejected
      dose.notes = `REJECTED by Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}. Justification: ${approvalDto.medicalJustification}`;

      if (approvalDto.alternativeRecommendation) {
        dose.notes += ` | Alternative: ${approvalDto.alternativeRecommendation}`;
      }

      // Update status to indicate rejection
      dose.status = 'rejected';
    }

    // 6. Update audit trail
    child.audit.updatedAt = new Date();
    child.audit.updatedBy = new Types.ObjectId(approvalDto.doctorId);

    await child.save();

    // 7. Return response
    const response: ApprovalResponseDto = {
      approvalId: `APR-${child._id}-${approvalDto.doseIndex}`,
      childId: child._id.toString(),
      childName: `${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
      doseIndex: approvalDto.doseIndex,
      vaccineName: dose.vaccineName,
      doctorId: doctor._id.toString(),
      doctorName: `${doctor.profile.firstName} ${doctor.profile.lastName}`,
      decision: approvalDto.decision,
      medicalJustification: approvalDto.medicalJustification,
      conditions: approvalDto.conditions,
      alternativeRecommendation: approvalDto.alternativeRecommendation,
      approvalDate: new Date(),
      status: approvalDto.decision === 'approved' ? 'completed' : 'completed',
    };

    return response;
  }

  /**
   * Process dual doctor approval for vaccinations against medical advice
   * Requirement 21.6: Dual doctor approval system
   */
  async processDualApproval(
    dualApprovalDto: DualApprovalRequestDto,
  ): Promise<ApprovalResponseDto> {
    // 1. Validate both doctors
    const primaryDoctor = await this.userModel
      .findById(dualApprovalDto.primaryDoctorId)
      .exec();
    const secondaryDoctor = await this.userModel
      .findById(dualApprovalDto.secondaryDoctorId)
      .exec();

    if (!primaryDoctor) {
      throw new NotFoundException(
        `Primary doctor with ID ${dualApprovalDto.primaryDoctorId} not found`,
      );
    }

    if (!secondaryDoctor) {
      throw new NotFoundException(
        `Secondary doctor with ID ${dualApprovalDto.secondaryDoctorId} not found`,
      );
    }

    // Ensure both are doctors
    if (primaryDoctor.role !== UserRole.DOCTOR) {
      throw new ForbiddenException(
        `Primary user ${dualApprovalDto.primaryDoctorId} is not a doctor`,
      );
    }

    if (secondaryDoctor.role !== UserRole.DOCTOR) {
      throw new ForbiddenException(
        `Secondary user ${dualApprovalDto.secondaryDoctorId} is not a doctor`,
      );
    }

    // Ensure both are active
    if (!primaryDoctor.isActive || !secondaryDoctor.isActive) {
      throw new ForbiddenException(
        'Both doctors must be active to provide dual approval',
      );
    }

    // Ensure they are different doctors
    if (dualApprovalDto.primaryDoctorId === dualApprovalDto.secondaryDoctorId) {
      throw new BadRequestException(
        'Primary and secondary doctors must be different',
      );
    }

    // 2. Validate child and dose
    const child = await this.childModel
      .findById(dualApprovalDto.childId)
      .exec();
    if (!child) {
      throw new NotFoundException(
        `Child with ID ${dualApprovalDto.childId} not found`,
      );
    }

    if (!child.schedule || !child.schedule[dualApprovalDto.doseIndex]) {
      throw new BadRequestException(
        `Invalid dose index: ${dualApprovalDto.doseIndex}`,
      );
    }

    const dose = child.schedule[dualApprovalDto.doseIndex];

    // 3. Check if already completed
    if (dose.status === 'completed') {
      throw new BadRequestException(
        `Vaccination at dose index ${dualApprovalDto.doseIndex} has already been administered`,
      );
    }

    // 4. Validate justifications
    if (
      !dualApprovalDto.primaryJustification ||
      dualApprovalDto.primaryJustification.trim().length < 10
    ) {
      throw new BadRequestException(
        'Primary justification must be at least 10 characters',
      );
    }

    if (
      !dualApprovalDto.secondaryJustification ||
      dualApprovalDto.secondaryJustification.trim().length < 10
    ) {
      throw new BadRequestException(
        'Secondary justification must be at least 10 characters',
      );
    }

    if (
      !dualApprovalDto.rationale ||
      dualApprovalDto.rationale.trim().length < 20
    ) {
      throw new BadRequestException(
        'Rationale for vaccination against medical advice must be at least 20 characters',
      );
    }

    // 5. Mark as dual approved
    dose.approvedBy = new Types.ObjectId(dualApprovalDto.primaryDoctorId);
    dose.notes =
      `DUAL APPROVAL (Against Medical Advice)\n` +
      `Primary Doctor: Dr. ${primaryDoctor.profile.firstName} ${primaryDoctor.profile.lastName}\n` +
      `Primary Justification: ${dualApprovalDto.primaryJustification}\n` +
      `Secondary Doctor: Dr. ${secondaryDoctor.profile.firstName} ${secondaryDoctor.profile.lastName}\n` +
      `Secondary Justification: ${dualApprovalDto.secondaryJustification}\n` +
      `Rationale: ${dualApprovalDto.rationale}`;

    if (dualApprovalDto.parentConsent) {
      dose.notes += `\nParent Consent: ${dualApprovalDto.parentConsent}`;
    }

    // 6. Update audit trail
    child.audit.updatedAt = new Date();
    child.audit.updatedBy = new Types.ObjectId(dualApprovalDto.primaryDoctorId);

    await child.save();

    // 7. Return response
    const response: ApprovalResponseDto = {
      approvalId: `DUAL-APR-${child._id}-${dualApprovalDto.doseIndex}`,
      childId: child._id.toString(),
      childName: `${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
      doseIndex: dualApprovalDto.doseIndex,
      vaccineName: dose.vaccineName,
      doctorId: `${primaryDoctor._id} & ${secondaryDoctor._id}`,
      doctorName: `Dr. ${primaryDoctor.profile.firstName} ${primaryDoctor.profile.lastName} & Dr. ${secondaryDoctor.profile.firstName} ${secondaryDoctor.profile.lastName}`,
      decision: 'approved',
      medicalJustification: `Dual approval with rationale: ${dualApprovalDto.rationale}`,
      approvalDate: new Date(),
      status: 'completed',
    };

    return response;
  }

  /**
   * Get pending approvals for a doctor
   */
  async getPendingApprovals(doctorId: string): Promise<
    {
      childId: string;
      childName: string;
      doseIndex: number;
      vaccineName: string;
      dueDate: Date;
      requiresApproval: boolean;
      hasContraindications: boolean;
    }[]
  > {
    // Validate doctor
    const doctor = await this.userModel.findById(doctorId).exec();
    if (!doctor || doctor.role !== UserRole.DOCTOR) {
      throw new ForbiddenException('Only doctors can view pending approvals');
    }

    // Find all children with pending vaccinations that need approval
    const children = await this.childModel.find().exec();

    const pendingApprovals: any[] = [];

    for (const child of children) {
      const hasActiveContraindications =
        child.medicalInfo.contraindications.some((c) => c.isActive);

      for (let i = 0; i < child.schedule.length; i++) {
        const dose = child.schedule[i];

        // Check if dose is pending and requires approval
        if (
          dose.status === 'pending' &&
          !dose.approvedBy &&
          hasActiveContraindications
        ) {
          pendingApprovals.push({
            childId: child._id.toString(),
            childName: `${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
            doseIndex: i,
            vaccineName: dose.vaccineName,
            dueDate: dose.dueDate,
            requiresApproval: true,
            hasContraindications: true,
          });
        }
      }
    }

    return pendingApprovals;
  }

  /**
   * Get approval history for a child
   */
  async getApprovalHistory(childId: string): Promise<
    {
      doseIndex: number;
      vaccineName: string;
      approvedBy?: string;
      approvalDate?: Date;
      notes?: string;
      status: string;
    }[]
  > {
    const child = await this.childModel
      .findById(childId)
      .populate('schedule.approvedBy')
      .exec();
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    return child.schedule.map((dose, index) => ({
      doseIndex: index,
      vaccineName: dose.vaccineName,
      approvedBy: dose.approvedBy?.toString(),
      approvalDate: dose.givenDate,
      notes: dose.notes,
      status: dose.status,
    }));
  }
}

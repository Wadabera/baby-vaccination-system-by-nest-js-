import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { DoctorsService } from './doctors.service';
import { MedicalReviewService } from './services/medical-review.service';
import { ApprovalService } from './services/approval.service';
import { ContraindicationService } from './services/contraindication.service';
import { AdverseReactionService } from './services/adverse-reaction.service';
import { MedicalReviewDto } from './dto/medical-review.dto';
import {
  FlagContraindicationDto,
  RemoveContraindicationDto,
} from './dto/contraindication.dto';
import {
  ReportAdverseReactionDto,
  UpdateAdverseReactionDto,
  DocumentTreatmentDto,
} from './dto/adverse-reaction.dto';

/**
 * Clinical endpoints. Every route is doctor-only: the caller must present both
 * a valid JWT and the `doctor` role.
 */
@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly medicalReviewService: MedicalReviewService,
    private readonly approvalService: ApprovalService,
    private readonly contraindicationService: ContraindicationService,
    private readonly adverseReactionService: AdverseReactionService,
  ) {}

  @Get('patients/summary')
  async summary() {
    return this.doctorsService.countPatients();
  }

  @Get('review-queue')
  async reviewQueue(@Query('limit') limit?: string) {
    return this.doctorsService.reviewQueue(limit ? Number(limit) : undefined);
  }

  @Post('medical-review')
  @HttpCode(HttpStatus.OK)
  async medicalReview(@Body() dto: MedicalReviewDto) {
    return this.medicalReviewService.performMedicalReview(dto);
  }

  @Get('medical-history/:childId')
  async medicalHistory(
    @Param('childId') childId: string,
    @Query('doctorId') doctorId: string,
  ) {
    return this.medicalReviewService.getMedicalHistory(childId, doctorId);
  }

  @Get('vaccination-safety/:childId')
  async vaccinationSafety(@Param('childId') childId: string) {
    return this.doctorsService.checkSafety(childId);
  }

  // --- contraindications ---------------------------------------------------

  @Get('contraindications/:childId')
  async listContraindications(
    @Param('childId') childId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.contraindicationService.findByChild(
      childId,
      activeOnly !== 'false',
    );
  }

  @Post('contraindications')
  @HttpCode(HttpStatus.CREATED)
  async flagContraindication(@Body() dto: FlagContraindicationDto) {
    return this.contraindicationService.flag(dto);
  }

  @Post('contraindications/remove')
  @HttpCode(HttpStatus.OK)
  async removeContraindication(@Body() dto: RemoveContraindicationDto) {
    return this.contraindicationService.remove(dto);
  }

  // --- adverse reactions ---------------------------------------------------

  @Get('adverse-reactions/:childId')
  async listAdverseReactions(@Param('childId') childId: string) {
    return this.adverseReactionService.findByChild(childId);
  }

  @Get('adverse-reactions')
  async recentAdverseReactions(@Query('limit') limit?: string) {
    return this.adverseReactionService.findRecent(
      limit ? Number(limit) : undefined,
    );
  }

  @Post('adverse-reactions')
  @HttpCode(HttpStatus.CREATED)
  async reportAdverseReaction(@Body() dto: ReportAdverseReactionDto) {
    return this.adverseReactionService.report(dto);
  }

  @Post('adverse-reactions/update')
  @HttpCode(HttpStatus.OK)
  async updateAdverseReaction(@Body() dto: UpdateAdverseReactionDto) {
    return this.adverseReactionService.update(dto);
  }

  @Post('adverse-reactions/treatment')
  @HttpCode(HttpStatus.OK)
  async documentTreatment(@Body() dto: DocumentTreatmentDto) {
    return this.adverseReactionService.documentTreatment(dto);
  }
}

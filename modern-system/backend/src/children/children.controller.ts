import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ChildrenService } from './children.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { RecordVaccinationDto } from './dto/record-vaccination.dto';
import { AddContraindicationDto } from './dto/add-contraindication.dto';
import { AddAdverseReactionDto } from './dto/add-adverse-reaction.dto';
import { GenerateDigitalCardDto } from './dto/generate-digital-card.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

/** Roles allowed to register and edit patient records. */
const STAFF = [UserRole.ADMIN, UserRole.REGISTRAR];
/** Roles allowed to administer a dose. */
const CLINICAL = [UserRole.ADMIN, UserRole.REGISTRAR, UserRole.DOCTOR];

@Controller('children')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Post()
  @Roles(...STAFF)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateChildDto) {
    return this.childrenService.create(dto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    const { name, zone, wereda, kebele } = query;
    if (name || zone || wereda || kebele) {
      return this.childrenService.search({ name, zone, wereda, kebele });
    }
    return this.childrenService.findAll();
  }

  /**
   * Children linked to the signed-in parent.
   * A parent must never be able to list every child in the system, so this
   * filters by the `childrenIds` on their own user record.
   */
  @Get('my-children')
  @Roles(UserRole.PARENT)
  async myChildren(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }
    return this.childrenService.findByParent(userId);
  }

  /** Children with a dose due now or overdue, for the clinic worklist. */
  @Get('due-for-vaccination')
  @Roles(...CLINICAL)
  findDue(@Query('withinDays') withinDays?: string) {
    return this.childrenService.findDueForVaccination(
      withinDays ? Number(withinDays) : undefined,
    );
  }

  @Get('mother/:motherId')
  findByMother(@Param('motherId') motherId: string) {
    return this.childrenService.findByMother(motherId);
  }

  @Get(':id/profile')
  getProfile(@Param('id') id: string) {
    return this.childrenService.getChildProfile(id);
  }

  @Get(':id/upcoming')
  getUpcoming(@Param('id') id: string) {
    return this.childrenService.getUpcomingVaccinations(id);
  }

  @Get(':id/overdue')
  getOverdue(@Param('id') id: string) {
    return this.childrenService.getOverdueVaccinations(id);
  }

  @Get(':id/progress')
  getProgress(@Param('id') id: string) {
    return this.childrenService.getVaccinationProgress(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.childrenService.findOne(id);
  }

  @Patch(':id')
  @Roles(...STAFF)
  update(@Param('id') id: string, @Body() dto: UpdateChildDto) {
    return this.childrenService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.childrenService.remove(id);
  }

  /** Record a dose. The administering clinician is always taken from the JWT. */
  @Post(':id/vaccinations')
  @Roles(...CLINICAL)
  @HttpCode(HttpStatus.OK)
  recordVaccination(
    @Param('id') id: string,
    @Body() dto: RecordVaccinationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // JwtAuthGuard guarantees this; the check keeps the type honest.
    const actorId = req.user?.userId ?? '';
    return this.childrenService.recordVaccination(id, {
      doseIndex: dto.doseIndex,
      batchNumber: dto.batchNumber,
      clinicId: dto.clinicId,
      approvedBy: dto.approvedBy,
      notes: dto.notes,
      // Never trust a client-supplied administrator.
      administeredBy: actorId,
    });
  }

  @Post(':id/contraindications')
  @Roles(...CLINICAL)
  @HttpCode(HttpStatus.CREATED)
  addContraindication(
    @Param('id') childId: string,
    @Body() dto: AddContraindicationDto,
  ) {
    return this.childrenService.addContraindication(childId, dto);
  }

  @Patch(':id/contraindications/:index/deactivate')
  @Roles(...CLINICAL)
  deactivateContraindication(
    @Param('id') childId: string,
    @Param('index') index: string,
  ) {
    return this.childrenService.deactivateContraindication(
      childId,
      Number(index),
    );
  }

  @Post(':id/adverse-reactions')
  @Roles(...CLINICAL)
  @HttpCode(HttpStatus.CREATED)
  addAdverseReaction(
    @Param('id') childId: string,
    @Body() dto: AddAdverseReactionDto,
  ) {
    return this.childrenService.addAdverseReaction(childId, dto);
  }

  @Post(':id/digital-card')
  @Roles(...CLINICAL)
  @HttpCode(HttpStatus.OK)
  generateDigitalCard(
    @Param('id') childId: string,
    @Body() dto: GenerateDigitalCardDto,
    @Query('baseUrl') baseUrl?: string,
  ) {
    return this.childrenService.generateDigitalCard(
      childId,
      dto.includeQRCode,
      dto.generateShareToken,
      baseUrl ?? '',
    );
  }

  @Post(':id/allergies')
  @Roles(...CLINICAL)
  @HttpCode(HttpStatus.CREATED)
  addAllergy(@Param('id') childId: string, @Body('allergy') allergy: string) {
    return this.childrenService.addAllergy(childId, allergy);
  }

  @Delete(':id/allergies/:allergy')
  @Roles(...CLINICAL)
  removeAllergy(
    @Param('id') childId: string,
    @Param('allergy') allergy: string,
  ) {
    return this.childrenService.removeAllergy(childId, allergy);
  }
}

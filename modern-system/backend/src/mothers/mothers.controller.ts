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
} from '@nestjs/common';
import { MothersService } from './mothers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreateMotherDto } from './dto/create-mother.dto';
import { UpdateMotherDto } from './dto/update-mother.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';
import { LinkChildDto } from './dto/link-child.dto';
import { RecordDoseDto } from '../children/dto/record-vaccination.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('mothers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MothersController {
  constructor(private readonly mothersService: MothersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.REGISTRAR)
  create(@Body() dto: CreateMotherDto) {
    return this.mothersService.create(dto);
  }

  @Get()
  async findAll(@Query() query: Record<string, string>) {
    const { zone, wereda, kebele, phoneNumber, name } = query;
    if (zone || wereda || kebele || phoneNumber || name) {
      return this.mothersService.search({
        zone,
        wereda,
        kebele,
        phoneNumber,
        name,
      });
    }
    return this.mothersService.findAll();
  }

  /** Mothers with a TT or Rh dose due now or overdue, for the reminder list. */
  @Get('due-for-vaccination')
  @Roles(UserRole.DOCTOR, UserRole.REGISTRAR, UserRole.ADMIN)
  findDueForVaccination() {
    return this.mothersService.findDueForVaccination();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mothersService.findOne(id);
  }

  @Get(':id/profile')
  getMotherProfile(@Param('id') id: string) {
    return this.mothersService.getMotherProfile(id);
  }

  @Get(':id/children')
  getMotherChildren(@Param('id') motherId: string) {
    return this.mothersService.getMotherChildren(motherId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.REGISTRAR)
  update(@Param('id') id: string, @Body() dto: UpdateMotherDto) {
    return this.mothersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.REGISTRAR)
  remove(@Param('id') id: string) {
    return this.mothersService.remove(id);
  }

  // --- TT / Rh schedule ----------------------------------------------------

  /** Record a TT or Rh dose as administered. */
  @Post(':id/doses')
  @Roles(UserRole.DOCTOR, UserRole.REGISTRAR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  recordDose(
    @Param('id') id: string,
    @Body() dto: RecordDoseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mothersService.recordDose(id, dto, req.user?.userId ?? '');
  }

  /** Return a dose to pending, e.g. when recorded against the wrong patient. */
  @Delete(':id/doses/:vaccineName')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  revokeDose(
    @Param('id') id: string,
    @Param('vaccineName') vaccineName: string,
  ) {
    return this.mothersService.revokeDose(id, vaccineName);
  }

  // --- children links ------------------------------------------------------

  @Post(':id/link-child')
  @Roles(UserRole.ADMIN, UserRole.REGISTRAR)
  linkChild(@Param('id') motherId: string, @Body() dto: LinkChildDto) {
    return this.mothersService.linkChild(motherId, dto.childId);
  }

  @Post(':id/unlink-child')
  @Roles(UserRole.ADMIN, UserRole.REGISTRAR)
  unlinkChild(@Param('id') motherId: string, @Body() dto: LinkChildDto) {
    return this.mothersService.unlinkChild(motherId, dto.childId);
  }

  // --- medical history -----------------------------------------------------

  @Patch(':id/medical-history')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  updateMedicalHistory(
    @Param('id') id: string,
    @Body() dto: UpdateMedicalHistoryDto,
  ) {
    return this.mothersService.updateMedicalHistory(id, dto);
  }

  @Post(':id/medical-history/allergies')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  addAllergy(@Param('id') id: string, @Body('allergy') allergy: string) {
    return this.mothersService.addAllergy(id, allergy);
  }

  @Delete(':id/medical-history/allergies/:allergy')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  removeAllergy(@Param('id') id: string, @Param('allergy') allergy: string) {
    return this.mothersService.removeAllergy(id, allergy);
  }

  @Post(':id/medical-history/chronic-conditions')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  addChronicCondition(
    @Param('id') id: string,
    @Body('condition') condition: string,
  ) {
    return this.mothersService.addChronicCondition(id, condition);
  }

  @Delete(':id/medical-history/chronic-conditions/:condition')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  removeChronicCondition(
    @Param('id') id: string,
    @Param('condition') condition: string,
  ) {
    return this.mothersService.removeChronicCondition(id, condition);
  }
}

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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { SearchClinicDto } from './dto/search-clinic.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AssignStaffDto } from './dto/assign-staff.dto';

@Controller('clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  /**
   * Create a new clinic
   * POST /clinics
   */
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createClinicDto: CreateClinicDto) {
    return this.clinicsService.create(createClinicDto);
  }

  /**
   * Get all clinics or search with filters
   * GET /clinics?lat=9.0&lng=38.7&maxDistanceKm=10
   */
  @Get()
  findAll(@Query() searchDto: SearchClinicDto) {
    // If any search parameters are provided, use search
    if (Object.keys(searchDto).length > 0) {
      return this.clinicsService.search(searchDto);
    }
    return this.clinicsService.findAll();
  }

  /**
   * Get clinic statistics
   * GET /clinics/statistics
   */
  @Get('statistics')
  getStatistics() {
    return this.clinicsService.getStatistics();
  }

  /**
   * Find clinics by zone and wereda
   * GET /clinics/zone/:zone/wereda/:wereda
   */
  @Get('zone/:zone/wereda/:wereda')
  findByZoneWereda(
    @Param('zone') zone: string,
    @Param('wereda') wereda: string,
  ) {
    return this.clinicsService.findByZoneWereda(zone, wereda);
  }

  /**
   * Find clinics by staff member
   * GET /clinics/staff/:userId
   */
  @Get('staff/:userId')
  findByStaffMember(@Param('userId') userId: string) {
    return this.clinicsService.findByStaffMember(userId);
  }

  /**
   * Get a specific clinic by ID
   * GET /clinics/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(id);
  }

  /**
   * Update clinic information
   * PATCH /clinics/:id
   */
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClinicDto: UpdateClinicDto) {
    return this.clinicsService.update(id, updateClinicDto);
  }

  /**
   * Soft delete a clinic
   * DELETE /clinics/:id
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.clinicsService.remove(id);
  }

  /**
   * Get clinic inventory
   * GET /clinics/:id/inventory
   */
  @Get(':id/inventory')
  getInventory(@Param('id') clinicId: string) {
    return this.clinicsService.getInventory(clinicId);
  }

  /**
   * Update vaccine inventory
   * PATCH /clinics/:id/inventory
   */
  @Roles(UserRole.ADMIN, UserRole.REGISTRAR, UserRole.DOCTOR)
  @Patch(':id/inventory')
  updateInventory(
    @Param('id') clinicId: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.clinicsService.updateInventory(clinicId, updateInventoryDto);
  }

  /**
   * Get clinic staff
   * GET /clinics/:id/staff
   */
  @Get(':id/staff')
  getStaff(@Param('id') clinicId: string) {
    return this.clinicsService.getStaff(clinicId);
  }

  /**
   * Assign staff to clinic
   * POST /clinics/:id/staff
   */
  @Roles(UserRole.ADMIN)
  @Post(':id/staff')
  @HttpCode(HttpStatus.OK)
  assignStaff(
    @Param('id') clinicId: string,
    @Body() assignStaffDto: AssignStaffDto,
  ) {
    return this.clinicsService.assignStaff(
      clinicId,
      assignStaffDto.userId,
      assignStaffDto.role,
    );
  }

  /**
   * Remove staff from clinic
   * DELETE /clinics/:id/staff/:userId
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id/staff/:userId')
  @HttpCode(HttpStatus.OK)
  removeStaff(
    @Param('id') clinicId: string,
    @Param('userId') userId: string,
    @Query('role') role: 'doctor' | 'nurse' | 'admin',
  ) {
    return this.clinicsService.removeStaff(clinicId, userId, role);
  }
}

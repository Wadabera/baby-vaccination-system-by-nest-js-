import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('health')
@Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.REGISTRAR)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Liveness probe, intentionally public so orchestrators and load balancers
   * can reach it without credentials.
   */
  @Get('check')
  check() {
    return this.healthService.check();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  stats() {
    return this.healthService.stats();
  }

  /** Cohorts due or overdue for a dose, grouped by vaccine name. */
  @Get('due-cohorts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  dueCohorts(@Query('withinDays') withinDays?: string) {
    return this.healthService.dueCohorts(
      withinDays ? Number(withinDays) : undefined,
    );
  }

  /** Mark every pending dose whose due date has passed as overdue. */
  @Get('refresh-overdue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async refreshOverdue() {
    return { updated: await this.healthService.refreshOverdue() };
  }
}

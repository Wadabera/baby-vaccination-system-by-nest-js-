import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { NotificationStatus } from './schemas/notification.schema';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.REGISTRAR, UserRole.DOCTOR)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('due')
  async dueReminders(@Query('withinDays') withinDays?: string) {
    return this.notificationsService.findDueDoses(
      withinDays ? Number(withinDays) : undefined,
    );
  }

  @Get()
  findAll(@Query('status') status?: NotificationStatus) {
    return this.notificationsService.findAll(status);
  }

  @Post('queue-due')
  @HttpCode(HttpStatus.OK)
  async queueDue(@Query('withinDays') withinDays?: string) {
    const queued = await this.notificationsService.queueAllDueReminders(
      withinDays ? Number(withinDays) : undefined,
    );
    return { queued };
  }
}

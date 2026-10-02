import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('immunization-card/:childId')
  @UseGuards(JwtAuthGuard)
  async downloadCard(@Param('childId') childId: string, @Res() res: any) {
    const buffer = await this.reportsService.generateImmunizationCard(childId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=immunization_card_${childId}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}

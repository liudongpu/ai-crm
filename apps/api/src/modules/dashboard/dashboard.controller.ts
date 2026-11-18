import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get('reports')
  reports(@Query('days', new ParseIntPipe({ optional: true })) days?: number) {
    return this.service.reports(days);
  }
}

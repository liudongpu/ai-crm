import { Controller, Get, Query } from '@nestjs/common';
import { ReportsQueryDto } from '../../common/dto/special.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get('reports')
  reports(@Query() query: ReportsQueryDto) {
    return this.service.reports(query?.days ?? 90);
  }
}

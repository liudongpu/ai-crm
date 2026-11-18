import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity, Company, Contact, Deal, Stage } from '../../database/entities';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, Stage, Contact, Company, Activity])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

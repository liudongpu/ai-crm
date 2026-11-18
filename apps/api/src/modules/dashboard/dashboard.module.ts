import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Client,
  Communication,
  Invoice,
  Lead,
  Matter,
  MatterStage,
  Payment,
  Task,
  TimeEntry,
  TrustTransaction,
  User,
} from '../../database/entities';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Matter,
      MatterStage,
      Client,
      Lead,
      Task,
      TimeEntry,
      Invoice,
      Payment,
      TrustTransaction,
      User,
      Communication,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

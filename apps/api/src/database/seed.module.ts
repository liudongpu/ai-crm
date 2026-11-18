import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Client,
  Communication,
  ConflictCheck,
  Contact,
  Document,
  Expense,
  Feature,
  FeatureModule,
  FeatureRecord,
  Invoice,
  Lead,
  Matter,
  MatterStage,
  Note,
  Payment,
  Task,
  TimeEntry,
  TrustTransaction,
  User,
} from './entities';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MatterStage,
      Client,
      Contact,
      Matter,
      Lead,
      ConflictCheck,
      Task,
      Document,
      TimeEntry,
      Expense,
      FeatureModule,
      Feature,
      FeatureRecord,
      Invoice,
      Payment,
      TrustTransaction,
      Communication,
      Note,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}

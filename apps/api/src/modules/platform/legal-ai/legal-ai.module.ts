import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Client,
  Communication,
  Document,
  Invoice,
  Matter,
  MatterParty,
  Note,
  Statute,
  Task,
  TimeEntry,
  User,
} from '../../../database/entities';
import { PermissionsModule } from '../../settings/permissions/permissions.module';
import { LegalAiController } from './legal-ai.controller';
import { LegalAiService } from './legal-ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Matter,
      Document,
      Note,
      MatterParty,
      Task,
      TimeEntry,
      Communication,
      Statute,
      User,
      Client,
      Invoice,
    ]),
    PermissionsModule,
  ],
  controllers: [LegalAiController],
  providers: [LegalAiService],
  exports: [LegalAiService],
})
export class LegalAiModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client, Contact, Lead, Matter, MatterStage } from '../../../database/entities';
import { MattersModule } from '../../cases/matters/matters.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Client, Contact, Matter, MatterStage]), MattersModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}

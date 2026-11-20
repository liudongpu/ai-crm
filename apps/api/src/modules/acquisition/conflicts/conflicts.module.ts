import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client, ConflictCheck, Contact, Lead, Matter } from '../../../database/entities';
import { ConflictsController } from './conflicts.controller';
import { ConflictsService } from './conflicts.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConflictCheck, Client, Contact, Matter, Lead])],
  controllers: [ConflictsController],
  providers: [ConflictsService],
  exports: [ConflictsService],
})
export class ConflictsModule {}

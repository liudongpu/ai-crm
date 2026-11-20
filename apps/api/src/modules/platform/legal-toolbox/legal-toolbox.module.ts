import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourtHoliday, Matter, ToolCalculation } from '../../../database/entities';
import { LegalToolboxController } from './legal-toolbox.controller';
import { LegalToolboxService } from './legal-toolbox.service';

@Module({
  imports: [TypeOrmModule.forFeature([ToolCalculation, CourtHoliday, Matter])],
  controllers: [LegalToolboxController],
  providers: [LegalToolboxService],
  exports: [LegalToolboxService],
})
export class LegalToolboxModule {}

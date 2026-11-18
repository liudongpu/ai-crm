import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Matter, MatterStage } from '../../database/entities';
import { MatterStagesController } from './matter-stages.controller';
import { MattersController } from './matters.controller';
import { MattersService } from './matters.service';

@Module({
  imports: [TypeOrmModule.forFeature([Matter, MatterStage])],
  controllers: [MattersController, MatterStagesController],
  providers: [MattersService],
  exports: [MattersService],
})
export class MattersModule {}

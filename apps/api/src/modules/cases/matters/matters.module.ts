import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Matter, MatterCategory, MatterParty, MatterStage, MatterTeamMember, Task, User } from '../../../database/entities';
import { MatterStagesController } from './matter-stages.controller';
import { MatterTeamController } from './matter-team.controller';
import { MatterTeamService } from './matter-team.service';
import { MattersController } from './matters.controller';
import { MattersService } from './matters.service';

@Module({
  imports: [TypeOrmModule.forFeature([Matter, MatterStage, MatterCategory, MatterParty, MatterTeamMember, Task, User])],
  controllers: [MattersController, MatterStagesController, MatterTeamController],
  providers: [MattersService, MatterTeamService],
  exports: [MattersService, MatterTeamService],
})
export class MattersModule {}

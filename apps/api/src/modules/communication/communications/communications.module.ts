import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client, Communication, Matter, MatterTeamMember, MessageTemplate, Task, User } from '../../../database/entities';
import { PermissionsModule } from '../../settings/permissions/permissions.module';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Communication, MessageTemplate, Client, Matter, MatterTeamMember, Task, User]),
    PermissionsModule,
  ],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}

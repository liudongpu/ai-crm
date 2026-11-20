import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreatePartyDto,
  CreateTeamMemberDto,
  UpdatePartyDto,
  UpdateTeamMemberDto,
} from '../../../common/dto/matter-team.dto';
import { MatterTeamService } from './matter-team.service';

@Controller('matters')
export class MatterTeamController {
  constructor(private readonly service: MatterTeamService) {}

  @Get(':id/parties')
  parties(@Param('id', ParseIntPipe) id: number) {
    return this.service.listParties(id);
  }

  @Post(':id/parties')
  addParty(@Param('id', ParseIntPipe) id: number, @Body() dto: CreatePartyDto) {
    return this.service.addParty(id, dto);
  }

  @Patch('parties/:partyId')
  updateParty(
    @Param('partyId', ParseIntPipe) partyId: number,
    @Body() dto: UpdatePartyDto,
  ) {
    return this.service.updateParty(partyId, dto);
  }

  @Delete('parties/:partyId')
  removeParty(@Param('partyId', ParseIntPipe) partyId: number) {
    return this.service.removeParty(partyId);
  }

  @Get(':id/team')
  team(@Param('id', ParseIntPipe) id: number) {
    return this.service.team(id);
  }

  @Post(':id/team')
  addMember(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateTeamMemberDto) {
    return this.service.addMember(id, dto);
  }

  @Patch('team/:memberId')
  updateMember(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.service.updateMember(memberId, dto);
  }

  @Delete('team/:memberId')
  removeMember(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.service.removeMember(memberId);
  }
}

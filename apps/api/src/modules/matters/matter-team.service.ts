import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreatePartyDto,
  CreateTeamMemberDto,
  UpdatePartyDto,
  UpdateTeamMemberDto,
} from '../../common/dto/matter-team.dto';
import { MatterParty, MatterTeamMember, User } from '../../database/entities';

@Injectable()
export class MatterTeamService {
  constructor(
    @InjectRepository(MatterParty) private readonly parties: Repository<MatterParty>,
    @InjectRepository(MatterTeamMember) private readonly members: Repository<MatterTeamMember>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  listParties(matterId: number) {
    return this.parties.find({ where: { matterId }, order: { id: 'ASC' } });
  }

  async addParty(matterId: number, dto: CreatePartyDto) {
    return this.parties.save(this.parties.create({ ...dto, matterId }));
  }

  async updateParty(partyId: number, dto: UpdatePartyDto) {
    const party = await this.parties.findOne({ where: { id: partyId } });
    if (!party) throw new NotFoundException(`当事人 ${partyId} 不存在`);
    Object.assign(party, dto);
    return this.parties.save(party);
  }

  async removeParty(partyId: number) {
    const party = await this.parties.findOne({ where: { id: partyId } });
    if (!party) throw new NotFoundException(`当事人 ${partyId} 不存在`);
    await this.parties.remove(party);
    return { id: partyId };
  }

  async team(matterId: number) {
    const members = await this.members.find({ where: { matterId }, order: { id: 'ASC' } });
    const users = await this.users.find();
    const userMap = new Map(users.map((user) => [user.id, user]));
    return members.map((member) => ({
      ...member,
      userName: userMap.get(member.userId)?.name ?? `人员 #${member.userId}`,
      userRole: userMap.get(member.userId)?.role ?? null,
      title: userMap.get(member.userId)?.title ?? null,
    }));
  }

  async addMember(matterId: number, dto: CreateTeamMemberDto) {
    const existing = await this.members.findOne({ where: { matterId, userId: dto.userId } });
    if (existing) {
      Object.assign(existing, dto);
      return this.members.save(existing);
    }
    // 一个案件只允许一名主办：新增主办时自动将原主办降级为协办。
    if (dto.role === 'lead') {
      const leads = await this.members.find({ where: { matterId, role: 'lead' } });
      for (const lead of leads) {
        lead.role = 'associate';
        await this.members.save(lead);
      }
    }
    return this.members.save(
      this.members.create({
        matterId,
        userId: dto.userId,
        role: dto.role,
        canViewInternal: dto.canViewInternal ?? true,
      }),
    );
  }

  async updateMember(memberId: number, dto: UpdateTeamMemberDto) {
    const member = await this.members.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException(`团队成员 ${memberId} 不存在`);
    if (dto.role === 'lead' && member.role !== 'lead') {
      const leads = await this.members.find({ where: { matterId: member.matterId, role: 'lead' } });
      for (const lead of leads) {
        lead.role = 'associate';
        await this.members.save(lead);
      }
    }
    Object.assign(member, dto);
    return this.members.save(member);
  }

  async removeMember(memberId: number) {
    const member = await this.members.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException(`团队成员 ${memberId} 不存在`);
    await this.members.remove(member);
    return { id: memberId };
  }
}

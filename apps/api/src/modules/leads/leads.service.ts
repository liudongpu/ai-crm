import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { ConvertLeadDto } from '../../common/dto/special.dto';
import { Client, Contact, Lead, Matter, MatterStage } from '../../database/entities';

@Injectable()
export class LeadsService extends CrudService<Lead> {
  constructor(
    @InjectRepository(Lead) repo: Repository<Lead>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
    @InjectRepository(Matter) private readonly matters: Repository<Matter>,
    @InjectRepository(MatterStage) private readonly stages: Repository<MatterStage>,
  ) {
    super(repo);
  }

  async convert(id: number, dto: ConvertLeadDto) {
    const lead = await this.findOne(id);
    const stage = await this.stages.findOne({ where: {}, order: { position: 'ASC' } });
    if (!stage) throw new NotFoundException('案件阶段尚未初始化');

    const practiceArea = dto.practiceArea ?? lead.practiceArea ?? '综合法律';
    const client = await this.clients.save(
      this.clients.create({
        name: dto.clientName ?? lead.company ?? lead.name,
        type: lead.company ? 'company' : 'individual',
        contactName: lead.name,
        email: lead.email ?? undefined,
        phone: lead.phone ?? undefined,
        industry: undefined,
        status: 'active',
        ownerId: lead.ownerId ?? undefined,
        notes: lead.description ?? undefined,
      }),
    );

    const contact = await this.contacts.save(
      this.contacts.create({
        name: lead.name,
        clientId: client.id,
        email: lead.email ?? undefined,
        phone: lead.phone ?? undefined,
        isPrimary: true,
        notes: lead.description ?? undefined,
      }),
    );

    const matter = await this.matters.save(
      this.matters.create({
        title: dto.title ?? `${client.name} · ${practiceArea}`,
        caseNumber: undefined,
        clientId: client.id,
        stageId: stage.id,
        practiceArea,
        status: 'open',
        priority: lead.rating === 'hot' ? 'high' : 'medium',
        ownerId: lead.ownerId ?? undefined,
        description: lead.description ?? undefined,
        openDate: new Date(),
        closeDate: undefined,
        value: dto.value ?? 0,
        position: 0,
      }),
    );

    lead.status = 'converted';
    lead.convertedAt = new Date();
    lead.convertedClientId = client.id;
    lead.convertedContactId = contact.id;
    lead.convertedMatterId = matter.id;
    if (lead.conflictChecked && !lead.conflictResult) lead.conflictResult = 'clear';
    await this.repo.save(lead);

    return { lead, client, contact, matter };
  }
}

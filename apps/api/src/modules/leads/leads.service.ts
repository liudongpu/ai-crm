import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLeadDto, UpdateLeadDto } from '../../common/dto/create-lead.dto';
import { Company, Contact, Deal, Lead, Pipeline, Stage } from '../../database/entities';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
    @InjectRepository(Deal) private readonly deals: Repository<Deal>,
    @InjectRepository(Stage) private readonly stages: Repository<Stage>,
    @InjectRepository(Pipeline) private readonly pipelines: Repository<Pipeline>,
  ) {}

  async findAll(params: { status?: string; search?: string } = {}) {
    const qb = this.leads.createQueryBuilder('lead');

    if (params.status) {
      qb.andWhere('lead.status = :status', { status: params.status });
    }
    if (params.search) {
      qb.andWhere(
        '(lead.name LIKE :search OR lead.company LIKE :search OR lead.email LIKE :search OR lead.phone LIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    return qb.orderBy('lead.createdAt', 'DESC').getMany();
  }

  async findOne(id: number) {
    const lead = await this.leads.findOne({ where: { id } });
    if (!lead) throw new NotFoundException(`潜在客户 ${id} 不存在`);
    return lead;
  }

  create(dto: CreateLeadDto) {
    return this.leads.save(this.leads.create(dto));
  }

  async update(id: number, dto: UpdateLeadDto) {
    const lead = await this.findOne(id);
    Object.assign(lead, dto);
    return this.leads.save(lead);
  }

  async remove(id: number) {
    const lead = await this.findOne(id);
    await this.leads.remove(lead);
    return { id };
  }

  async convert(id: number) {
    const lead = await this.findOne(id);
    if (lead.status === 'converted' || lead.convertedAt) {
      throw new BadRequestException('该潜在客户已转换');
    }

    const pipeline = await this.pipelines.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });
    if (!pipeline) throw new NotFoundException('请先创建销售流程');

    const stage = await this.stages.findOne({
      where: { pipelineId: pipeline.id },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
    if (!stage) throw new NotFoundException('销售流程尚未配置阶段');

    const company = await this.companies.save(
      this.companies.create({ name: lead.company }),
    );
    const contact = await this.contacts.save(
      this.contacts.create({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        position: lead.title,
        owner: lead.owner,
        companyId: company.id,
      }),
    );

    const description = lead.description?.trim();
    const title =
      description && description.length <= 60 ? description : `${lead.company} - 新商机`;

    const deal = await this.deals.save(
      this.deals.create({
        title,
        value: 0,
        priority: lead.rating === 'hot' ? 'high' : 'medium',
        source: lead.source,
        pipelineId: pipeline.id,
        stageId: stage.id,
        position: await this.deals.count({ where: { stageId: stage.id } }),
        companyId: company.id,
        contactId: contact.id,
      }),
    );

    lead.status = 'converted';
    lead.convertedAt = new Date();
    lead.convertedContactId = contact.id;
    lead.convertedDealId = deal.id;
    const convertedLead = await this.leads.save(lead);

    return { lead: convertedLead, company, contact, deal };
  }
}

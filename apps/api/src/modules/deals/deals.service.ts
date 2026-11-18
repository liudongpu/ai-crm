import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDealDto, MoveDealDto, UpdateDealDto } from '../../common/dto/create-deal.dto';
import { Deal, Pipeline, Stage } from '../../database/entities';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal) private readonly deals: Repository<Deal>,
    @InjectRepository(Stage) private readonly stages: Repository<Stage>,
    @InjectRepository(Pipeline) private readonly pipelines: Repository<Pipeline>,
  ) {}

  async findAll(params: { pipelineId?: number; stageId?: number; search?: string } = {}) {
    const qb = this.deals
      .createQueryBuilder('deal')
      .leftJoinAndSelect('deal.stage', 'stage')
      .leftJoinAndSelect('deal.pipeline', 'pipeline')
      .leftJoinAndSelect('deal.contact', 'contact')
      .leftJoinAndSelect('deal.company', 'company')
      .addOrderBy('stage.position', 'ASC')
      .addOrderBy('deal.position', 'ASC')
      .addOrderBy('deal.createdAt', 'DESC');

    if (params.pipelineId) {
      qb.andWhere('deal.pipelineId = :pipelineId', { pipelineId: params.pipelineId });
    }
    if (params.stageId) {
      qb.andWhere('deal.stageId = :stageId', { stageId: params.stageId });
    }
    if (params.search) {
      qb.andWhere(
        '(deal.title LIKE :search OR company.name LIKE :search OR contact.name LIKE :search)',
        { search: `%${params.search}%` },
      );
    }
    return qb.getMany();
  }

  async findOne(id: number) {
    const deal = await this.deals.findOne({
      where: { id },
      relations: { stage: true, pipeline: true, contact: true, company: true },
    });
    if (!deal) throw new NotFoundException(`交易 ${id} 不存在`);
    return deal;
  }

  async create(dto: CreateDealDto) {
    const pipelineId = dto.pipelineId ?? (await this.defaultPipelineId());
    const stageId =
      dto.stageId ??
      (await this.stages.findOne({ where: { pipelineId }, order: { position: 'ASC' } }))?.id;
    if (!stageId) throw new NotFoundException('销售流程尚未配置阶段');

    const stage = await this.stages.findOneBy({ id: stageId });
    const count = await this.deals.count({ where: { stageId } });
    const deal = this.deals.create({
      ...dto,
      pipelineId,
      stageId,
      position: count,
      status: dto.status ?? this.statusForStage(stage),
    });
    return this.deals.save(deal);
  }

  async update(id: number, dto: UpdateDealDto) {
    const deal = await this.findOne(id);
    if (dto.stageId && dto.stageId !== deal.stageId) {
      const stage = await this.stages.findOneBy({ id: dto.stageId });
      if (!stage) throw new NotFoundException(`阶段 ${dto.stageId} 不存在`);
      deal.pipelineId = stage.pipelineId;
      deal.stage = stage;
      if (!dto.status) deal.status = this.statusForStage(stage);
    }
    Object.assign(deal, dto);
    return this.deals.save(deal);
  }

  async move(id: number, dto: MoveDealDto) {
    const deal = await this.findOne(id);
    const stage = await this.stages.findOneBy({ id: dto.stageId });
    if (!stage) throw new NotFoundException(`阶段 ${dto.stageId} 不存在`);

    deal.stageId = stage.id;
    deal.stage = stage;
    deal.pipelineId = stage.pipelineId;
    deal.position = dto.position ?? (await this.deals.count({ where: { stageId: stage.id } }));
    deal.status = this.statusForStage(stage);
    await this.deals.save(deal);
    return this.findOne(id);
  }

  async remove(id: number) {
    const deal = await this.findOne(id);
    await this.deals.remove(deal);
    return { id };
  }

  private statusForStage(stage: Stage | null): 'open' | 'won' | 'lost' {
    if (!stage) return 'open';
    if (stage.probability >= 100 || stage.name.includes('赢') || stage.name.includes('成交')) return 'won';
    if (stage.name.includes('输') || stage.name.includes('丢单')) return 'lost';
    return 'open';
  }

  private async defaultPipelineId() {
    const pipeline = await this.pipelines.findOne({ where: {}, order: { createdAt: 'ASC' } });
    if (!pipeline) throw new NotFoundException('请先创建销售流程');
    return pipeline.id;
  }
}

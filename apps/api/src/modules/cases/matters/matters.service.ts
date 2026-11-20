import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../../common/crud.service';
import { MatterQueryDto, UpdateMatterStageDto } from '../../../common/dto/special.dto';
import { Matter, MatterStage } from '../../../database/entities';

@Injectable()
export class MattersService extends CrudService<Matter> {
  constructor(
    @InjectRepository(Matter) repo: Repository<Matter>,
    @InjectRepository(MatterStage) private readonly stages: Repository<MatterStage>,
  ) {
    super(repo);
  }

  async findAll(query: MatterQueryDto = {}) {
    const qb = this.repo
      .createQueryBuilder('matter')
      .leftJoinAndSelect('matter.client', 'client')
      .leftJoinAndSelect('matter.stage', 'stage')
      .leftJoinAndSelect('matter.owner', 'owner');

    if (query.stageId !== undefined) {
      qb.andWhere('matter.stageId = :stageId', { stageId: query.stageId });
    }
    if (query.status !== undefined) {
      qb.andWhere('matter.status = :status', { status: query.status });
    }
    if (query.ownerId !== undefined) {
      qb.andWhere('matter.ownerId = :ownerId', { ownerId: query.ownerId });
    }
    if (query.search) {
      qb.andWhere(
        '(matter.title LIKE :q OR matter.caseNumber LIKE :q OR client.name LIKE :q OR matter.practiceArea LIKE :q)',
        { q: `%${query.search}%` },
      );
    }

    return qb.orderBy('matter.position', 'ASC').addOrderBy('matter.createdAt', 'DESC').getMany();
  }

  async findOne(id: number) {
    const matter = await this.repo.findOne({
      where: { id },
      relations: { client: true, stage: true, owner: true },
    });
    if (!matter) throw new NotFoundException(`案件 ${id} 不存在`);
    return matter;
  }

  listStages() {
    return this.stages.find({ order: { position: 'ASC' } });
  }

  async setStage(id: number, dto: UpdateMatterStageDto) {
    // findOne 会加载 stage 关联；若直接改 stageId 再 save，TypeORM 会按旧的关联对象
    // 重新写回外键，导致移动阶段不生效。这里先用 update 直接改列，再返回完整实体。
    await this.findOne(id); // 保持不存在时抛 404 的行为
    await this.repo.update({ id }, {
      stageId: dto.stageId,
      ...(dto.position !== undefined ? { position: dto.position } : {}),
    });
    return this.findOne(id);
  }
}

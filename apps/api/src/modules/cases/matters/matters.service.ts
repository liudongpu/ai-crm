import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { addDays } from '../../../common/calendar-rules.util';
import { CrudService } from '../../../common/crud.service';
import { MatterQueryDto, UpdateMatterStageDto } from '../../../common/dto/special.dto';
import { Matter, MatterCategory, MatterStage, Task } from '../../../database/entities';

@Injectable()
export class MattersService extends CrudService<Matter> {
  constructor(
    @InjectRepository(Matter) repo: Repository<Matter>,
    @InjectRepository(MatterStage) private readonly stages: Repository<MatterStage>,
    @InjectRepository(MatterCategory) private readonly categories: Repository<MatterCategory>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
  ) {
    super(repo);
  }

  async create(dto: DeepPartial<Matter>): Promise<Matter> {
    const matter = await super.create(dto);
    await this.applyTypeTemplate(matter);
    return matter;
  }

  /** 新案件按业务领域匹配启用的案件类型，将首个阶段的任务实例化为案件任务。 */
  private async applyTypeTemplate(matter: Matter) {
    const category = await this.categories.findOne({ where: { name: matter.practiceArea, enabled: true } });
    const firstStage = category?.stages?.[0];
    if (!category || !firstStage?.tasks?.length) return;

    const openDate = matter.openDate ? new Date(matter.openDate) : new Date();
    const tasks = firstStage.tasks.map((task) =>
      this.tasks.create({
        title: task.name,
        type: 'task',
        description: `案件类型「${category.name}」阶段「${firstStage.name}」模板生成${task.skippable ? '（可跳过）' : ''}`,
        dueDate: addDays(openDate, Math.max(0, Number(task.dueDay) || 0)),
        priority: 'medium',
        done: false,
        matterId: matter.id,
        assigneeId: matter.ownerId ?? null,
        calendarId: 'firm',
        visibility: 'team',
        allDay: true,
        reminderMinutes: 1440,
        sourceType: 'matter_type_template',
        sourceId: category.id,
        sourceDetail: firstStage.name,
      }),
    );
    await this.tasks.save(tasks);
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

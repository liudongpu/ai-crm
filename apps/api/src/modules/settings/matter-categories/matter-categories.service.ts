import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CrudService } from '../../../common/crud.service';
import { MatterCategory, MatterCategoryStage } from '../../../database/entities';

/** 兼容升级前的流程数据：补齐停留时长与阶段任务字段。 */
function normalizeStages(stages?: DeepPartial<MatterCategoryStage>[] | null): MatterCategoryStage[] | undefined {
  if (!stages) return undefined;
  return stages.map((stage) => ({
    name: stage.name ?? '未命名阶段',
    probability: stage.probability ?? 0,
    isFinal: Boolean(stage.isFinal),
    durationDays: typeof stage.durationDays === 'number' && Number.isFinite(stage.durationDays) ? stage.durationDays : 7,
    tasks: (stage.tasks ?? []).map((task) => ({
      name: task?.name ?? '未命名任务',
      dueDay: typeof task?.dueDay === 'number' && Number.isFinite(task.dueDay) ? task.dueDay : 0,
      skippable: Boolean(task?.skippable),
    })),
  }));
}

function stripLegacyColor(category: MatterCategory): MatterCategory {
  return { ...category, stages: normalizeStages(category.stages) ?? [] };
}

@Injectable()
export class MatterCategoriesService extends CrudService<MatterCategory> {
  constructor(@InjectRepository(MatterCategory) repo: Repository<MatterCategory>) {
    super(repo);
  }

  async findAll(): Promise<MatterCategory[]> {
    const categories = await this.repo.find({ order: { position: 'ASC', id: 'ASC' } });
    return categories.map(stripLegacyColor);
  }

  /** 旧库阶段 JSON 仍带已移除的 color 字段，读取时统一剔除。 */
  async findOne(id: number): Promise<MatterCategory> {
    return stripLegacyColor(await super.findOne(id));
  }

  async create(dto: DeepPartial<MatterCategory>): Promise<MatterCategory> {
    const position = dto.position ?? (await this.repo.count());
    const stages = normalizeStages(dto.stages);
    return this.repo.save(this.repo.create({ ...dto, ...(stages ? { stages } : {}), position }));
  }

  async update(id: number, dto: DeepPartial<MatterCategory>): Promise<MatterCategory> {
    const stages = normalizeStages(dto.stages);
    return super.update(id, stages ? { ...dto, stages } : dto);
  }
}

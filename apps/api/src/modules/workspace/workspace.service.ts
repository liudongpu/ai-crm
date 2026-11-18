import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateWorkspaceItemDto,
  UpdateWorkspaceItemDto,
  WorkspaceItemQueryDto,
  WorkspaceSettingQueryDto,
  WorkspaceStatsQueryDto,
} from '../../common/dto/workspace.dto';
import { WorkspaceItem, WorkspaceSetting } from '../../database/entities';
import { getWorkspaceDefinition, WORKSPACE_DEFINITIONS } from './workspace-definitions';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(WorkspaceItem) private readonly items: Repository<WorkspaceItem>,
    @InjectRepository(WorkspaceSetting) private readonly settings: Repository<WorkspaceSetting>,
  ) {}

  definitions() {
    return WORKSPACE_DEFINITIONS;
  }

  definition(code: string) {
    const definition = getWorkspaceDefinition(code);
    if (!definition) throw new NotFoundException(`功能工作台定义 ${code} 不存在`);
    return definition;
  }

  findItems(query: WorkspaceItemQueryDto = {}) {
    const qb = this.items.createQueryBuilder('item');
    if (query.featureCode) {
      qb.andWhere('item.featureCode = :featureCode', { featureCode: query.featureCode });
    }
    if (query.status) {
      qb.andWhere('item.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere('(item.title LIKE :search OR item.summary LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    return qb.orderBy('item.createdAt', 'DESC').addOrderBy('item.id', 'DESC').getMany();
  }

  async findItem(id: number): Promise<WorkspaceItem> {
    const item = await this.items.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`工作台记录 ${id} 不存在`);
    return item;
  }

  createItem(dto: CreateWorkspaceItemDto): Promise<WorkspaceItem> {
    return this.items.save(this.items.create(dto));
  }

  async updateItem(id: number, dto: UpdateWorkspaceItemDto): Promise<WorkspaceItem> {
    const item = await this.findItem(id);
    const changes = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    Object.assign(item, changes);
    return this.items.save(item);
  }

  async removeItem(id: number): Promise<{ id: number }> {
    const item = await this.findItem(id);
    await this.items.remove(item);
    return { id };
  }

  async stats(query: WorkspaceStatsQueryDto = {}) {
    const qb = this.items.createQueryBuilder('item');
    if (query.featureCode) {
      qb.andWhere('item.featureCode = :featureCode', { featureCode: query.featureCode });
    }
    const rows = await qb
      .select('item.status', 'status')
      .addSelect('COUNT(item.id)', 'count')
      .groupBy('item.status')
      .getRawMany<{ status: string; count: string }>();

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const count = Number(row.count);
      total += count;
      byStatus[row.status] = count;
    }
    return { total, byStatus };
  }

  /** 合并功能定义默认值与本地已保存的配置，返回当前生效配置。 */
  async getSettings(query: WorkspaceSettingQueryDto = {}) {
    const definition = query.featureCode ? getWorkspaceDefinition(query.featureCode) : undefined;
    if (query.featureCode && !definition) {
      throw new NotFoundException(`功能工作台定义 ${query.featureCode} 不存在`);
    }

    if (!definition) {
      return this.settings.find({ order: { featureCode: 'ASC', key: 'ASC' } });
    }

    const stored = await this.settings.find({
      where: { featureCode: definition.code },
      order: { key: 'ASC' },
    });
    const storedMap = new Map(stored.map((setting) => [setting.key, setting]));
    return definition.settings.map((setting) => {
      const found = storedMap.get(setting.key);
      return {
        id: found?.id ?? 0,
        featureCode: definition.code,
        key: setting.key,
        value: found?.value ?? setting.defaultValue,
        label: setting.label,
        type: setting.type,
        options: setting.options,
        description: setting.description,
        updatedAt: found?.updatedAt ?? null,
      };
    });
  }

  /** 批量 upsert 本地配置（演示配置，仅影响当前演示库）。 */
  async updateSettings(featureCode: string, values: Array<{ key: string; value: string }>) {
    this.definition(featureCode);
    for (const { key, value } of values) {
      const existing = await this.settings.findOne({ where: { featureCode, key } });
      if (existing) {
        existing.value = value;
        await this.settings.save(existing);
      } else {
        await this.settings.save(this.settings.create({ featureCode, key, value }));
      }
    }
    return this.getSettings({ featureCode });
  }
}

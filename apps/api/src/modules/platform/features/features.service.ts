import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateFeatureRecordDto,
  FeatureQueryDto,
  FeatureRecordQueryDto,
  FeatureStatsQueryDto,
  UpdateFeatureRecordDto,
} from '../../../common/dto/feature.dto';
import { Feature, FeatureModule, FeatureRecord, FeatureRecordStatus } from '../../../database/entities';

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(FeatureModule) private readonly modules: Repository<FeatureModule>,
    @InjectRepository(Feature) private readonly features: Repository<Feature>,
    @InjectRepository(FeatureRecord) private readonly records: Repository<FeatureRecord>,
  ) {}

  async catalog() {
    const [modules, features] = await Promise.all([
      this.modules.find({ order: { position: 'ASC', id: 'ASC' } }),
      this.features.find({ order: { position: 'ASC', id: 'ASC' } }),
    ]);

    return modules.map((module) => ({
      ...module,
      features: features.filter((feature) => feature.moduleId === module.id),
    }));
  }

  findAll(query: FeatureQueryDto = {}) {
    const qb = this.features.createQueryBuilder('feature');
    if (query.moduleCode) {
      qb.innerJoin('feature.module', 'module').andWhere('module.code = :moduleCode', {
        moduleCode: query.moduleCode,
      });
    }
    return qb
      .orderBy('feature.position', 'ASC')
      .addOrderBy('feature.id', 'ASC')
      .getMany();
  }

  findRecords(query: FeatureRecordQueryDto = {}) {
    const qb = this.records.createQueryBuilder('record');
    if (query.featureCode) {
      qb.andWhere('record.featureCode = :featureCode', { featureCode: query.featureCode });
    }
    if (query.status) {
      qb.andWhere('record.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere('(record.title LIKE :search OR record.description LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    return qb.orderBy('record.createdAt', 'DESC').addOrderBy('record.id', 'DESC').getMany();
  }

  async findRecord(id: number): Promise<FeatureRecord> {
    const record = await this.records.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`功能记录 ${id} 不存在`);
    return record;
  }

  createRecord(dto: CreateFeatureRecordDto): Promise<FeatureRecord> {
    return this.records.save(this.records.create(dto));
  }

  async updateRecord(id: number, dto: UpdateFeatureRecordDto): Promise<FeatureRecord> {
    const record = await this.findRecord(id);
    const changes = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    Object.assign(record, changes);
    return this.records.save(record);
  }

  async removeRecord(id: number): Promise<{ id: number }> {
    const record = await this.findRecord(id);
    await this.records.remove(record);
    return { id };
  }

  async stats(query: FeatureStatsQueryDto = {}) {
    const qb = this.records.createQueryBuilder('record');
    if (query.featureCode) {
      qb.andWhere('record.featureCode = :featureCode', { featureCode: query.featureCode });
    }

    const rows = await qb
      .select('record.status', 'status')
      .addSelect('COUNT(record.id)', 'count')
      .groupBy('record.status')
      .getRawMany<{ status: FeatureRecordStatus; count: string }>();

    const byStatus: Record<FeatureRecordStatus, number> = {
      draft: 0,
      active: 0,
      pending: 0,
      completed: 0,
      archived: 0,
    };
    let total = 0;
    for (const row of rows) {
      const count = Number(row.count);
      total += count;
      if (row.status in byStatus) byStatus[row.status] = count;
    }

    return { total, byStatus };
  }
}

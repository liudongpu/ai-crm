import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import {
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
} from '../../common/dto/create-time-entry.dto';
import { TimeEntryQueryDto } from '../../common/dto/special.dto';
import { TimeEntry } from '../../database/entities';

@Injectable()
export class TimeEntriesService extends CrudService<TimeEntry> {
  constructor(@InjectRepository(TimeEntry) repo: Repository<TimeEntry>) {
    super(repo);
  }

  async findAll(query: TimeEntryQueryDto = {}) {
    const qb = this.repo.createQueryBuilder('entry');

    if (query.matterId !== undefined) {
      qb.andWhere('entry.matterId = :matterId', { matterId: query.matterId });
    }
    if (query.invoiced !== undefined) {
      qb.andWhere('entry.invoiced = :invoiced', { invoiced: query.invoiced });
    }
    if (query.userId !== undefined) {
      qb.andWhere('entry.userId = :userId', { userId: query.userId });
    }

    return qb.orderBy('entry.date', 'DESC').addOrderBy('entry.createdAt', 'DESC').getMany();
  }

  create(dto: CreateTimeEntryDto) {
    const amount = dto.amount ?? dto.hours * (dto.rate ?? 800);
    return this.repo.save(this.repo.create({ ...dto, amount }));
  }

  async update(id: number, dto: UpdateTimeEntryDto) {
    const entry = await this.findOne(id);
    Object.assign(entry, dto);
    if (dto.amount === undefined && (dto.hours !== undefined || dto.rate !== undefined)) {
      entry.amount = entry.hours * entry.rate;
    }
    return this.repo.save(entry);
  }
}

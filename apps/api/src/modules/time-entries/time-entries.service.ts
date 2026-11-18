import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
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

  /** 当前正在计时的条目（同一时间只允许一个计时器）。 */
  async running() {
    return this.repo.findOne({
      where: { timerStartedAt: Not(IsNull()) },
      order: { timerStartedAt: 'DESC' },
    });
  }

  /** 开始计时：新建一条 hours=0 的记录。若已有计时器，自动先停止。 */
  async startTimer(dto: CreateTimeEntryDto) {
    const active = await this.running();
    if (active) await this.stopTimer(active.id);
    const amount = dto.amount ?? 0;
    return this.repo.save(
      this.repo.create({
        ...dto,
        hours: 0,
        amount,
        timerStartedAt: new Date(),
      }),
    );
  }

  /** 停止计时：累加实际经过的小时数并清零计时器。 */
  async stopTimer(id: number) {
    const entry = await this.findOne(id);
    if (!entry.timerStartedAt) return entry;
    const elapsedMs = Math.max(0, Date.now() - new Date(entry.timerStartedAt).getTime());
    const elapsedHours = Math.round((elapsedMs / 3_600_000) * 100) / 100;
    entry.hours = Math.round((entry.hours + elapsedHours) * 100) / 100;
    entry.amount = Math.round(entry.hours * entry.rate * 100) / 100;
    entry.timerStartedAt = null;
    return this.repo.save(entry);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActivityDto, UpdateActivityDto } from '../../common/dto/create-activity.dto';
import { Activity } from '../../database/entities';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
  ) {}

  async findAll(params: { done?: boolean; limit?: number } = {}) {
    const qb = this.activities
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.deal', 'deal')
      .leftJoinAndSelect('activity.contact', 'contact')
      .addOrderBy('activity.done', 'ASC')
      .addOrderBy('activity.dueDate', 'ASC');

    if (params.done !== undefined) {
      qb.andWhere('activity.done = :done', { done: params.done });
    }
    if (params.limit) qb.take(params.limit);
    return qb.getMany();
  }

  async findOne(id: number) {
    const activity = await this.activities.findOne({
      where: { id },
      relations: { deal: true, contact: true },
    });
    if (!activity) throw new NotFoundException(`活动 ${id} 不存在`);
    return activity;
  }

  async create(dto: CreateActivityDto) {
    const activity = this.activities.create({
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });
    return this.activities.save(activity);
  }

  async update(id: number, dto: UpdateActivityDto) {
    const activity = await this.findOne(id);
    Object.assign(activity, dto);
    if (dto.dueDate !== undefined) {
      activity.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    return this.activities.save(activity);
  }

  async remove(id: number) {
    const activity = await this.findOne(id);
    await this.activities.remove(activity);
    return { id };
  }
}

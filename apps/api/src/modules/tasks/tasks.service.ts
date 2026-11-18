import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { TaskQueryDto } from '../../common/dto/special.dto';
import { Task } from '../../database/entities';

@Injectable()
export class TasksService extends CrudService<Task> {
  constructor(@InjectRepository(Task) repo: Repository<Task>) {
    super(repo);
  }

  async findAll(query: TaskQueryDto = {}) {
    const qb = this.repo.createQueryBuilder('task');

    if (query.matterId !== undefined) {
      qb.andWhere('task.matterId = :matterId', { matterId: query.matterId });
    }
    if (query.done !== undefined) {
      qb.andWhere('task.done = :done', { done: query.done });
    }
    if (query.type !== undefined) {
      qb.andWhere('task.type = :type', { type: query.type });
    }
    if (query.dueBefore !== undefined) {
      qb.andWhere('task.dueDate <= :dueBefore', { dueBefore: query.dueBefore });
    }

    return qb.orderBy('task.dueDate', 'ASC').addOrderBy('task.createdAt', 'DESC').getMany();
  }

  async toggle(id: number) {
    const task = await this.findOne(id);
    task.done = !task.done;
    task.completedAt = task.done ? new Date() : null;
    return this.repo.save(task);
  }
}

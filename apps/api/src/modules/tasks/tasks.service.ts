import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { TaskQueryDto } from '../../common/dto/special.dto';
import { Task, TaskTemplate } from '../../database/entities';

@Injectable()
export class TasksService extends CrudService<Task> {
  constructor(
    @InjectRepository(Task) repo: Repository<Task>,
    @InjectRepository(TaskTemplate) private readonly templateRepo: Repository<TaskTemplate>,
  ) {
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

  /* ----------------------------- 任务模板 ----------------------------- */

  templates() {
    return this.templateRepo.find({ order: { id: 'ASC' } });
  }

  createTemplate(data: Partial<TaskTemplate>) {
    return this.templateRepo.save(this.templateRepo.create(data));
  }

  async updateTemplate(id: number, data: Partial<TaskTemplate>) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`任务模板 ${id} 不存在`);
    Object.assign(template, data);
    return this.templateRepo.save(template);
  }

  async removeTemplate(id: number) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`任务模板 ${id} 不存在`);
    await this.templateRepo.remove(template);
    return { id };
  }

  /** 从模板生成任务；可覆盖案件、负责人、截止日期。 */
  async createFromTemplate(id: number, overrides: { matterId?: number; assigneeId?: number; dueDate?: Date } = {}) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`任务模板 ${id} 不存在`);
    let dueDate = overrides.dueDate ?? null;
    if (!dueDate && template.dueInDays !== null) {
      dueDate = new Date(Date.now() + template.dueInDays * 24 * 60 * 60 * 1000);
    }
    return this.repo.save(
      this.repo.create({
        title: template.title,
        type: template.type,
        priority: template.priority,
        description: template.description,
        dueDate,
        matterId: overrides.matterId ?? null,
        assigneeId: overrides.assigneeId ?? null,
        done: false,
      }),
    );
  }
}

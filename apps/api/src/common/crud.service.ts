import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';

export abstract class CrudService<T extends { id: number; createdAt: Date }> {
  constructor(protected readonly repo: Repository<T>) {}

  findAll(): Promise<T[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } as FindOptionsOrder<T> });
  }

  async findOne(id: number): Promise<T> {
    const entity = await this.repo.findOne({ where: { id } as FindOptionsWhere<T> });
    if (!entity) throw new NotFoundException(`记录 ${id} 不存在`);
    return entity;
  }

  create(dto: DeepPartial<T>): Promise<T> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: DeepPartial<T>): Promise<T> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: number): Promise<{ id: number }> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { id };
  }
}

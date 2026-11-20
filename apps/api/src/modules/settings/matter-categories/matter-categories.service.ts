import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CrudService } from '../../../common/crud.service';
import { MatterCategory } from '../../../database/entities';

@Injectable()
export class MatterCategoriesService extends CrudService<MatterCategory> {
  constructor(@InjectRepository(MatterCategory) repo: Repository<MatterCategory>) {
    super(repo);
  }

  findAll(): Promise<MatterCategory[]> {
    return this.repo.find({ order: { position: 'ASC', id: 'ASC' } });
  }

  async create(dto: DeepPartial<MatterCategory>): Promise<MatterCategory> {
    const position = dto.position ?? (await this.repo.count());
    return this.repo.save(this.repo.create({ ...dto, position }));
  }
}

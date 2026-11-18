import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pipeline } from '../../database/entities';

@Injectable()
export class PipelinesService {
  constructor(
    @InjectRepository(Pipeline) private readonly pipelines: Repository<Pipeline>,
  ) {}

  findAll() {
    return this.pipelines.find({
      relations: { stages: true },
      order: { createdAt: 'ASC', stages: { position: 'ASC' } },
    });
  }

  async findOne(id: number) {
    const pipeline = await this.pipelines.findOne({
      where: { id },
      relations: { stages: true },
      order: { stages: { position: 'ASC' } },
    });
    if (!pipeline) throw new NotFoundException(`销售流程 ${id} 不存在`);
    return pipeline;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../../common/crud.service';
import { Client } from '../../../database/entities';

@Injectable()
export class ClientsService extends CrudService<Client> {
  constructor(@InjectRepository(Client) repo: Repository<Client>) {
    super(repo);
  }

  findAll() {
    return this.repo.find({ relations: { owner: true }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const client = await this.repo.findOne({ where: { id }, relations: { owner: true } });
    if (!client) throw new NotFoundException(`客户 ${id} 不存在`);
    return client;
  }
}

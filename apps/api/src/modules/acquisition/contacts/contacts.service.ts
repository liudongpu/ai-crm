import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../../common/crud.service';
import { Contact } from '../../../database/entities';

@Injectable()
export class ContactsService extends CrudService<Contact> {
  constructor(@InjectRepository(Contact) repo: Repository<Contact>) {
    super(repo);
  }

  findAll() {
    return this.repo.find({ relations: { client: true }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const contact = await this.repo.findOne({ where: { id }, relations: { client: true } });
    if (!contact) throw new NotFoundException(`联系人 ${id} 不存在`);
    return contact;
  }
}

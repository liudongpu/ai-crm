import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContactDto, UpdateContactDto } from '../../common/dto/create-contact.dto';
import { Contact } from '../../database/entities';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
  ) {}

  findAll() {
    return this.contacts.find({
      relations: { company: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const contact = await this.contacts.findOne({
      where: { id },
      relations: { company: true },
    });
    if (!contact) throw new NotFoundException(`联系人 ${id} 不存在`);
    return contact;
  }

  create(dto: CreateContactDto) {
    return this.contacts.save(this.contacts.create(dto));
  }

  async update(id: number, dto: UpdateContactDto) {
    const contact = await this.findOne(id);
    Object.assign(contact, dto);
    return this.contacts.save(contact);
  }

  async remove(id: number) {
    const contact = await this.findOne(id);
    await this.contacts.remove(contact);
    return { id };
  }
}

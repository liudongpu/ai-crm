import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, Contact, Document, Lead, Matter } from '../../database/entities';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
    @InjectRepository(Matter) private readonly matters: Repository<Matter>,
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(Document) private readonly documents: Repository<Document>,
  ) {}

  async search(keyword?: string) {
    const query = keyword?.trim();
    if (!query) {
      return { clients: [], contacts: [], matters: [], leads: [], documents: [] };
    }

    const q = `%${query}%`;
    const [clients, contacts, matters, leads, documents] = await Promise.all([
      this.clients
        .createQueryBuilder('client')
        .where('client.name LIKE :q OR client.industry LIKE :q OR client.email LIKE :q', { q })
        .orderBy('client.createdAt', 'DESC')
        .limit(6)
        .getMany(),
      this.contacts
        .createQueryBuilder('contact')
        .leftJoinAndSelect('contact.client', 'client')
        .where('contact.name LIKE :q OR contact.email LIKE :q OR contact.phone LIKE :q', { q })
        .orderBy('contact.createdAt', 'DESC')
        .limit(6)
        .getMany(),
      this.matters
        .createQueryBuilder('matter')
        .leftJoinAndSelect('matter.client', 'client')
        .leftJoinAndSelect('matter.stage', 'stage')
        .where(
          'matter.title LIKE :q OR matter.caseNumber LIKE :q OR matter.practiceArea LIKE :q OR client.name LIKE :q',
          { q },
        )
        .orderBy('matter.createdAt', 'DESC')
        .limit(6)
        .getMany(),
      this.leads
        .createQueryBuilder('lead')
        .where('lead.name LIKE :q OR lead.company LIKE :q OR lead.email LIKE :q', { q })
        .orderBy('lead.createdAt', 'DESC')
        .limit(6)
        .getMany(),
      this.documents
        .createQueryBuilder('document')
        .where('document.title LIKE :q OR document.fileName LIKE :q OR document.category LIKE :q', {
          q,
        })
        .orderBy('document.createdAt', 'DESC')
        .limit(6)
        .getMany(),
    ]);

    return { clients, contacts, matters, leads, documents };
  }
}

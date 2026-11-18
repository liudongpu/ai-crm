import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, Contact, Deal, Lead } from '../../database/entities';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(Deal) private readonly deals: Repository<Deal>,
  ) {}

  async search(keyword?: string) {
    const empty = { accounts: [], contacts: [], leads: [], opportunities: [] };
    const query = keyword?.trim();
    if (!query) return empty;

    const pattern = `%${query}%`;

    const [accounts, contacts, leads, opportunities] = await Promise.all([
      this.companies
        .createQueryBuilder('company')
        .where('company.name LIKE :q OR company.industry LIKE :q', { q: pattern })
        .orderBy('company.createdAt', 'DESC')
        .limit(6)
        .getMany(),
      this.contacts
        .createQueryBuilder('contact')
        .leftJoinAndSelect('contact.company', 'company')
        .where(
          'contact.name LIKE :q OR contact.email LIKE :q OR contact.phone LIKE :q',
          { q: pattern },
        )
        .orderBy('contact.createdAt', 'DESC')
        .limit(6)
        .getMany(),
      this.leads
        .createQueryBuilder('lead')
        .where(
          'lead.name LIKE :q OR lead.company LIKE :q OR lead.email LIKE :q OR lead.phone LIKE :q',
          { q: pattern },
        )
        .orderBy('lead.createdAt', 'DESC')
        .limit(6)
        .getMany(),
      this.deals
        .createQueryBuilder('deal')
        .leftJoinAndSelect('deal.stage', 'stage')
        .leftJoinAndSelect('deal.company', 'company')
        .leftJoinAndSelect('deal.contact', 'contact')
        .leftJoinAndSelect('deal.pipeline', 'pipeline')
        .where('deal.title LIKE :q OR deal.source LIKE :q OR company.name LIKE :q', {
          q: pattern,
        })
        .orderBy('deal.createdAt', 'DESC')
        .limit(6)
        .getMany(),
    ]);

    return { accounts, contacts, leads, opportunities };
  }
}

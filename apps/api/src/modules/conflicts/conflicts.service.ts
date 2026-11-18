import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { CheckConflictDto } from '../../common/dto/special.dto';
import {
  Client,
  ConflictCheck,
  ConflictType,
  Contact,
  Lead,
  Matter,
} from '../../database/entities';

export interface ConflictMatch {
  type: ConflictType;
  id: number;
  name: string;
  detail: string;
}

@Injectable()
export class ConflictsService extends CrudService<ConflictCheck> {
  constructor(
    @InjectRepository(ConflictCheck) repo: Repository<ConflictCheck>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
    @InjectRepository(Matter) private readonly matters: Repository<Matter>,
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
  ) {
    super(repo);
  }

  async check(dto: CheckConflictDto) {
    const name = dto.name.trim();
    const pattern = `%${name}%`;
    const types: ConflictType[] = dto.type
      ? [dto.type]
      : ['client', 'contact', 'matter', 'lead'];
    const matches: ConflictMatch[] = [];

    for (const type of types) {
      if (type === 'client') {
        const rows = await this.clients
          .createQueryBuilder('client')
          .where('client.name LIKE :q OR client.contactName LIKE :q', { q: pattern })
          .getMany();
        for (const row of rows) {
          matches.push({
            type,
            id: row.id,
            name: row.name,
            detail: [row.contactName, row.email, row.phone].filter(Boolean).join(' · '),
          });
        }
      } else if (type === 'contact') {
        const rows = await this.contacts
          .createQueryBuilder('contact')
          .where('contact.name LIKE :q OR contact.email LIKE :q OR contact.phone LIKE :q', {
            q: pattern,
          })
          .getMany();
        for (const row of rows) {
          matches.push({
            type,
            id: row.id,
            name: row.name,
            detail: [row.position, row.email, row.phone].filter(Boolean).join(' · '),
          });
        }
      } else if (type === 'matter') {
        const rows = await this.matters
          .createQueryBuilder('matter')
          .where('matter.title LIKE :q OR matter.caseNumber LIKE :q', { q: pattern })
          .getMany();
        for (const row of rows) {
          matches.push({
            type,
            id: row.id,
            name: row.title,
            detail: [row.caseNumber, row.practiceArea].filter(Boolean).join(' · '),
          });
        }
      } else {
        const rows = await this.leads
          .createQueryBuilder('lead')
          .where('lead.name LIKE :q OR lead.company LIKE :q OR lead.email LIKE :q', {
            q: pattern,
          })
          .getMany();
        for (const row of rows) {
          matches.push({
            type,
            id: row.id,
            name: row.name,
            detail: [row.company, row.email, row.phone].filter(Boolean).join(' · '),
          });
        }
      }
    }

    const hasConflict = matches.length > 0;
    const result = matches.some((item) => item.name.toLowerCase() === name.toLowerCase())
      ? 'conflict'
      : hasConflict
        ? 'potential'
        : 'clear';

    const record = await this.repo.save(
      this.repo.create({
        name,
        type: dto.type ?? 'client',
        result,
        details: JSON.stringify(matches),
        matterId: dto.matterId ?? undefined,
      }),
    );

    return { name, hasConflict, matches, record };
  }
}

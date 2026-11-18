import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { DocumentQueryDto } from '../../common/dto/special.dto';
import { Document } from '../../database/entities';

@Injectable()
export class DocumentsService extends CrudService<Document> {
  constructor(@InjectRepository(Document) repo: Repository<Document>) {
    super(repo);
  }

  async findAll(query: DocumentQueryDto = {}) {
    const qb = this.repo.createQueryBuilder('document');

    if (query.matterId !== undefined) {
      qb.andWhere('document.matterId = :matterId', { matterId: query.matterId });
    }
    if (query.clientId !== undefined) {
      qb.andWhere('document.clientId = :clientId', { clientId: query.clientId });
    }

    return qb.orderBy('document.createdAt', 'DESC').getMany();
  }
}

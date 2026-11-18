import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { CommunicationQueryDto } from '../../common/dto/special.dto';
import { Communication } from '../../database/entities';

@Injectable()
export class CommunicationsService extends CrudService<Communication> {
  constructor(@InjectRepository(Communication) repo: Repository<Communication>) {
    super(repo);
  }

  async findAll(query: CommunicationQueryDto = {}) {
    const qb = this.repo.createQueryBuilder('communication');

    if (query.matterId !== undefined) {
      qb.andWhere('communication.matterId = :matterId', { matterId: query.matterId });
    }
    if (query.clientId !== undefined) {
      qb.andWhere('communication.clientId = :clientId', { clientId: query.clientId });
    }
    if (query.type !== undefined) {
      qb.andWhere('communication.type = :type', { type: query.type });
    }

    return qb
      .orderBy('communication.occurredAt', 'DESC')
      .addOrderBy('communication.createdAt', 'DESC')
      .getMany();
  }
}

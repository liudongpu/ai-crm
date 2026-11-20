import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../../common/crud.service';
import { TrustQueryDto } from '../../../common/dto/special.dto';
import { TrustTransaction } from '../../../database/entities';

@Injectable()
export class TrustTransactionsService extends CrudService<TrustTransaction> {
  constructor(@InjectRepository(TrustTransaction) repo: Repository<TrustTransaction>) {
    super(repo);
  }

  async findAll(query: TrustQueryDto = {}) {
    const qb = this.repo.createQueryBuilder('transaction');

    if (query.clientId !== undefined) {
      qb.andWhere('transaction.clientId = :clientId', { clientId: query.clientId });
    }
    if (query.matterId !== undefined) {
      qb.andWhere('transaction.matterId = :matterId', { matterId: query.matterId });
    }
    if (query.reconciled !== undefined) {
      qb.andWhere('transaction.reconciled = :reconciled', { reconciled: query.reconciled });
    }

    return qb
      .orderBy('transaction.date', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .getMany();
  }

  async reconcile(id: number) {
    const transaction = await this.findOne(id);
    transaction.reconciled = !transaction.reconciled;
    return this.repo.save(transaction);
  }
}

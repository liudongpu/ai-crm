import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { ExpenseQueryDto } from '../../common/dto/special.dto';
import { Expense } from '../../database/entities';

@Injectable()
export class ExpensesService extends CrudService<Expense> {
  constructor(@InjectRepository(Expense) repo: Repository<Expense>) {
    super(repo);
  }

  async findAll(query: ExpenseQueryDto = {}) {
    const qb = this.repo.createQueryBuilder('expense');

    if (query.matterId !== undefined) {
      qb.andWhere('expense.matterId = :matterId', { matterId: query.matterId });
    }
    if (query.invoiced !== undefined) {
      qb.andWhere('expense.invoiced = :invoiced', { invoiced: query.invoiced });
    }

    return qb.orderBy('expense.date', 'DESC').addOrderBy('expense.createdAt', 'DESC').getMany();
  }
}

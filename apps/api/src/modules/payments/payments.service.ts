import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { CreatePaymentDto } from '../../common/dto/create-payment.dto';
import { PaymentQueryDto } from '../../common/dto/special.dto';
import { Payment } from '../../database/entities';

@Injectable()
export class PaymentsService extends CrudService<Payment> {
  constructor(@InjectRepository(Payment) repo: Repository<Payment>) {
    super(repo);
  }

  async findAll(query: PaymentQueryDto = {}) {
    const qb = this.repo.createQueryBuilder('payment');

    if (query.invoiceId !== undefined) {
      qb.andWhere('payment.invoiceId = :invoiceId', { invoiceId: query.invoiceId });
    }

    return qb.orderBy('payment.date', 'DESC').addOrderBy('payment.createdAt', 'DESC').getMany();
  }

  create(dto: CreatePaymentDto) {
    return this.repo.save(
      this.repo.create({ ...dto, date: dto.date ?? new Date() }),
    );
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
} from '../../common/dto/create-invoice.dto';
import { InvoicePaymentDto, InvoiceQueryDto } from '../../common/dto/special.dto';
import { Invoice, InvoiceItem } from '../../database/entities';
import { PaymentsService } from '../payments/payments.service';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class InvoicesService extends CrudService<Invoice> {
  constructor(
    @InjectRepository(Invoice) repo: Repository<Invoice>,
    private readonly payments: PaymentsService,
    private readonly permissions: PermissionsService,
  ) {
    super(repo);
  }

  async findAll(query: InvoiceQueryDto = {}) {
    const qb = this.repo.createQueryBuilder('invoice');

    if (query.status !== undefined) {
      qb.andWhere('invoice.status = :status', { status: query.status });
    }
    if (query.clientId !== undefined) {
      qb.andWhere('invoice.clientId = :clientId', { clientId: query.clientId });
    }
    if (query.matterId !== undefined) {
      qb.andWhere('invoice.matterId = :matterId', { matterId: query.matterId });
    }

    return qb.orderBy('invoice.issueDate', 'DESC').addOrderBy('invoice.createdAt', 'DESC').getMany();
  }

  async create(dto: CreateInvoiceDto) {
    const taxRate = dto.taxRate ?? 0.06;
    const totals = this.calculate(dto.items, taxRate);
    return this.repo.save(
      this.repo.create({
        ...dto,
        number: dto.number ?? (await this.nextNumber()),
        issueDate: dto.issueDate ?? new Date(),
        dueDate: dto.dueDate ?? new Date(Date.now() + 30 * 86_400_000),
        status: dto.status ?? 'draft',
        taxRate,
        items: dto.items ?? [],
        subtotal: dto.subtotal ?? totals.subtotal,
        tax: dto.tax ?? totals.tax,
        total: dto.total ?? totals.total,
      }),
    );
  }

  async update(id: number, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(id);
    Object.assign(invoice, dto);
    if (dto.items !== undefined || dto.taxRate !== undefined) {
      const totals = this.calculate(invoice.items, invoice.taxRate);
      invoice.subtotal = totals.subtotal;
      invoice.tax = totals.tax;
      invoice.total = totals.total;
    }
    return this.repo.save(invoice);
  }

  async approve(id: number, actorId?: number) {
    // 律师生成草稿，合伙人审批：按角色权限校验（AT-07）。
    await this.permissions.assert(actorId, 'invoice.approve');
    const invoice = await this.findOne(id);
    this.assertEditable(invoice);
    invoice.status = 'approved';
    return this.repo.save(invoice);
  }

  async send(id: number) {
    const invoice = await this.findOne(id);
    this.assertEditable(invoice);
    // 律师草稿 → 合伙人审批 → 发送：未经审批的账单不得发送给客户（AT-03）。
    if (invoice.status !== 'approved') {
      throw new BadRequestException('账单需先经审批通过后才能发送给客户');
    }
    invoice.status = 'sent';
    return this.repo.save(invoice);
  }

  async void(id: number) {
    const invoice = await this.findOne(id);
    this.assertEditable(invoice);
    invoice.status = 'void';
    return this.repo.save(invoice);
  }

  async addPayment(id: number, dto: InvoicePaymentDto) {
    const invoice = await this.findOne(id);
    const payment = await this.payments.create({ ...dto, invoiceId: id });
    invoice.paidAmount = Number(invoice.paidAmount) + Number(payment.amount);
    if (invoice.paidAmount >= invoice.total) invoice.status = 'paid';
    return this.repo.save(invoice);
  }

  private assertEditable(invoice: Invoice) {
    if (invoice.status === 'void' || invoice.status === 'paid') {
      throw new BadRequestException('该账单已作废或已结清，无法变更状态');
    }
  }

  private calculate(items: InvoiceItem[] | null | undefined, taxRate: number) {
    const subtotal = (items ?? []).reduce(
      (sum, item) => sum + (item.amount || item.quantity * item.rate),
      0,
    );
    const tax = subtotal * taxRate;
    return {
      subtotal: this.round(subtotal),
      tax: this.round(tax),
      total: this.round(subtotal + tax),
    };
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }

  private async nextNumber() {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const rows = await this.repo
      .createQueryBuilder('invoice')
      .select('invoice.number', 'number')
      .where('invoice.number LIKE :q', { q: `${prefix}%` })
      .getRawMany<{ number: string }>();
    const max = rows.reduce((current, row) => {
      const value = Number(row.number?.split('-').pop());
      return Number.isFinite(value) ? Math.max(current, value) : current;
    }, 0);
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }
}

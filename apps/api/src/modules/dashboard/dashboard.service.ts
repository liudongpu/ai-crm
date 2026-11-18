import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Client,
  Invoice,
  Lead,
  Matter,
  MatterStage,
  Payment,
  Task,
  TimeEntry,
  TrustTransaction,
  User,
} from '../../database/entities';

interface SumRow {
  value?: string;
  hours?: string;
  amount?: string;
  count?: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Matter) private readonly matters: Repository<Matter>,
    @InjectRepository(MatterStage) private readonly stages: Repository<MatterStage>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(TimeEntry) private readonly entries: Repository<TimeEntry>,
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(TrustTransaction) private readonly trust: Repository<TrustTransaction>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async summary() {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      openMatters,
      closedMatters,
      activeClients,
      leadCount,
      tasksDue,
      stages,
      stageStats,
      taskTypes,
      recentMatters,
      upcomingTasks,
      unbilled,
      outstanding,
      revenueThisMonth,
      trustRows,
      revenueByMonth,
    ] = await Promise.all([
      this.matters.count({ where: { status: 'open' } }),
      this.matters
        .createQueryBuilder('matter')
        .where('matter.status IN (:...statuses)', { statuses: ['closed', 'won', 'lost'] })
        .getCount(),
      this.clients.count({ where: { status: 'active' } }),
      this.leads.count(),
      this.tasks
        .createQueryBuilder('task')
        .where('task.done = :done', { done: false })
        .andWhere('task.dueDate <= :endOfToday', { endOfToday })
        .getCount(),
      this.stages.find({ order: { position: 'ASC' } }),
      this.matters
        .createQueryBuilder('matter')
        .select('matter.stageId', 'stageId')
        .addSelect('COUNT(matter.id)', 'count')
        .addSelect('COALESCE(SUM(matter.value), 0)', 'value')
        .groupBy('matter.stageId')
        .getRawMany<{ stageId: number; count: string; value: string }>(),
      this.tasks
        .createQueryBuilder('task')
        .select('task.type', 'type')
        .addSelect('COUNT(task.id)', 'count')
        .groupBy('task.type')
        .getRawMany<{ type: string; count: string }>(),
      this.matters.find({
        relations: { client: true, stage: true, owner: true },
        order: { createdAt: 'DESC' },
        take: 6,
      }),
      this.tasks
        .createQueryBuilder('task')
        .where('task.done = :done', { done: false })
        .andWhere('task.dueDate IS NOT NULL')
        .orderBy('task.dueDate', 'ASC')
        .limit(6)
        .getMany(),
      this.entries
        .createQueryBuilder('entry')
        .select('COALESCE(SUM(entry.hours), 0)', 'hours')
        .addSelect('COALESCE(SUM(entry.amount), 0)', 'amount')
        .where('entry.invoiced = :invoiced', { invoiced: false })
        .getRawOne<SumRow>(),
      this.invoices
        .createQueryBuilder('invoice')
        .select('COUNT(invoice.id)', 'count')
        .addSelect('COALESCE(SUM(invoice.total - invoice.paidAmount), 0)', 'amount')
        .where('invoice.status NOT IN (:...statuses)', { statuses: ['paid', 'void'] })
        .getRawOne<SumRow>(),
      this.payments
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'value')
        .where('payment.date >= :monthStart', { monthStart })
        .getRawOne<SumRow>(),
      this.trust.find({ select: { type: true, amount: true } }),
      this.payments
        .createQueryBuilder('payment')
        .select(`strftime('%Y-%m', payment.date)`, 'month')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'value')
        .addSelect('COUNT(payment.id)', 'count')
        .groupBy(`strftime('%Y-%m', payment.date)`)
        .orderBy('month', 'ASC')
        .getRawMany<{ month: string; value: string; count: string }>(),
    ]);

    const stats = new Map(stageStats.map((row) => [row.stageId, row]));

    return {
      metrics: {
        openMatters,
        closedMatters,
        activeClients,
        leads: leadCount,
        tasksDue,
        unbilledHours: Number(unbilled?.hours ?? 0),
        unbilledAmount: Number(unbilled?.amount ?? 0),
        outstandingInvoices: Number(outstanding?.count ?? 0),
        outstandingAmount: Number(outstanding?.amount ?? 0),
        trustBalance: this.trustBalance(trustRows),
        revenueThisMonth: Number(revenueThisMonth?.value ?? 0),
      },
      mattersByStage: stages.map((stage) => {
        const stat = stats.get(stage.id);
        return {
          id: stage.id,
          name: stage.name,
          color: stage.color,
          count: Number(stat?.count ?? 0),
          value: Number(stat?.value ?? 0),
        };
      }),
      tasksByType: taskTypes.map((row) => ({ type: row.type, count: Number(row.count) })),
      recentMatters,
      upcomingTasks,
      revenueByMonth: revenueByMonth.map((row) => ({
        month: row.month,
        value: Number(row.value),
        count: Number(row.count),
      })),
    };
  }

  async reports(days = 90) {
    const windowDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);
    cutoff.setHours(0, 0, 0, 0);

    const [
      openMatters,
      closedMatters,
      revenue,
      collected,
      outstanding,
      trustRows,
      leadCount,
      convertedLeads,
      timeTotals,
      billedTime,
      userCount,
      practiceAreas,
      revenueByMonth,
      timeByUser,
      topClients,
      leadsBySource,
      taskTypes,
    ] = await Promise.all([
      this.matters.count({ where: { status: 'open' } }),
      this.matters
        .createQueryBuilder('matter')
        .where('matter.status IN (:...statuses)', { statuses: ['closed', 'won', 'lost'] })
        .getCount(),
      this.invoices
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.total), 0)', 'value')
        .where('invoice.issueDate >= :cutoff', { cutoff })
        .andWhere('invoice.status != :void', { void: 'void' })
        .getRawOne<SumRow>(),
      this.payments
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'value')
        .where('payment.date >= :cutoff', { cutoff })
        .getRawOne<SumRow>(),
      this.invoices
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.total - invoice.paidAmount), 0)', 'value')
        .where('invoice.status NOT IN (:...statuses)', { statuses: ['paid', 'void'] })
        .getRawOne<SumRow>(),
      this.trust.find({ select: { type: true, amount: true } }),
      this.leads.count(),
      this.leads.count({ where: { status: 'converted' } }),
      this.entries
        .createQueryBuilder('entry')
        .select('COALESCE(SUM(entry.hours), 0)', 'hours')
        .addSelect('COALESCE(SUM(entry.amount), 0)', 'value')
        .where('entry.date >= :cutoff', { cutoff })
        .getRawOne<SumRow>(),
      this.entries
        .createQueryBuilder('entry')
        .select('COALESCE(SUM(entry.amount), 0)', 'value')
        .where('entry.date >= :cutoff', { cutoff })
        .andWhere('entry.invoiced = :invoiced', { invoiced: true })
        .getRawOne<SumRow>(),
      this.users.count({ where: { active: true } }),
      this.matters
        .createQueryBuilder('matter')
        .select('matter.practiceArea', 'area')
        .addSelect('COUNT(matter.id)', 'count')
        .addSelect('COALESCE(SUM(matter.value), 0)', 'value')
        .groupBy('matter.practiceArea')
        .orderBy('value', 'DESC')
        .getRawMany<{ area: string; count: string; value: string }>(),
      this.payments
        .createQueryBuilder('payment')
        .select(`strftime('%Y-%m', payment.date)`, 'month')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'value')
        .addSelect('COUNT(payment.id)', 'count')
        .where('payment.date >= :cutoff', { cutoff })
        .groupBy(`strftime('%Y-%m', payment.date)`)
        .orderBy('month', 'ASC')
        .getRawMany<{ month: string; value: string; count: string }>(),
      this.entries
        .createQueryBuilder('entry')
        .innerJoin(User, 'user', 'user.id = entry.userId')
        .select('user.name', 'name')
        .addSelect('COALESCE(SUM(entry.hours), 0)', 'hours')
        .addSelect('COALESCE(SUM(entry.amount), 0)', 'amount')
        .where('entry.date >= :cutoff', { cutoff })
        .groupBy('user.id')
        .orderBy('hours', 'DESC')
        .getRawMany<{ name: string; hours: string; amount: string }>(),
      this.matters
        .createQueryBuilder('matter')
        .innerJoin('matter.client', 'client')
        .select('client.name', 'name')
        .addSelect('COALESCE(SUM(matter.value), 0)', 'value')
        .addSelect('COUNT(matter.id)', 'matters')
        .groupBy('client.id')
        .orderBy('value', 'DESC')
        .limit(6)
        .getRawMany<{ name: string; value: string; matters: string }>(),
      this.leads
        .createQueryBuilder('lead')
        .select('lead.source', 'source')
        .addSelect('COUNT(lead.id)', 'count')
        .groupBy('lead.source')
        .getRawMany<{ source: string; count: string }>(),
      this.tasks
        .createQueryBuilder('task')
        .select('task.type', 'type')
        .addSelect('COUNT(task.id)', 'count')
        .groupBy('task.type')
        .getRawMany<{ type: string; count: string }>(),
    ]);

    const totalTimeAmount = Number(timeTotals?.value ?? 0);
    const billedTimeAmount = Number(billedTime?.value ?? 0);
    const totalHours = Number(timeTotals?.hours ?? 0);
    const revenueValue = Number(revenue?.value ?? 0);
    const collectedValue = Number(collected?.value ?? 0);
    const workingDays = Math.max(1, Math.round((windowDays * 5) / 7));
    const capacity = Math.max(1, userCount) * workingDays * 8;

    return {
      metrics: {
        openMatters,
        closedMatters,
        revenue: revenueValue,
        collected: collectedValue,
        outstanding: Number(outstanding?.value ?? 0),
        trustBalance: this.trustBalance(trustRows),
        realizationRate: totalTimeAmount ? this.rate(billedTimeAmount, totalTimeAmount) : 0,
        utilizationRate: Math.min(100, this.rate(totalHours, capacity)),
        collectionRate: revenueValue ? Math.min(100, this.rate(collectedValue, revenueValue)) : 0,
        leads: leadCount,
        convertedLeads,
      },
      mattersByPracticeArea: practiceAreas.map((row) => ({
        area: row.area,
        count: Number(row.count),
        value: Number(row.value),
      })),
      revenueByMonth: revenueByMonth.map((row) => ({
        month: row.month,
        value: Number(row.value),
        count: Number(row.count),
      })),
      timeByUser: timeByUser.map((row) => ({
        name: row.name,
        hours: Number(row.hours),
        amount: Number(row.amount),
      })),
      topClients: topClients.map((row) => ({
        name: row.name,
        value: Number(row.value),
        matters: Number(row.matters),
      })),
      leadsBySource: leadsBySource.map((row) => ({
        source: row.source,
        count: Number(row.count),
      })),
      tasksByType: taskTypes.map((row) => ({ type: row.type, count: Number(row.count) })),
    };
  }

  private trustBalance(rows: Pick<TrustTransaction, 'type' | 'amount'>[]) {
    return rows.reduce((balance, row) => {
      if (row.type === 'deposit' || row.type === 'transfer_in') return balance + Number(row.amount);
      if (row.type === 'withdrawal' || row.type === 'transfer_out' || row.type === 'refund') {
        return balance - Number(row.amount);
      }
      return balance;
    }, 0);
  }

  private rate(value: number, total: number) {
    return Math.round((value / total) * 100);
  }
}

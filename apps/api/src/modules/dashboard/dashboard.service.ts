import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Client,
  Communication,
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
    @InjectRepository(Communication) private readonly communications: Repository<Communication>,
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
      unrepliedMessages,
      followUpMessages,
      upcomingDeadlines,
      overdueInvoices,
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
      this.communications
        .createQueryBuilder('communication')
        .where('communication.direction = :direction', { direction: 'inbound' })
        .andWhere('communication.replied = :replied', { replied: false })
        .andWhere('communication.internal = :internal', { internal: false })
        .andWhere('communication.occurredAt <= :cutoff', {
          cutoff: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        })
        .getMany(),
      this.communications.count({ where: { needsFollowUp: true } }),
      this.tasks
        .createQueryBuilder('task')
        .where('task.done = :done', { done: false })
        .andWhere('task.type IN (:...types)', { types: ['deadline', 'hearing', 'court'] })
        .andWhere('task.dueDate >= :now', { now })
        .andWhere('task.dueDate <= :weekEnd', {
          weekEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        })
        .getCount(),
      this.invoices
        .createQueryBuilder('invoice')
        .where('invoice.dueDate < :now', { now })
        .andWhere('invoice.status NOT IN (:...statuses)', { statuses: ['paid', 'void'] })
        .getCount(),
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
        unrepliedMessages: unrepliedMessages.length,
        followUpMessages,
        upcomingDeadlines,
        overdueInvoices,
      },
      riskAlerts: [
        ...(unrepliedMessages.length > 0
          ? [{
              type: 'communication',
              level: 'high',
              label: `${unrepliedMessages.length} 条客户消息超过 24 小时未回复`,
              detail: unrepliedMessages[0].content,
              route: '/communications',
            }]
          : []),
        ...(followUpMessages > 0
          ? [{
              type: 'communication',
              level: 'medium',
              label: `${followUpMessages} 条沟通标记需跟进`,
              detail: '查看沟通中心的需跟进会话',
              route: '/communications',
            }]
          : []),
        ...(upcomingDeadlines > 0
          ? [{
              type: 'deadline',
              level: 'medium',
              label: `未来 7 天有 ${upcomingDeadlines} 项法定期限/庭审`,
              detail: '提前核对期限与庭审准备',
              route: '/calendar/deadlines',
            }]
          : []),
        ...(overdueInvoices > 0
          ? [{
              type: 'invoice',
              level: 'high',
              label: `${overdueInvoices} 张账单已逾期未收`,
              detail: '及时催收，避免现金流拖延',
              route: '/billing?tab=invoices',
            }]
          : []),
      ],
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

  /** 5 张核心报表：收入、应收、工时、案件、客户。 */
  async coreReports() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const halfYearStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      collectedMonth,
      collectedQuarter,
      collectedTotal,
      billedMonth,
      outstandingInvoices,
      monthlyIncome,
      unpaidInvoices,
      recentEntries,
      openMatters,
      closedMatters,
      mattersByArea,
      mattersByOwner,
      newClientsThisMonth,
      newClientsThisQuarter,
      clientRevenue,
    ] = await Promise.all([
      this.payments
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'value')
        .where('payment.date >= :monthStart', { monthStart })
        .getRawOne<SumRow>(),
      this.payments
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'value')
        .where('payment.date >= :quarterStart', { quarterStart })
        .getRawOne<SumRow>(),
      this.payments
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'value')
        .getRawOne<SumRow>(),
      this.invoices
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.total), 0)', 'value')
        .where('invoice.issueDate >= :monthStart', { monthStart })
        .andWhere('invoice.status != :void', { void: 'void' })
        .getRawOne<SumRow>(),
      this.invoices
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.total - invoice.paidAmount), 0)', 'value')
        .where('invoice.status NOT IN (:...statuses)', { statuses: ['paid', 'void'] })
        .getRawOne<SumRow>(),
      this.payments
        .createQueryBuilder('payment')
        .select(`strftime('%Y-%m', payment.date)`, 'month')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'value')
        .where('payment.date >= :halfYearStart', { halfYearStart })
        .groupBy(`strftime('%Y-%m', payment.date)`)
        .orderBy('month', 'ASC')
        .getRawMany<{ month: string; value: string }>(),
      this.invoices
        .createQueryBuilder('invoice')
        .where('invoice.status NOT IN (:...statuses)', { statuses: ['paid', 'void'] })
        .andWhere('invoice.total - invoice.paidAmount > 0')
        .orderBy('invoice.dueDate', 'ASC')
        .getMany(),
      this.entries
        .createQueryBuilder('entry')
        .where('entry.date >= :monthStart', { monthStart })
        .getMany(),
      this.matters.count({ where: { status: 'open' } }),
      this.matters
        .createQueryBuilder('matter')
        .where('matter.status IN (:...statuses)', { statuses: ['closed', 'won', 'lost'] })
        .getCount(),
      this.matters
        .createQueryBuilder('matter')
        .select('matter.practiceArea', 'area')
        .addSelect('COUNT(matter.id)', 'count')
        .groupBy('matter.practiceArea')
        .orderBy('count', 'DESC')
        .getRawMany<{ area: string; count: string }>(),
      this.matters
        .createQueryBuilder('matter')
        .leftJoin('matter.owner', 'owner')
        .select('owner.name', 'name')
        .addSelect('COUNT(matter.id)', 'count')
        .where('matter.status = :status', { status: 'open' })
        .groupBy('owner.id')
        .orderBy('count', 'DESC')
        .getRawMany<{ name: string | null; count: string }>(),
      this.clients
        .createQueryBuilder('client')
        .where('client.createdAt >= :monthStart', { monthStart })
        .getCount(),
      this.clients
        .createQueryBuilder('client')
        .where('client.createdAt >= :quarterStart', { quarterStart })
        .getCount(),
      this.payments
        .createQueryBuilder('payment')
        .innerJoin(Invoice, 'invoice', 'invoice.id = payment.invoiceId')
        .select('invoice.clientId', 'clientId')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'value')
        .groupBy('invoice.clientId')
        .orderBy('value', 'DESC')
        .limit(8)
        .getRawMany<{ clientId: number; value: string }>(),
    ]);

    const clientMap = new Map(
      (await this.clients.find({ select: { id: true, name: true } })).map((client) => [client.id, client.name]),
    );

    const receivables = unpaidInvoices.map((invoice) => {
      const due = invoice.dueDate ? new Date(invoice.dueDate).getTime() : now.getTime();
      return {
        invoiceId: invoice.id,
        number: invoice.number,
        clientId: invoice.clientId,
        clientName: clientMap.get(invoice.clientId) ?? `客户 #${invoice.clientId}`,
        remaining: Math.round((invoice.total - invoice.paidAmount) * 100) / 100,
        dueDate: invoice.dueDate,
        agingDays: Math.max(0, Math.floor((now.getTime() - due) / 86_400_000)),
        status: invoice.status,
      };
    });
    const aging = {
      current: receivables.filter((row) => row.agingDays === 0).reduce((sum, row) => sum + row.remaining, 0),
      days1to30: receivables.filter((row) => row.agingDays > 0 && row.agingDays <= 30).reduce((sum, row) => sum + row.remaining, 0),
      days31to60: receivables.filter((row) => row.agingDays > 30 && row.agingDays <= 60).reduce((sum, row) => sum + row.remaining, 0),
      over60: receivables.filter((row) => row.agingDays > 60).reduce((sum, row) => sum + row.remaining, 0),
    };

    const userMap = new Map((await this.users.find({ select: { id: true, name: true } })).map((user) => [user.id, user.name]));
    const timeByUserMap = new Map<number, { name: string; monthHours: number; weekHours: number; billableHours: number; nonBillableHours: number; amount: number }>();
    for (const entry of recentEntries) {
      const row = timeByUserMap.get(entry.userId) ?? {
        name: userMap.get(entry.userId) ?? `人员 #${entry.userId}`,
        monthHours: 0,
        weekHours: 0,
        billableHours: 0,
        nonBillableHours: 0,
        amount: 0,
      };
      const hours = Number(entry.hours);
      row.monthHours += hours;
      if (new Date(entry.date) >= weekStart) row.weekHours += hours;
      if (entry.billable) row.billableHours += hours;
      else row.nonBillableHours += hours;
      row.amount += Number(entry.amount);
      timeByUserMap.set(entry.userId, row);
    }
    const round = (value: number) => Math.round(value * 100) / 100;

    return {
      revenue: {
        collectedThisMonth: Number(collectedMonth?.value ?? 0),
        collectedThisQuarter: Number(collectedQuarter?.value ?? 0),
        collectedTotal: Number(collectedTotal?.value ?? 0),
        billedThisMonth: Number(billedMonth?.value ?? 0),
        outstanding: Number(outstandingInvoices?.value ?? 0),
        byMonth: monthlyIncome.map((row) => ({ month: row.month, value: Number(row.value) })),
      },
      receivables: {
        total: Number(outstandingInvoices?.value ?? 0),
        count: receivables.length,
        aging,
        rows: receivables,
      },
      time: {
        rows: [...timeByUserMap.values()].map((row) => ({
          ...row,
          monthHours: round(row.monthHours),
          weekHours: round(row.weekHours),
          billableHours: round(row.billableHours),
          nonBillableHours: round(row.nonBillableHours),
          amount: round(row.amount),
        })),
      },
      matters: {
        open: openMatters,
        closed: closedMatters,
        byArea: mattersByArea.map((row) => ({ area: row.area, count: Number(row.count) })),
        byOwner: mattersByOwner.map((row) => ({ name: row.name ?? '未指派', count: Number(row.count) })),
      },
      clients: {
        newThisMonth: newClientsThisMonth,
        newThisQuarter: newClientsThisQuarter,
        revenueByClient: clientRevenue.map((row) => ({
          clientId: row.clientId,
          name: clientMap.get(row.clientId) ?? `客户 #${row.clientId}`,
          value: Number(row.value),
        })),
      },
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

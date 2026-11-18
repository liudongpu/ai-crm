import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, Company, Contact, Deal, Lead, Stage } from '../../database/entities';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Deal) private readonly deals: Repository<Deal>,
    @InjectRepository(Stage) private readonly stages: Repository<Stage>,
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
  ) {}

  async summary() {
    const [openDeals, wonDeals, lostDeals, contacts, companies, stages, dueActivities, typeCounts] =
      await Promise.all([
        this.deals.count({ where: { status: 'open' } }),
        this.deals.count({ where: { status: 'won' } }),
        this.deals.count({ where: { status: 'lost' } }),
        this.contacts.count(),
        this.companies.count(),
        this.stages.find({ order: { position: 'ASC' } }),
        this.activities
          .createQueryBuilder('activity')
          .where('activity.done = :done', { done: false })
          .andWhere('activity.dueDate <= :endOfToday', { endOfToday: this.endOfToday() })
          .getCount(),
        this.activities
          .createQueryBuilder('activity')
          .select('activity.type', 'type')
          .addSelect('COUNT(activity.id)', 'count')
          .groupBy('activity.type')
          .getRawMany<{ type: string; count: string }>(),
      ]);

    const [pipelineValues, wonValues, rawStageStats, recentDeals, upcomingActivities] =
      await Promise.all([
        this.deals
          .createQueryBuilder('deal')
          .select('COALESCE(SUM(deal.value), 0)', 'value')
          .where('deal.status = :status', { status: 'open' })
          .getRawOne<{ value: string }>(),
        this.deals
          .createQueryBuilder('deal')
          .select('COALESCE(SUM(deal.value), 0)', 'value')
          .where('deal.status = :status', { status: 'won' })
          .getRawOne<{ value: string }>(),
        this.deals
          .createQueryBuilder('deal')
          .select('deal.stageId', 'stageId')
          .addSelect('COUNT(deal.id)', 'count')
          .addSelect('COALESCE(SUM(deal.value), 0)', 'value')
          .groupBy('deal.stageId')
          .getRawMany<{ stageId: number; count: string; value: string }>(),
        this.deals.find({
          relations: { stage: true, contact: true, company: true },
          order: { createdAt: 'DESC' },
          take: 6,
        }),
        this.activities.find({
          relations: { deal: true, contact: true },
          where: { done: false },
          order: { dueDate: 'ASC' },
          take: 6,
        }),
      ]);

    const stats = new Map(rawStageStats.map((row) => [row.stageId, row]));
    const dealsByStage = stages.map((stage) => {
      const stat = stats.get(stage.id);
      return {
        id: stage.id,
        name: stage.name,
        color: stage.color,
        probability: stage.probability,
        count: Number(stat?.count ?? 0),
        value: Number(stat?.value ?? 0),
      };
    });

    const decided = wonDeals + lostDeals;

    return {
      metrics: {
        openDeals,
        wonDeals,
        lostDeals,
        pipelineValue: Number(pipelineValues?.value ?? 0),
        wonValue: Number(wonValues?.value ?? 0),
        contacts,
        companies,
        activitiesDue: dueActivities,
        winRate: decided ? Math.round((wonDeals / decided) * 100) : 0,
      },
      dealsByStage,
      activitiesByType: typeCounts.map((row) => ({ type: row.type, count: Number(row.count) })),
      recentDeals,
      upcomingActivities,
    };
  }

  async reports(days = 90) {
    const windowDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);
    cutoff.setHours(0, 0, 0, 0);

    const [
      openDeals,
      wonDeals,
      lostDeals,
      leads,
      convertedLeads,
      activitiesDue,
      typeCounts,
      stages,
      rawStageStats,
      rawLeadStatuses,
      pipelineValues,
      wonValues,
      rawWonByMonth,
      rawDealsByOwner,
      rawTopAccounts,
    ] = await Promise.all([
      this.deals.count({ where: { status: 'open' } }),
      this.deals.count({ where: { status: 'won' } }),
      this.deals.count({ where: { status: 'lost' } }),
      this.leads.count(),
      this.leads.count({ where: { status: 'converted' } }),
      this.activities
        .createQueryBuilder('activity')
        .where('activity.done = :done', { done: false })
        .andWhere('activity.dueDate <= :endOfToday', { endOfToday: this.endOfToday() })
        .getCount(),
      this.activities
        .createQueryBuilder('activity')
        .select('activity.type', 'type')
        .addSelect('COUNT(activity.id)', 'count')
        .groupBy('activity.type')
        .getRawMany<{ type: string; count: string }>(),
      this.stages.find({ order: { position: 'ASC' } }),
      this.deals
        .createQueryBuilder('deal')
        .select('deal.stageId', 'stageId')
        .addSelect('COUNT(deal.id)', 'count')
        .addSelect('COALESCE(SUM(deal.value), 0)', 'value')
        .groupBy('deal.stageId')
        .getRawMany<{ stageId: number; count: string; value: string }>(),
      this.leads
        .createQueryBuilder('lead')
        .select('lead.status', 'status')
        .addSelect('COUNT(lead.id)', 'count')
        .groupBy('lead.status')
        .getRawMany<{ status: string; count: string }>(),
      this.deals
        .createQueryBuilder('deal')
        .select('COALESCE(SUM(deal.value), 0)', 'value')
        .where('deal.status = :status', { status: 'open' })
        .getRawOne<{ value: string }>(),
      this.deals
        .createQueryBuilder('deal')
        .select('COALESCE(SUM(deal.value), 0)', 'value')
        .where('deal.status = :status', { status: 'won' })
        .getRawOne<{ value: string }>(),
      this.deals
        .createQueryBuilder('deal')
        .select(`strftime('%Y-%m', deal.expectedCloseDate)`, 'month')
        .addSelect('COALESCE(SUM(deal.value), 0)', 'value')
        .addSelect('COUNT(deal.id)', 'count')
        .where('deal.status = :status', { status: 'won' })
        .andWhere('deal.createdAt >= :cutoff', { cutoff })
        .andWhere('deal.expectedCloseDate IS NOT NULL')
        .groupBy(`strftime('%Y-%m', deal.expectedCloseDate)`)
        .orderBy('month', 'ASC')
        .getRawMany<{ month: string; value: string; count: string }>(),
      this.deals
        .createQueryBuilder('deal')
        .innerJoin('deal.contact', 'contact')
        .select('contact.owner', 'owner')
        .addSelect('COALESCE(SUM(deal.value), 0)', 'value')
        .addSelect('COUNT(deal.id)', 'count')
        .where('deal.createdAt >= :cutoff', { cutoff })
        .groupBy('contact.owner')
        .orderBy('value', 'DESC')
        .limit(8)
        .getRawMany<{ owner: string; value: string; count: string }>(),
      this.deals
        .createQueryBuilder('deal')
        .innerJoin('deal.company', 'company')
        .select('company.name', 'name')
        .addSelect('COALESCE(SUM(deal.value), 0)', 'value')
        .addSelect('COUNT(deal.id)', 'deals')
        .where('deal.status IN (:...statuses)', { statuses: ['open', 'won'] })
        .andWhere('deal.createdAt >= :cutoff', { cutoff })
        .groupBy('company.name')
        .orderBy('value', 'DESC')
        .limit(6)
        .getRawMany<{ name: string; value: string; deals: string }>(),
    ]);

    const stageStats = new Map(rawStageStats.map((row) => [row.stageId, row]));
    const decided = wonDeals + lostDeals;

    return {
      metrics: {
        openDeals,
        wonDeals,
        lostDeals,
        pipelineValue: Number(pipelineValues?.value ?? 0),
        wonValue: Number(wonValues?.value ?? 0),
        winRate: decided ? Math.round((wonDeals / decided) * 100) : 0,
        leads,
        convertedLeads,
        activitiesDue,
      },
      dealsByStage: stages.map((stage) => {
        const stat = stageStats.get(stage.id);
        return {
          id: stage.id,
          name: stage.name,
          color: stage.color,
          count: Number(stat?.count ?? 0),
          value: Number(stat?.value ?? 0),
        };
      }),
      wonByMonth: rawWonByMonth.map((row) => ({
        month: row.month,
        value: Number(row.value),
        count: Number(row.count),
      })),
      activitiesByType: typeCounts.map((row) => ({ type: row.type, count: Number(row.count) })),
      dealsByOwner: rawDealsByOwner.map((row) => ({
        owner: row.owner,
        value: Number(row.value),
        count: Number(row.count),
      })),
      leadsByStatus: rawLeadStatuses.map((row) => ({ status: row.status, count: Number(row.count) })),
      topAccounts: rawTopAccounts.map((row) => ({
        name: row.name,
        value: Number(row.value),
        deals: Number(row.deals),
      })),
    };
  }

  private endOfToday() {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }
}

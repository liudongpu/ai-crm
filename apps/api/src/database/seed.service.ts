import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, Company, Contact, Deal, Pipeline, Stage } from './entities';

const STAGES = [
  { name: '新线索', color: '#94a3b8', probability: 10 },
  { name: '已联系', color: '#0ea5e9', probability: 25 },
  { name: '需求确认', color: '#6366f1', probability: 40 },
  { name: '方案报价', color: '#f59e0b', probability: 60 },
  { name: '商务谈判', color: '#ec4899', probability: 80 },
  { name: '赢单', color: '#22c55e', probability: 100 },
  { name: '输单', color: '#ef4444', probability: 0 },
];

const COMPANIES = [
  { name: '星云科技', industry: '互联网 / 软件', website: 'xingyun.example.com', phone: '010-8888 1201', address: '北京市海淀区中关村大街 1 号' },
  { name: '云图数据', industry: '数据服务', website: 'yuntu.example.com', phone: '021-6688 2301', address: '上海市浦东新区张江路 88 号' },
  { name: '智联未来', industry: '人工智能', website: 'zhilian.example.com', phone: '0755-8999 3102', address: '深圳市南山区科技园南区' },
  { name: '蓝海传媒', industry: '广告传媒', website: 'lanhai.example.com', phone: '020-3888 4501', address: '广州市天河区珠江新城' },
  { name: '优选电商', industry: '电子商务', website: 'youxuan.example.com', phone: '0571-8899 5601', address: '杭州市余杭区文一西路' },
  { name: '极光智能', industry: '智能制造', website: 'jiguang.example.com', phone: '0512-6699 7801', address: '苏州市工业园区星湖街' },
  { name: '恒信物流', industry: '物流运输', website: 'hengxin.example.com', phone: '022-5888 9101', address: '天津市滨海新区港城路' },
  { name: '木星设计', industry: '设计服务', website: 'muxing.example.com', phone: '028-6688 1208', address: '成都市高新区天府大道' },
];

const CONTACTS = [
  { name: '陈思远', email: 'chen.siyuan@xingyun.example.com', phone: '138 0000 1201', position: '采购总监', companyIndex: 0 },
  { name: '林晓', email: 'lin.xiao@yuntu.example.com', phone: '138 0000 1202', position: '技术负责人', companyIndex: 1 },
  { name: '王磊', email: 'wang.lei@zhilian.example.com', phone: '138 0000 1203', position: 'CEO', companyIndex: 2 },
  { name: '赵敏', email: 'zhao.min@lanhai.example.com', phone: '138 0000 1204', position: '市场经理', companyIndex: 3 },
  { name: '刘洋', email: 'liu.yang@youxuan.example.com', phone: '138 0000 1205', position: '运营总监', companyIndex: 4 },
  { name: '孙雅', email: 'sun.ya@jiguang.example.com', phone: '138 0000 1206', position: '产品经理', companyIndex: 5 },
  { name: '周涛', email: 'zhou.tao@hengxin.example.com', phone: '138 0000 1207', position: '信息化主管', companyIndex: 6 },
  { name: '吴彤', email: 'wu.tong@muxing.example.com', phone: '138 0000 1208', position: '创始人', companyIndex: 7 },
  { name: '何静', email: 'he.jing@xingyun.example.com', phone: '138 0000 1209', position: '财务经理', companyIndex: 0 },
  { name: '郑浩', email: 'zheng.hao@zhilian.example.com', phone: '138 0000 1210', position: '研发经理', companyIndex: 2 },
  { name: '马丽', email: 'ma.li@yuntu.example.com', phone: '138 0000 1211', position: '数据分析师', companyIndex: 1 },
  { name: '徐鹏', email: 'xu.peng@youxuan.example.com', phone: '138 0000 1212', position: 'CTO', companyIndex: 4 },
];

const DEALS: Array<{
  title: string;
  value: number;
  stage: number;
  contact: number;
  company: number;
  priority: 'low' | 'medium' | 'high';
  source: string;
  closeIn: number;
}> = [
  { title: 'CRM 系统年度授权', value: 128000, stage: 0, contact: 0, company: 0, priority: 'high', source: '官网咨询', closeIn: 24 },
  { title: '数据中台一期建设', value: 356000, stage: 1, contact: 1, company: 1, priority: 'high', source: '客户推荐', closeIn: 38 },
  { title: '智能客服解决方案', value: 89000, stage: 1, contact: 2, company: 2, priority: 'medium', source: '展会', closeIn: 20 },
  { title: '营销自动化平台', value: 66000, stage: 2, contact: 3, company: 3, priority: 'medium', source: '官网咨询', closeIn: 15 },
  { title: '会员运营系统升级', value: 175000, stage: 2, contact: 4, company: 4, priority: 'high', source: '客户推荐', closeIn: 30 },
  { title: '生产数据看板', value: 42000, stage: 2, contact: 5, company: 5, priority: 'low', source: '电话开发', closeIn: 45 },
  { title: '供应链协同平台', value: 268000, stage: 3, contact: 6, company: 6, priority: 'high', source: '招投标', closeIn: 18 },
  { title: '品牌素材管理系统', value: 38000, stage: 3, contact: 7, company: 7, priority: 'low', source: '官网咨询', closeIn: 12 },
  { title: '销售流程数字化咨询', value: 96000, stage: 3, contact: 8, company: 0, priority: 'medium', source: '客户推荐', closeIn: 9 },
  { title: '研发效能平台私有化', value: 310000, stage: 4, contact: 9, company: 2, priority: 'high', source: '招投标', closeIn: 7 },
  { title: '数据仓库年度运维', value: 145000, stage: 4, contact: 10, company: 1, priority: 'medium', source: '续约', closeIn: 5 },
  { title: '电商 CRM 深度集成', value: 210000, stage: 4, contact: 11, company: 4, priority: 'high', source: '客户推荐', closeIn: 14 },
  { title: '客户画像分析项目', value: 158000, stage: 5, contact: 1, company: 1, priority: 'high', source: '客户推荐', closeIn: -6 },
  { title: '工单系统集成', value: 72000, stage: 5, contact: 6, company: 6, priority: 'medium', source: '官网咨询', closeIn: -12 },
  { title: '营销短信通道接入', value: 24000, stage: 6, contact: 3, company: 3, priority: 'low', source: '电话开发', closeIn: -20 },
  { title: '旧版系统维护服务', value: 18000, stage: 6, contact: 5, company: 5, priority: 'low', source: '续约', closeIn: -30 },
];

const ACTIVITIES: Array<{
  type: 'call' | 'email' | 'meeting' | 'task' | 'deadline';
  subject: string;
  inDays: number;
  hour: number;
  done?: boolean;
  deal?: number;
  contact?: number;
  notes?: string;
}> = [
  { type: 'call', subject: '致电陈思远确认预算范围', inDays: -1, hour: 10, contact: 0, deal: 0 },
  { type: 'email', subject: '发送数据中台方案初稿', inDays: 0, hour: 9, contact: 1, deal: 1, notes: '重点说明与第二期系统的兼容性' },
  { type: 'meeting', subject: '与智联未来进行需求评审', inDays: 0, hour: 14, contact: 2, deal: 2, notes: '腾讯会议 14:00 - 15:30' },
  { type: 'task', subject: '整理供应链平台报价单', inDays: 0, hour: 17, contact: 6, deal: 6 },
  { type: 'deadline', subject: '研发效能平台投标截止', inDays: 1, hour: 18, contact: 9, deal: 9 },
  { type: 'call', subject: '回访优选电商用户反馈', inDays: 1, hour: 11, contact: 4, deal: 4 },
  { type: 'meeting', subject: '客户画像项目复盘会', inDays: 2, hour: 15, contact: 1, deal: 12 },
  { type: 'email', subject: '跟进续约合同审批进度', inDays: 3, hour: 10, contact: 10, deal: 10 },
  { type: 'task', subject: '准备木星设计产品演示', inDays: 4, hour: 16, contact: 7, deal: 7 },
  { type: 'call', subject: '电话确认工单集成验收时间', inDays: 5, hour: 13, contact: 6, deal: 13 },
  { type: 'email', subject: '发送季度服务报告', inDays: -2, hour: 12, done: true, contact: 0 },
  { type: 'task', subject: '更新销售漏斗数据', inDays: -1, hour: 16, done: true },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Pipeline) private readonly pipelines: Repository<Pipeline>,
    @InjectRepository(Stage) private readonly stages: Repository<Stage>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
    @InjectRepository(Deal) private readonly deals: Repository<Deal>,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
  ) {}

  async seed() {
    if ((await this.pipelines.count()) > 0) return;

    this.logger.log('首次启动，正在初始化演示数据...');

    const pipeline = await this.pipelines.save(this.pipelines.create({ name: '标准销售流程' }));
    const stageEntities: Stage[] = [];
    for (const [index, stage] of STAGES.entries()) {
      stageEntities.push(
        await this.stages.save(
          this.stages.create({ ...stage, position: index, pipelineId: pipeline.id }),
        ),
      );
    }

    const companyEntities: Company[] = [];
    for (const company of COMPANIES) {
      companyEntities.push(await this.companies.save(this.companies.create(company)));
    }

    const contactEntities: Contact[] = [];
    for (const contact of CONTACTS) {
      contactEntities.push(
        await this.contacts.save(
          this.contacts.create({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            position: contact.position,
            companyId: companyEntities[contact.companyIndex].id,
          }),
        ),
      );
    }

    const dealEntities: Deal[] = [];
    for (const [index, deal] of DEALS.entries()) {
      const stage = stageEntities[deal.stage];
      dealEntities.push(
        await this.deals.save(
          this.deals.create({
            title: deal.title,
            value: deal.value,
            currency: 'CNY',
            priority: deal.priority,
            source: deal.source,
            expectedCloseDate: this.dateIn(deal.closeIn),
            status: stage.probability >= 100 ? 'won' : stage.probability === 0 ? 'lost' : 'open',
            pipelineId: pipeline.id,
            stageId: stage.id,
            position: index,
            contactId: contactEntities[deal.contact].id,
            companyId: companyEntities[deal.company].id,
          }),
        ),
      );
    }

    for (const activity of ACTIVITIES) {
      const due = new Date();
      due.setDate(due.getDate() + activity.inDays);
      due.setHours(activity.hour, 0, 0, 0);
      await this.activities.save(
        this.activities.create({
          type: activity.type,
          subject: activity.subject,
          dueDate: due,
          done: activity.done ?? false,
          notes: activity.notes ?? null,
          dealId: activity.deal !== undefined ? dealEntities[activity.deal].id : null,
          contactId: activity.contact !== undefined ? contactEntities[activity.contact].id : null,
        }),
      );
    }

    this.logger.log('演示数据初始化完成。');
  }

  private dateIn(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Client,
  Communication,
  Document,
  Invoice,
  Matter,
  MatterParty,
  Note,
  Statute,
  Task,
  TimeEntry,
  User,
} from '../../../database/entities';
import {
  AdminAssistantDto,
  CaseAnalysisDto,
  ContractReviewDto,
  DraftDto,
  InsightDto,
  LegalResearchDto,
} from '../../../common/dto/legal-ai.dto';
import { CASE_BRIEFS, STATUTE_LIBRARY, StatuteEntry } from './statute-library';
import { PermissionsService } from '../../settings/permissions/permissions.service';

/** 本地规则统一声明：所有输出均为草稿，需人工核对，不做外部模型调用。 */
const RULE_META = {
  engine: 'local-rules',
  needsHumanReview: true,
  disclaimer: '本结果由本地规则基于本所真实业务数据生成，仅供辅助参考，必须由承办律师人工核对后使用；不构成正式法律意见。',
};

const DATE_RE = /(\d{4})\s*[年\-/.]\s*(\d{1,2})\s*[月\-/.]\s*(\d{1,2})\s*日?/g;

export interface TimelineItem {
  date: string;
  label: string;
  type: 'hearing' | 'deadline' | 'task' | 'fact' | 'filing';
  source: string;
  snippet: string;
}

interface ExtractedDate {
  raw: string;
  date: string;
  source: string;
  snippet: string;
  keyword: TimelineItem['type'] | null;
}

const TYPE_KEYWORDS: Array<{ re: RegExp; type: TimelineItem['type'] }> = [
  { re: /开庭|庭审|审理|法庭调查/, type: 'hearing' },
  { re: /举证|提交|截止|期限|上诉|保全|答辩|时效/, type: 'deadline' },
  { re: /立案|起诉|受理|递交/, type: 'filing' },
  { re: /会议|会谈|沟通|谈判/, type: 'task' },
];

function toDateString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeDate(y: string, m: string, d: string): string | null {
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function extractDates(text: string | null | undefined, source: string): ExtractedDate[] {
  if (!text) return [];
  const out: ExtractedDate[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(DATE_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    const iso = normalizeDate(match[1], match[2], match[3]);
    if (!iso) continue;
    const start = Math.max(0, match.index - 18);
    const end = Math.min(text.length, match.index + match[0].length + 18);
    const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
    const key = `${source}|${iso}|${snippet}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const keyword = TYPE_KEYWORDS.find((k) => k.re.test(snippet))?.type ?? null;
    out.push({ raw: match[0], date: iso, source, snippet, keyword });
  }
  return out;
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

@Injectable()
export class LegalAiService {
  constructor(
    @InjectRepository(Matter) private readonly matters: Repository<Matter>,
    @InjectRepository(Document) private readonly documents: Repository<Document>,
    @InjectRepository(Note) private readonly notes: Repository<Note>,
    @InjectRepository(MatterParty) private readonly parties: Repository<MatterParty>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(TimeEntry) private readonly timeEntries: Repository<TimeEntry>,
    @InjectRepository(Communication) private readonly communications: Repository<Communication>,
    @InjectRepository(Statute) private readonly statutes: Repository<Statute>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    private readonly permissions: PermissionsService,
  ) {}

  /** 统一校验 AI 使用权限；未传 actorId 的内部/脚本调用保持向后兼容。 */
  private assertAi(actorId?: number) {
    return this.permissions.assert(actorId ?? null, 'ai.use');
  }

  private async loadMatterContext(matterId: number) {
    const matter = await this.matters.findOne({
      where: { id: matterId },
      relations: ['client', 'stage', 'owner'],
    });
    if (!matter) return null;
    const [docs, notes, parties, tasks] = await Promise.all([
      this.documents.find({ where: { matterId }, order: { createdAt: 'DESC' } }),
      this.notes.find({ where: { targetType: 'matter', targetId: matterId }, order: { createdAt: 'DESC' } }),
      this.parties.find({ where: { matterId } }),
      this.tasks.find({ where: { matterId }, order: { dueDate: 'ASC' } }),
    ]);
    return { matter, docs, notes, parties, tasks };
  }

  // ------------------------------------------------------------------
  // 1. 案情与卷宗智能解析
  // ------------------------------------------------------------------
  async analyzeCase(dto: CaseAnalysisDto) {
    await this.assertAi(dto.actorId);
    const ctx = await this.loadMatterContext(dto.matterId);
    if (!ctx) {
      return { ...RULE_META, error: '案件不存在', evidenceCount: 0, timeline: [], relations: [], disputes: [], summary: '' };
    }
    const { matter, docs, notes, parties, tasks } = ctx;

    // 批量归集卷宗材料：文档正文 + 描述 + 内部事实备注 + 手工粘贴文本。
    const sources: Array<{ name: string; text: string }> = [];
    docs.forEach((d) => sources.push({ name: d.title, text: [d.description, d.content].filter(Boolean).join('\n') }));
    notes.forEach((n) => sources.push({ name: n.title || '案件备注', text: n.content }));
    if (dto.text?.trim()) sources.push({ name: '手工录入材料', text: dto.text.trim() });

    const corpus = sources.map((s) => s.text).join('\n');

    // 时间线：材料中的日期 + 案件的立案/结案日 + 案件任务期限。
    const timeline: TimelineItem[] = [];
    sources.forEach((s) => {
      extractDates(s.text, s.name).forEach((e) => {
        timeline.push({
          date: e.date,
          label: e.keyword ? `${this.typeLabel(e.keyword)}（材料提及）` : '案件事实节点',
          type: e.keyword ?? 'fact',
          source: s.name,
          snippet: e.snippet,
        });
      });
    });
    if (matter.openDate) {
      timeline.push({
        date: toDateString(matter.openDate)!,
        label: '案件立案',
        type: 'filing',
        source: '案件主档',
        snippet: `${matter.caseNumber ?? '—'} ${matter.title} 立案日期`,
      });
    }
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      timeline.push({
        date: toDateString(t.dueDate)!,
        label: t.title,
        type: this.taskTypeToTimeline(t.type),
        source: '案件任务',
        snippet: t.description || t.title,
      });
    });
    const sortedTimeline = uniqueBy(
      timeline.sort((a, b) => a.date.localeCompare(b.date)),
      (t) => `${t.date}|${t.label}|${t.source}`,
    );

    // 当事人关系图谱：当事人节点 + 委托方节点 + 关系边。
    const nodes: Array<{ id: string; label: string; role: string; kind: 'party' | 'client' }> = [
      ...parties.map((p) => ({ id: `party-${p.id}`, label: p.name, role: this.partyRoleLabel(p.role), kind: 'party' as const })),
    ];
    if (matter.client) {
      nodes.push({ id: `client-${matter.client.id}`, label: matter.client.name, role: '委托客户', kind: 'client' });
    }
    const links: Array<{ from: string; to: string; relation: string }> = [];
    const plaintiffs = parties.filter((p) => p.role === 'plaintiff');
    const defendants = parties.filter((p) => p.role === 'defendant');
    plaintiffs.forEach((a) =>
      defendants.forEach((b) => links.push({ from: `party-${a.id}`, to: `party-${b.id}`, relation: '争议相对方' })),
    );
    if (matter.client) {
      parties.forEach((p) =>
        links.push({ from: `client-${matter.client!.id}`, to: `party-${p.id}`, relation: '委托/代理关系' }),
      );
    }
    if (!nodes.length) {
      nodes.push({ id: 'no-party', label: '尚未登记当事人', role: '待补充', kind: 'party' });
    }

    // 核心争议焦点：材料关键词命中 + 业务领域常见争点，附命中来源。
    const disputeRules: Array<{ label: string; re: RegExp; basis: string }> = [
      { label: '合同是否成立及效力', re: /合同效力|成立|无效|撤销/, basis: '民法典合同编' },
      { label: '货物/工程是否已验收合格', re: /验收|质量|瑕疵|不合格/, basis: '在案验收与质量材料' },
      { label: '款项金额与逾期付款责任', re: /货款|欠款|逾期|付款|金额/, basis: '民法典 577/584 条' },
      { label: '诉讼时效是否届满或中断', re: /时效|诉讼时效|中断|催告/, basis: '民法典 188 条' },
      { label: '举证责任与证据充分性', re: /证据|举证|证明|清单/, basis: '民事诉讼法 67 条' },
      { label: '竞业限制范围与补偿支付', re: /竞业|补偿金|限制条款/, basis: '劳动合同法 82 条' },
      { label: '违约金是否过高及调整', re: /违约金|损害赔偿|损失/, basis: '民法典 584 条' },
    ];
    const disputes = disputeRules
      .filter((rule) => rule.re.test(corpus) || rule.re.test(matter.practiceArea) || rule.re.test(matter.title))
      .map((rule) => {
        const hit = sources.find((s) => rule.re.test(s.text));
        return {
          label: rule.label,
          basis: rule.basis,
          support: hit ? `${hit.name}：${hit.text.slice(0, 60).replace(/\s+/g, ' ')}` : '来自案件业务领域与案由推断，待补充证据',
        };
      });

    // 案件初筛摘要 + 证据缺口。
    const gaps: string[] = [];
    if (!docs.some((d) => d.category === 'evidence')) gaps.push('尚未归集证据清单或证据材料');
    if (!parties.some((p) => p.role === 'defendant')) gaps.push('被告/相对方主体信息待完善');
    if (!corpus.match(/时效|日期|20\d{2}/)) gaps.push('关键时间节点与时效起算点待核实');
    if (!corpus.match(/签字|盖章|签署/)) gaps.push('合同签署/盖章版本有待核验');

    const summary = [
      `【案件】${matter.title}（${matter.caseNumber ?? '暂无案号'}），案由/业务领域：${matter.practiceArea}，当前阶段：${matter.stage?.name ?? '—'}。`,
      `【材料】已归集卷宗材料 ${sources.length} 份（文档 ${docs.length}、备注 ${notes.length}），提取时间节点 ${sortedTimeline.length} 个，登记当事人 ${parties.length} 名。`,
      `【争点】初步识别核心争议焦点 ${disputes.length} 项：${disputes.map((d) => d.label).join('；') || '暂未识别，需补充卷宗材料'}。`,
      `【风险】${gaps.length ? '证据缺口：' + gaps.join('；') + '。' : '未发现明显证据缺口，仍需人工复核。'}`,
    ].join('\n');

    return {
      ...RULE_META,
      matterId: matter.id,
      matterTitle: matter.title,
      caseNumber: matter.caseNumber,
      evidenceCount: sources.length,
      documents: docs.map((d) => ({ id: d.id, title: d.title, category: d.category })),
      timeline: sortedTimeline,
      relations: { nodes, links },
      disputes,
      gaps,
      summary,
    };
  }

  private typeLabel(type: TimelineItem['type']): string {
    return { hearing: '开庭/庭审', deadline: '期限/截止', task: '会议/沟通', fact: '事实', filing: '立案/起诉' }[type];
  }

  private taskTypeToTimeline(type: string): TimelineItem['type'] {
    if (type === 'hearing' || type === 'court') return 'hearing';
    if (type === 'deadline') return 'deadline';
    if (type === 'reminder') return 'task';
    return 'fact';
  }

  private partyRoleLabel(role: string): string {
    return { plaintiff: '原告', defendant: '被告', third_party: '第三人', other: '其他主体' }[role] ?? '其他主体';
  }

  // ------------------------------------------------------------------
  // 2. 智能文书起草与审查
  // ------------------------------------------------------------------
  async draftDocument(dto: DraftDto) {
    await this.assertAi(dto.actorId);
    const ctx = await this.loadMatterContext(dto.matterId);
    if (!ctx) return { ...RULE_META, error: '案件不存在', sections: [], citations: [] };
    const { matter, docs, notes, parties, tasks } = ctx;

    const facts = await this.buildFactBullets(ctx);
    const clientName = matter.client?.name ?? '委托人';
    const ourSide = parties.find((p) => p.clientId === matter.clientId) ?? parties.find((p) => p.role === 'plaintiff');
    const opponent = parties.find((p) => p.role === 'defendant') ?? parties.find((p) => p.id !== ourSide?.id);
    const amounts = matter.value ? `${matter.value.toLocaleString('zh-CN')} 元` : '（请填写标的金额）';

    // 本所历史优秀范本（文档库中的模板类文档）作为文风与结构参考。
    const templates = docs.filter((d) => d.category === 'template' || d.category === 'pleading');
    const references = templates.length
      ? templates.map((d) => ({ id: d.id, title: d.title, version: d.version }))
      : [{ id: 0, title: '本所标准文书范本库（演示），正式使用请接入历史范本库', version: 'v1.0' }];

    const typeNames: Record<DraftDto['docType'], string> = {
      complaint: '民事起诉状',
      letter: '律师函',
      answer: '民事答辩状',
      opinion: '法律意见书',
    };
    const typeName = typeNames[dto.docType];
    // 起草立场为承办律师的明确指示，必须进入初稿并随全文导出，不得静默忽略。
    const stance = dto.stance?.trim() ?? '';

    const sections: Array<{ heading: string; content: string }> = [];
    if (dto.docType === 'complaint') {
      sections.push(
        { heading: '当事人', content: `原告：${clientName}。\n被告：${opponent?.name ?? '（请填写被告名称）'}。` },
        {
          heading: '诉讼请求',
          content: `1. 判令被告向原告支付${amounts}；\n2. 判令被告承担逾期付款/违约责任（详见事实与理由）；\n3. 本案诉讼费用由被告承担。`,
        },
        { heading: '事实与理由', content: facts.map((f, i) => `${i + 1}. ${f}`).join('\n') },
        { heading: '证据清单', content: docs.filter((d) => d.category === 'evidence').map((d) => d.title).join('、') || '（请补充证据清单）' },
      );
    } else if (dto.docType === 'letter') {
      sections.push(
        { heading: '致', content: `${opponent?.name ?? '（请填写收函方）'}：` },
        { heading: '事实概述', content: facts.slice(0, 4).map((f, i) => `${i + 1}. ${f}`).join('\n') },
        {
          heading: '我方要求',
          content: `请贵方于收到本函之日起七日内履行付款/整改义务（标的${amounts}），否则我方将依法采取诉讼、保全等措施。`,
        },
      );
    } else if (dto.docType === 'answer') {
      sections.push(
        { heading: '答辩人', content: `答辩人：${opponent?.name ?? '（请填写答辩人）'}。` },
        { heading: '答辩意见', content: facts.map((f, i) => `关于第${i + 1}项主张：${f}`).join('\n') },
        { heading: '抗辩要点', content: '1. 对方主张缺乏充分证据支持；\n2. 本案诉讼时效/验收事实需依法核实；\n3. 请求法院依法驳回对方全部或部分诉讼请求。' },
      );
    } else {
      sections.push(
        { heading: '委托事项', content: `就${matter.title}相关事宜，接受${clientName}委托出具本法律意见书。` },
        { heading: '事实基础', content: facts.map((f, i) => `${i + 1}. ${f}`).join('\n') },
        { heading: '法律分析', content: '结合现行民法典、民事诉讼法及在案材料，就合同效力、履行情况、举证责任与诉讼时效等问题分析如下（待补充详论）。' },
        { heading: '结论与建议', content: '建议在完善证据链条后尽早主张权利，并注意三年诉讼时效与财产保全时机。' },
      );
    }

    if (stance) {
      sections.push({ heading: '起草立场与特别要求', content: `承办律师指定：${stance}（本段由输入原样带入，请核对措辞后再使用）` });
    }

    const citationCodes = dto.docType === 'answer' ? ['民法典-188'] : ['民法典-509', '民法典-577', '民法典-584'];
    const citations = this.buildCitations(citationCodes);

    return {
      ...RULE_META,
      matterId: matter.id,
      docType: dto.docType,
      stance,
      title: `${clientName}·${typeName}（初稿）`,
      sections,
      fullText: sections.map((s) => `${s.heading}\n${s.content}`).join('\n\n'),
      references,
      citations,
      reviewChecklist: [
        '核对当事人全称、统一社会信用代码与送达地址',
        '核对诉讼请求金额、利息与计算方式',
        '补充并核对证据清单与证据编号',
        '由承办律师人工确认后方可对外发送或提交',
      ],
      pendingTasks: tasks.filter((t) => !t.done).slice(0, 5).map((t) => t.title),
      noteCount: notes.length,
      sourceCounts: { documents: docs.length, notes: notes.length, parties: parties.length },
    };
  }

  private async buildFactBullets(ctx: NonNullable<Awaited<ReturnType<LegalAiService['loadMatterContext']>>>): Promise<string[]> {
    const { matter, docs, notes, tasks } = ctx;
    const bullets: string[] = [];
    if (matter.description) bullets.push(matter.description.replace(/\s+/g, ' ').trim());
    docs.forEach((d) => {
      if (d.description) bullets.push(`${d.title}：${d.description.replace(/\s+/g, ' ').trim()}`);
    });
    notes.forEach((n) => bullets.push(`备注（${n.title || '案件事实'}）：${n.content.replace(/\s+/g, ' ').trim()}`));
    tasks.filter((t) => t.done).slice(0, 3).forEach((t) => bullets.push(`已办理事项：${t.title}`));
    return uniqueBy(bullets, (b) => b).slice(0, 12);
  }

  // ------------------------------------------------------------------
  // 3. 合同智能风控审查
  // ------------------------------------------------------------------
  async reviewContract(dto: ContractReviewDto) {
    await this.assertAi(dto.actorId);
    const document = dto.documentId
      ? await this.documents.findOne({ where: { id: dto.documentId } })
      : null;
    const sourceText =
      dto.text?.trim() ||
      document?.content ||
      document?.description ||
      [
        '第三条 付款方式：买方应在收到货物后三十日内支付全部价款。',
        '第七条 责任限制：卖方对任何间接损失不承担任何责任，责任总额不超过合同价款。',
        '第八条 单方解除：卖方有权随时解除本合同，无需承担任何责任。',
        '第十一条 争议解决：因本合同引起的争议由原告所在地法院管辖。',
      ].join('\n');
    const clauses = sourceText
      .split(/\n|(?=第[一二三四五六七八九十百]+条)/)
      .map((c) => c.trim())
      .filter(Boolean);

    interface RiskRule {
      label: string;
      re: RegExp;
      level: '高' | '中' | '低';
      category: string;
      statute: string;
      buyerAdvice: string;
      sellerAdvice: string;
      buyerReplace: string;
      sellerReplace: string;
    }
    const rules: RiskRule[] = [
      {
        label: '责任限制/免责条款过宽',
        re: /不承担任何责任|免除.*责任|概不负责|责任总额不超过/,
        level: '高',
        category: '责任分配',
        statute: '民法典-496',
        buyerAdvice: '限制卖方责任的格式条款未尽提示说明义务的，买方可主张其不成为合同内容。',
        sellerAdvice: '责任限制条款应以合理方式提示，并保留协商痕迹，避免被认定无效。',
        buyerReplace: '卖方因故意或重大过失造成买方损失的，应全额赔偿；责任限制条款不适用于人身损害及根本违约情形。',
        sellerReplace: '双方确认已就责任限制条款充分协商，卖方已尽合理提示说明义务，责任限额为合同价款的 100%。',
      },
      {
        label: '单方解除权不对等',
        re: /随时解除|单方解除|无需承担.*责任/,
        level: '高',
        category: '合同解除',
        statute: '民法典-577',
        buyerAdvice: '单方任意解除权严重失衡，建议改为双方协商一致或约定明确解除条件。',
        sellerAdvice: '保留解约权但需设置合理通知期与违约补偿，避免条款被认定显失公平。',
        buyerReplace: '任何一方解除合同应提前三十日书面通知对方；一方违约致合同目的不能实现的，守约方有权解除并主张赔偿。',
        sellerReplace: '卖方解除合同应提前三十日书面通知买方，并对买方已实际发生的合理支出予以补偿。',
      },
      {
        label: '管辖法院约定不利',
        re: /原告所在地|被告所在地|仲裁|管辖/,
        level: '中',
        category: '争议解决',
        statute: '民事诉讼法-67',
        buyerAdvice: '建议约定我方所在地或合同履行地法院管辖，降低维权成本。',
        sellerAdvice: '可争取约定卖方所在地法院或仲裁机构，注意约定明确可执行。',
        buyerReplace: '因本合同引起的争议，双方协商不成的，由买方所在地有管辖权的人民法院管辖。',
        sellerReplace: '因本合同引起的争议，提交卖方所在地有管辖权的人民法院诉讼解决。',
      },
      {
        label: '付款期限与逾期责任不明确',
        re: /付款|价款|货款|支付/,
        level: '中',
        category: '价款支付',
        statute: '民法典-584',
        buyerAdvice: '建议明确验收合格后付款节点及逾期违约金计算方式。',
        sellerAdvice: '建议约定分期付款与逾期付款违约金，明确所有权保留。',
        buyerReplace: '买方应在货物验收合格后三十日内付款；逾期付款的，按日万分之三支付违约金，总额不超过应付款项的 10%。',
        sellerReplace: '买方应于签约后支付 30% 预付款，余款于验收合格后十五日内付清，逾期按日万分之五支付违约金。',
      },
    ];

    const risks = clauses.flatMap((clause) =>
      rules
        .filter((rule) => rule.re.test(clause))
        .map((rule) => {
          const isBuyer = dto.stance === 'buyer';
          // 修订建议必须按我方立场选择；标准版仅作为可调整的措辞参考，强硬版为可直接采用的正式表述。
          const sideReplace = isBuyer ? rule.buyerReplace : rule.sellerReplace;
          const replacement = dto.toughness === 'strong'
            ? sideReplace
            : `${sideReplace}（标准版：以上为建议表述，金额、期限可结合谈判情况调整。）`;
          return {
            clause,
            label: rule.label,
            level: rule.level,
            category: rule.category,
            advice: isBuyer ? rule.buyerAdvice : rule.sellerAdvice,
            replacement,
            statute: this.buildCitations([rule.statute])[0],
          };
        }),
    );

    // 缺失条款检测。
    const requiredClauses: Array<{ label: string; re: RegExp; suggestion: string }> = [
      { label: '验收标准与方法', re: /验收/, suggestion: '建议增加：货物/服务应符合约定标准，买方应在收到后十日内完成验收并书面提出异议。' },
      { label: '违约责任', re: /违约|赔偿/, suggestion: '建议增加：一方违约应赔偿守约方因此遭受的全部损失，包括合理维权费用。' },
      { label: '保密条款', re: /保密/, suggestion: '建议增加：双方对履约中知悉的商业秘密承担保密义务，期限为合同终止后三年。' },
      { label: '不可抗力', re: /不可抗力/, suggestion: '建议增加：因不可抗力不能履约的，受影响方应及时通知并在合理期限内提供证明。' },
      { label: '通知与送达', re: /通知|送达/, suggestion: '建议增加：双方确认书面通知地址及电子邮箱，变更须提前书面告知。' },
      { label: '知识产权归属', re: /知识产权|著作权|归属/, suggestion: '建议增加：成果知识产权归属及使用许可范围应明确约定。' },
    ];
    const missing = requiredClauses
      .filter((c) => !c.re.test(sourceText))
      .map((c) => ({ label: c.label, suggestion: c.suggestion }));

    const levelOrder = { 高: 0, 中: 1, 低: 2 };
    risks.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    return {
      ...RULE_META,
      documentId: document?.id ?? null,
      documentTitle: document?.title ?? '粘贴的合同文本',
      stance: dto.stance,
      toughness: dto.toughness,
      stanceLabel: { buyer: '买方立场', seller: '卖方立场', neutral: '中立立场' }[dto.stance],
      clauseCount: clauses.length,
      risks,
      missing,
      summary: `共审查 ${clauses.length} 个条款，识别风险条款 ${risks.length} 项（高风险 ${risks.filter((r) => r.level === '高').length} 项），缺失条款 ${missing.length} 项。所有修订建议需人工比对原文后采用。`,
    };
  }

  // ------------------------------------------------------------------
  // 4. 法规与类案检索助手
  // ------------------------------------------------------------------
  buildCitations(codes: string[]) {
    return codes
      .map((code) => STATUTE_LIBRARY.find((s) => s.code === code))
      .filter((s): s is StatuteEntry => Boolean(s))
      .map((s) => ({
        code: s.code,
        title: s.title,
        article: s.article,
        text: s.text,
        status: s.status,
        effectiveFrom: s.effectiveFrom,
        source: s.source,
        verified: true,
        statusValid: s.status === '现行有效',
        statusNote: s.status === '现行有效' ? `自 ${s.effectiveFrom} 起施行，现行有效` : `状态为「${s.status}」，不得作为现行依据`,
      }));
  }

  async research(dto: LegalResearchDto) {
    await this.assertAi(dto.actorId);
    const q = dto.question.trim();
    const scored = STATUTE_LIBRARY.map((s) => {
      const score = s.topics.reduce((acc, topic) => acc + (q.includes(topic) ? topic.length : 0), 0)
        + (q.includes(s.title.replace('中华人民共和国', '')) ? 4 : 0)
        + (q.includes(s.article) ? 6 : 0);
      return { entry: s, score };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    const caseScores = CASE_BRIEFS.map((c) => ({
      entry: c,
      score: c.topics.reduce((acc, t) => acc + (q.includes(t) ? t.length : 0), 0),
    }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    const citations = this.buildCitations(scored.slice(0, 4).map((x) => x.entry.code));
    const validCitations = citations.filter((c) => c.statusValid);
    const invalidCitations = citations.filter((c) => !c.statusValid);

    // 反幻觉：结论只引用已校验条文的要旨与原文，不生成法条之外的内容。
    let conclusion: string;
    if (!scored.length) {
      conclusion = '本地权威法规库未检索到与问题直接匹配的可核验条文。为避免模型幻觉，本次不生成结论性引用；请调整关键词或补充官方法规数据后重试。';
    } else {
      const parts = validCitations.map((c) => {
        const entry = STATUTE_LIBRARY.find((s) => s.code === c.code)!;
        return `${entry.title}${entry.article}：${entry.outline}`;
      });
      conclusion = parts.length
        ? `依据已核验的现行有效条文：${parts.join(' ')}。以上结论均附法条原文与有效状态，未引用库外内容。`
        : '检索到的条文均非现行有效状态，不能作为结论依据；请核对法规有效性。';
    }

    // 挂载的案件法规提醒（真实业务数据，用于时效与期限提示）。
    const tracked = dto.matterId
      ? await this.statutes.find({ where: { matterId: dto.matterId }, order: { dueDate: 'ASC' } })
      : [];

    return {
      ...RULE_META,
      question: q,
      source: 'local-verified-statute-library',
      conclusion,
      citations,
      validCitations,
      invalidCitations,
      antiHallucination: '仅输出本地库中已校验条文；无匹配时明确拒绝生成结论，不编造法条。',
      caseBriefs: caseScores.slice(0, 4).map((x) => x.entry),
      trackedStatutes: tracked.map((s) => ({
        id: s.id,
        title: s.title,
        dueDate: toDateString(s.dueDate),
        status: s.status,
        note: s.note,
      })),
      disclaimer: RULE_META.disclaimer + ' 法条原文与有效状态来源于本地校验库，正式使用前请再次核对官方发布文本。',
    };
  }

  // ------------------------------------------------------------------
  // 5. 行政事务 AI 助手
  // ------------------------------------------------------------------
  async adminAssistant(dto: AdminAssistantDto) {
    await this.assertAi(dto.actorId);
    const days = dto.periodDays ?? 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const until = new Date();

    // 案件筛选必须贯穿周报全部数据源，不能只过滤工时，否则单案件周报会混入全所数据。
    const scopeWhere: Record<string, unknown> = dto.matterId ? { matterId: dto.matterId } : {};
    const [entries, completedTasks, outbound, tracked] = await Promise.all([
      this.timeEntries.find({ where: scopeWhere as any, order: { date: 'DESC' }, take: 50 }),
      this.tasks.find({ where: { done: true, ...scopeWhere } as any, order: { updatedAt: 'DESC' }, take: 30 }),
      this.communications.find({ where: { internal: false, ...scopeWhere } as any, order: { occurredAt: 'DESC' }, take: 30 }),
      this.statutes.find({ where: scopeWhere as any, order: { dueDate: 'ASC' }, take: 20 }),
    ]);

    const periodEntries = entries.filter((e) => new Date(e.date) >= since && new Date(e.date) <= until);
    const periodTasks = completedTasks.filter((t) => t.completedAt && new Date(t.completedAt) >= since);
    const periodComms = outbound.filter(
      (c) => c.direction === 'outbound' && new Date(c.occurredAt) >= since && c.type !== 'internal',
    );

    // 客户周报严格排除内部备注（internal=true / type=internal）与内部数据（工时费率、账单金额）。
    const progress = periodEntries.slice(0, 6).map((e) => e.description.replace(/\s+/g, ' ').trim());
    const doneItems = periodTasks.slice(0, 6).map((t) => t.title);
    const clientTouch = periodComms.slice(0, 4).map(
      (c) => `${c.subject ?? c.type}：${c.content.slice(0, 50).replace(/\s+/g, ' ')}`,
    );

    const matterFilter = (matterId: number | null) => !dto.matterId || matterId === dto.matterId;
    const reportLines = [
      '【本周工作进展】',
      ...(progress.length ? progress.map((p) => `· ${p}`) : ['· 本周暂无新增工作记录，如需补充请及时告知。']),
      '【已完成事项】',
      ...(doneItems.length ? doneItems.map((d) => `· ${d}`) : ['· 暂无已完成事项。']),
      '【客户沟通】',
      ...(clientTouch.length ? clientTouch.map((c) => `· ${c}`) : ['· 本周暂无对外沟通记录。']),
      '【下一步计划】',
      '· 继续推进在办事项，跟进待补充材料与证据。',
      '【需客户配合】',
      '· 请及时提供后续材料，并确认重要时间节点与送达信息。',
    ];
    const weeklyReport = reportLines.join('\n');

    // 到期日识别：案件任务期限 + 法规期限 + 材料中日期，形成日历提醒建议（draft 状态，人工确认后添加）。
    const soon = new Date();
    soon.setDate(soon.getDate() + 45);
    const reminders: Array<{ date: string; label: string; source: string; type: string }> = [];
    const allTasks = await this.tasks.find({ order: { dueDate: 'ASC' }, take: 100 });
    allTasks
      .filter((t) => t.dueDate && matterFilter(t.matterId) && !t.done && new Date(t.dueDate) <= soon)
      .forEach((t) =>
        reminders.push({ date: toDateString(t.dueDate)!, label: t.title, source: '案件任务', type: t.type }),
      );
    tracked
      .filter((s) => s.dueDate && (!dto.matterId || s.matterId === dto.matterId) && new Date(s.dueDate) <= soon)
      .forEach((s) =>
        reminders.push({ date: toDateString(s.dueDate)!, label: `时效/期限：${s.title}`, source: '法规期限', type: 'deadline' }),
      );
    reminders.sort((a, b) => a.date.localeCompare(b.date));

    const users = await this.users.find({ take: 5 });
    return {
      ...RULE_META,
      periodDays: days,
      weeklyReport,
      sourceCounts: { timeEntries: periodEntries.length, completedTasks: periodTasks.length, outbound: periodComms.length },
      // 明确声明周报不引用内部备注与财务费率。
      privacyNote: '客户周报已过滤全部内部备注（internal）、工时费率与账单金额；仅对外可见的工作进展。',
      reminders: uniqueBy(reminders, (r) => `${r.date}|${r.label}|${r.source}`),
      reminderNote: '以下为建议添加的日历提醒，均为草稿；需人工确认后才会创建任务/提醒。',
      ownerOptions: users.map((u) => ({ id: u.id, name: u.name })),
    };
  }

  // ------------------------------------------------------------------
  // 6. AI 洞察：经营趋势 / 待办优先级 / 风险提示 / 客户活跃度
  // ------------------------------------------------------------------
  async insights(dto: InsightDto) {
    await this.assertAi(dto.actorId);
    const days = dto.periodDays ?? 30;
    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const fromMs = nowMs - days * dayMs;
    const prevFromMs = nowMs - 2 * days * dayMs;
    const ts = (value: Date | string | null | undefined) => {
      if (!value) return null;
      const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
      return Number.isNaN(t) ? null : t;
    };
    const inRange = (value: Date | string | null | undefined, start: number, end: number) => {
      const t = ts(value);
      return t !== null && t >= start && t <= end;
    };
    const matterFilter = (matterId: number | null | undefined) => !dto.matterId || matterId === dto.matterId;
    const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
    const pct = (current: number, previous: number) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    };

    const [allMatters, allTime, allInvoices, allClients, allTasks, allComms] = await Promise.all([
      this.matters.find({ relations: ['client', 'stage', 'owner'] }),
      this.timeEntries.find({ relations: ['matter'] }),
      this.invoices.find({}),
      this.clients.find({}),
      this.tasks.find({ relations: ['matter'] }),
      this.communications.find({}),
    ]);

    // 趋势：本期 vs 上一周期，全部来自本所真实业务数据。
    const scopedTime = allTime.filter((t) => matterFilter(t.matterId));
    const scopedInvoices = allInvoices.filter((i) => matterFilter(i.matterId));
    const trendDefs = [
      { key: 'matters', label: '新增案件', unit: '件', detail: '按案件创建时间统计',
        current: allMatters.filter((m) => inRange(m.createdAt, fromMs, nowMs)).length,
        previous: allMatters.filter((m) => inRange(m.createdAt, prevFromMs, fromMs)).length },
      { key: 'hours', label: '记录工时', unit: '小时', detail: '按工时日期统计，保留两位小数',
        current: Math.round(sum(scopedTime.filter((t) => inRange(t.date, fromMs, nowMs)).map((t) => t.hours)) * 100) / 100,
        previous: Math.round(sum(scopedTime.filter((t) => inRange(t.date, prevFromMs, fromMs)).map((t) => t.hours)) * 100) / 100 },
      { key: 'invoiced', label: '开票金额', unit: '元', detail: '按账单开票日期统计',
        current: Math.round(sum(scopedInvoices.filter((i) => inRange(i.issueDate, fromMs, nowMs)).map((i) => i.total)) * 100) / 100,
        previous: Math.round(sum(scopedInvoices.filter((i) => inRange(i.issueDate, prevFromMs, fromMs)).map((i) => i.total)) * 100) / 100 },
      { key: 'clients', label: '新增客户', unit: '家', detail: '按客户创建时间统计',
        current: allClients.filter((c) => inRange(c.createdAt, fromMs, nowMs)).length,
        previous: allClients.filter((c) => inRange(c.createdAt, prevFromMs, fromMs)).length },
    ];
    const trends = trendDefs.map((t) => {
      const changePct = pct(t.current, t.previous);
      return {
        ...t,
        changePct,
        direction: (changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat') as 'up' | 'down' | 'flat',
      };
    });

    // 待办智能排序：优先级 + 期限类型 + 临近程度加权，规则透明可核对。
    const priorityScore: Record<string, number> = { high: 50, medium: 30, low: 10 };
    const priorities = allTasks
      .filter((t) => !t.done && matterFilter(t.matterId))
      .map((t) => {
        const due = ts(t.dueDate);
        const delta = due === null ? null : due - nowMs;
        const reasons: string[] = [`优先级：${t.priority}`];
        let score = priorityScore[t.priority] ?? 20;
        if (['deadline', 'hearing', 'court'].includes(t.type)) {
          score += 40;
          reasons.push('期限/庭审类事项');
        }
        if (delta !== null && delta < 0) {
          score += 60;
          reasons.push('已逾期');
        } else if (delta !== null && delta <= 7 * dayMs) {
          score += 30;
          reasons.push('7 日内到期');
        } else if (delta !== null && delta <= 30 * dayMs) {
          score += 10;
          reasons.push('30 日内到期');
        }
        return {
          id: t.id,
          title: t.title,
          type: t.type,
          priority: t.priority,
          dueDate: toDateString(t.dueDate),
          matterTitle: t.matter?.title ?? null,
          score,
          reason: reasons.join(' · '),
          route: ['deadline', 'hearing', 'court'].includes(t.type) ? '/tools/deadline' : '/tasks',
        };
      })
      .sort((a, b) => b.score - a.score || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
      .slice(0, 8);

    // 风险提示：与工作台同类规则，但补充客户活跃度与应收金额，均为草稿需人工核实。
    const cutoff24h = nowMs - dayMs;
    const unreplied = allComms.filter(
      (c) => c.direction === 'inbound' && !c.replied && !c.internal && matterFilter(c.matterId) && (ts(c.occurredAt) ?? Infinity) <= cutoff24h,
    );
    const followUp = allComms.filter((c) => c.needsFollowUp && !c.internal && matterFilter(c.matterId));
    const overdueInvoices = scopedInvoices.filter(
      (i) => !['paid', 'void'].includes(i.status) && (ts(i.dueDate) ?? Infinity) < nowMs,
    );
    const soonMs = nowMs + 7 * dayMs;
    const upcomingDeadlines = allTasks.filter(
      (t) => !t.done && ['deadline', 'hearing', 'court'].includes(t.type) && matterFilter(t.matterId)
        && (() => { const d = ts(t.dueDate); return d !== null && d >= nowMs && d <= soonMs; })(),
    );
    const inactiveClients = allClients.filter(
      (c) => c.status === 'active' && !allComms.some(
        (cm) => cm.clientId === c.id && !cm.internal && (ts(cm.occurredAt) ?? 0) >= nowMs - 60 * dayMs,
      ),
    );
    const unbilled = scopedTime.filter((t) => !t.invoiced && t.billable);

    const risks: Array<{ type: string; level: 'high' | 'medium' | 'low'; label: string; detail: string; count: number; route: string }> = [];
    if (unreplied.length) risks.push({ type: 'communication', level: 'high', label: `${unreplied.length} 条客户消息超过 24 小时未回复`, detail: unreplied[0].content.slice(0, 80), count: unreplied.length, route: '/communications' });
    if (followUp.length) risks.push({ type: 'communication', level: 'medium', label: `${followUp.length} 条沟通标记需跟进`, detail: '查看沟通中心需跟进会话，逐条确认处理', count: followUp.length, route: '/communications?followUp=true' });
    if (overdueInvoices.length) risks.push({ type: 'billing', level: 'high', label: `${overdueInvoices.length} 张账单已逾期`, detail: `逾期应收合计 ${sum(overdueInvoices.map((i) => Math.max(0, i.total - i.paidAmount))).toLocaleString('zh-CN')} 元`, count: overdueInvoices.length, route: '/billing?tab=invoices' });
    if (upcomingDeadlines.length) risks.push({ type: 'deadline', level: 'high', label: `${upcomingDeadlines.length} 项期限/庭审在未来 7 天内到期`, detail: upcomingDeadlines.slice(0, 3).map((t) => t.title).join('；'), count: upcomingDeadlines.length, route: '/tools/deadline' });
    if (inactiveClients.length) risks.push({ type: 'client', level: 'medium', label: `${inactiveClients.length} 位活跃客户近 60 天无对外沟通`, detail: inactiveClients.slice(0, 3).map((c) => c.name).join('、'), count: inactiveClients.length, route: '/clients' });
    if (unbilled.length) risks.push({ type: 'billing', level: 'low', label: `${sum(unbilled.map((t) => t.hours)).toFixed(1)} 小时可计费工时尚未开票`, detail: '及时核对并开票，避免漏计应收', count: unbilled.length, route: '/billing?tab=time' });

    // 客户活跃度：按最近一次对外沟通天数排序，识别沉默客户（不引用内部备注）。
    const clientActivity = allClients
      .filter((c) => c.status === 'active')
      .map((c) => {
        const times = allComms
          .filter((cm) => cm.clientId === c.id && !cm.internal)
          .map((cm) => ts(cm.occurredAt))
          .filter((t): t is number => t !== null);
        const last = times.length ? Math.max(...times) : null;
        const daysSince = last === null ? 999 : Math.floor((nowMs - last) / dayMs);
        const status = daysSince <= 14 ? '活跃' : daysSince <= 60 ? '需关注' : '沉默';
        return {
          clientId: c.id,
          name: c.name,
          lastContactDate: last === null ? null : toDateString(new Date(last)),
          daysSince,
          status,
          suggestion: status === '活跃' ? '保持常规跟进' : status === '需关注' ? '建议主动联系确认案件进展' : '建议安排回访，排查客户流失风险',
        };
      })
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 8);

    const highRisks = risks.filter((r) => r.level === 'high').length;
    const summary = [
      `【周期】近 ${days} 天（${toDateString(new Date(fromMs))} 至 ${toDateString(new Date(nowMs))}）${dto.matterId ? ' · 已限定单一案件' : ' · 全所口径'}。`,
      `【趋势】新增案件 ${trends[0].current} 件（环比 ${trends[0].changePct}%）、工时 ${trends[1].current} 小时（环比 ${trends[1].changePct}%）、开票 ${trends[2].current} 元（环比 ${trends[2].changePct}%）、新增客户 ${trends[3].current} 家。`,
      `【待办】按优先级与期限加权排序，首位：${priorities[0]?.title ?? '暂无未完成待办'}。`,
      `【风险】共 ${risks.length} 项提示，其中高风险 ${highRisks} 项；${inactiveClients.length} 位客户长期未联系需关注。`,
    ].join('\n');

    return {
      ...RULE_META,
      period: { days, from: toDateString(new Date(fromMs)), to: toDateString(new Date(nowMs)) },
      trends,
      priorities,
      risks,
      clientActivity,
      summary,
      rankingRule: '待办得分 = 优先级(高50/中30/低10) + 期限类事项40 + 逾期60 / 7日内30 / 30日内10；规则透明，需人工复核。',
      sourceCounts: { matters: allMatters.length, timeEntries: scopedTime.length, invoices: scopedInvoices.length, clients: allClients.length, tasks: priorities.length, communications: allComms.length },
    };
  }
}

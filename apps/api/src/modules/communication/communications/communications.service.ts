import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CrudService } from '../../../common/crud.service';
import { CommunicationQueryDto } from '../../../common/dto/special.dto';
import {
  Client,
  Communication,
  Matter,
  MatterTeamMember,
  MessageTemplate,
  Task,
  User,
} from '../../../database/entities';
import { PermissionsService } from '../../settings/permissions/permissions.service';

export interface InboxConversation {
  key: string;
  clientId: number | null;
  clientName: string | null;
  matterId: number | null;
  matterTitle: string | null;
  lastMessage: string;
  lastAt: Date;
  lastDirection: string;
  lastType: string;
  count: number;
  unread: number;
  needsFollowUp: number;
  unreplied: number;
  channels: string[];
}

@Injectable()
export class CommunicationsService extends CrudService<Communication> {
  constructor(
    @InjectRepository(Communication) repo: Repository<Communication>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(Matter) private readonly matters: Repository<Matter>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(MessageTemplate) private readonly templateRepo: Repository<MessageTemplate>,
    @InjectRepository(MatterTeamMember) private readonly team: Repository<MatterTeamMember>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    private readonly permissions: PermissionsService,
  ) {
    super(repo);
  }

  /** 新建沟通：仅案件团队成员可回复该案件客户消息；内部备注需具备对应权限。 */
  async create(dto: DeepPartial<Communication>) {
    const actorId = dto.userId ?? null;
    const isInternal = dto.internal === true || dto.type === 'internal';
    if (isInternal) {
      await this.permissions.assert(actorId, 'communication.internal');
    }
    if (dto.matterId && actorId) {
      const { permissions } = await this.permissions.forUser(actorId);
      const member = await this.team.findOne({ where: { matterId: dto.matterId, userId: actorId } });
      if (!permissions['matter.all'] && !member) {
        throw new ForbiddenException('仅案件团队成员可回复该案件的客户消息');
      }
      if (dto.internal && member && !member.canViewInternal) {
        throw new ForbiddenException('当前团队成员无权查看或添加内部备注');
      }
    }
    return super.create(dto);
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
    if (query.conversationKey !== undefined) {
      qb.andWhere('communication.conversationKey = :conversationKey', {
        conversationKey: query.conversationKey,
      });
    }
    if (query.search) {
      qb.andWhere(
        '(communication.content LIKE :search OR communication.subject LIKE :search OR communication.senderName LIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.unread !== undefined) {
      qb.andWhere('communication.unread = :unread', { unread: query.unread });
    }
    if (query.needsFollowUp !== undefined) {
      qb.andWhere('communication.needsFollowUp = :needsFollowUp', {
        needsFollowUp: query.needsFollowUp,
      });
    }
    if (query.internal !== undefined) {
      qb.andWhere('communication.internal = :internal', { internal: query.internal });
    }
    if (query.userId !== undefined) {
      qb.andWhere('communication.userId = :userId', { userId: query.userId });
    }
    if (query.unreplied) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      qb.andWhere('communication.direction = :direction', { direction: 'inbound' })
        .andWhere('communication.replied = :replied', { replied: false })
        .andWhere('communication.internal = :internal', { internal: false })
        .andWhere('communication.occurredAt <= :cutoff', { cutoff });
    }

    return qb
      .orderBy('communication.occurredAt', 'DESC')
      .addOrderBy('communication.createdAt', 'DESC')
      .getMany();
  }

  /** 按客户/案件聚合会话，供 M7 左侧会话列表使用。 */
  async inbox(): Promise<InboxConversation[]> {
    const [messages, clients, matters] = await Promise.all([
      this.repo.find({ order: { occurredAt: 'DESC' } }),
      this.clients.find(),
      this.matters.find(),
    ]);
    const clientMap = new Map(clients.map((client) => [client.id, client.name]));
    const matterMap = new Map(matters.map((matter) => [matter.id, matter.title]));
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const grouped = new Map<string, InboxConversation>();
    for (const message of messages) {
      const key =
        message.conversationKey ??
        (message.matterId
          ? `matter:${message.matterId}`
          : message.clientId
            ? `client:${message.clientId}`
            : `unassigned:${message.id}`);
      let conversation = grouped.get(key);
      if (!conversation) {
        conversation = {
          key,
          clientId: message.clientId,
          clientName: message.clientId ? clientMap.get(message.clientId) ?? null : null,
          matterId: message.matterId,
          matterTitle: message.matterId ? matterMap.get(message.matterId) ?? null : null,
          lastMessage: message.content,
          lastAt: message.occurredAt,
          lastDirection: message.direction,
          lastType: message.type,
          count: 0,
          unread: 0,
          needsFollowUp: 0,
          unreplied: 0,
          channels: [],
        };
        grouped.set(key, conversation);
      }
      conversation.count += 1;
      if (message.unread) conversation.unread += 1;
      if (message.needsFollowUp) conversation.needsFollowUp += 1;
      if (
        message.direction === 'inbound' &&
        !message.replied &&
        !message.internal &&
        new Date(message.occurredAt).getTime() <= cutoff
      ) {
        conversation.unreplied += 1;
      }
      if (!conversation.channels.includes(message.type)) conversation.channels.push(message.type);
    }

    return [...grouped.values()].sort(
      (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
    );
  }

  /** 无案件消息手动归档：更新消息的 matterId / clientId / conversationKey。 */
  async archive(id: number, matterId: number, clientId?: number) {
    const message = await this.findOrFail(id);
    message.matterId = matterId;
    if (clientId !== undefined) message.clientId = clientId;
    message.conversationKey = `matter:${matterId}`;
    return this.repo.save(message);
  }

  /** 将整个会话归档到案件（自动归档到案件）：批量更新该会话的全部消息。 */
  async archiveConversation(conversationKey: string, matterId: number, clientId?: number) {
    const patch: Partial<Communication> = {
      matterId,
      conversationKey: `matter:${matterId}`,
    };
    if (clientId !== undefined) patch.clientId = clientId;
    const result = await this.repo
      .createQueryBuilder()
      .update(Communication)
      .set(patch)
      .where('conversationKey = :conversationKey', { conversationKey })
      .execute();
    return { updated: result.affected ?? 0 };
  }

  async markRead(id: number) {
    const message = await this.findOrFail(id);
    message.unread = false;
    return this.repo.save(message);
  }

  async markReplied(id: number) {
    const message = await this.findOrFail(id);
    message.replied = true;
    message.unread = false;
    return this.repo.save(message);
  }

  async toggleFollowUp(id: number) {
    const message = await this.findOrFail(id);
    message.needsFollowUp = !message.needsFollowUp;
    return this.repo.save(message);
  }

  /**
   * AI 起草回复：按沟通意图匹配本所消息模板，并注入真实案件档案、近期对外沟通与
   * 未完成待办生成多段草稿。严格排除内部备注，输出仅为草稿，必须人工确认后才可发送。
   */
  async aiDraft(matterId?: number, intent?: string) {
    const topic = intent?.trim() || '案件进展';
    const matter = matterId
      ? await this.matters.findOne({ where: { id: matterId }, relations: ['client', 'stage', 'owner'] })
      : null;
    const scope: Record<string, unknown> = matterId ? { matterId } : {};

    const [recent, openTasks, templates] = await Promise.all([
      this.repo.find({ where: { ...scope, internal: false } as any, order: { occurredAt: 'DESC' }, take: 12 }),
      this.tasks.find({ where: { ...scope, done: false } as any, order: { dueDate: 'ASC' }, take: 6 }),
      this.templateRepo.find({ where: { enabled: true }, order: { id: 'ASC' } }),
    ]);

    const clientName = matter?.client?.name ?? '委托人';
    const contactName = matter?.client?.contactName;
    const caseLabel = matter
      ? `${matter.caseNumber ? `（${matter.caseNumber}）` : ''}${matter.title}`
      : '您委托本所办理的案件';

    // 根据意图关键词匹配本所模板；无匹配时回退到案件进展模板。
    const byCode = (code: string) => templates.find((t) => t.code === code);
    const pickBy = (pattern: RegExp, codes: string[]) =>
      pattern.test(topic) ? codes.map(byCode).find(Boolean) : undefined;
    const template =
      pickBy(/期限|截止|开庭|到期|时间/, ['deadline_reminder']) ??
      pickBy(/材料|补充|提供|证据|文件/, ['doc_request']) ??
      pickBy(/会议|会面|会谈|沟通时间/, ['meeting_notice']) ??
      pickBy(/账单|付款|费用|收款/, ['invoice_notice']) ??
      pickBy(/结案|办结|结束/, ['closing']) ??
      pickBy(/收到|确认|知悉/, ['ack']) ??
      byCode('progress');

    const dateOf = (value: Date | null | undefined) =>
      value ? new Date(value).toISOString().slice(0, 10) : '近期';
    const snippet = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').slice(0, 40);
    const inbound = recent.find((c) => c.direction === 'inbound' && !c.internal);
    const outboundHighlights = recent
      .filter((c) => c.direction === 'outbound' && !c.internal)
      .slice(0, 3)
      .map((c) => snippet(c.subject || c.content));
    const datedTasks = openTasks.filter((t) => t.dueDate).slice(0, 3);
    const nextLine = datedTasks.length
      ? datedTasks.map((t) => `${t.title}（${dateOf(t.dueDate)}）`).join('、')
      : '继续推进在办事项并同步材料清单';

    const fillTemplate = (raw: string) =>
      raw
        .replace(/\{案件名称\}/g, caseLabel)
        .replace(/\{进展说明\}/g, outboundHighlights.length ? outboundHighlights.join('；') : '正按既定计划推进，相关材料已归集')
        .replace(/\{下一步安排\}/g, nextLine)
        .replace(/\{材料清单\}/g, openTasks.length ? openTasks.slice(0, 3).map((t) => t.title).join('、') : '案件事实与证据材料')
        .replace(/\{时间\}/g, dateOf(datedTasks[0]?.dueDate))
        .replace(/\{日期\}/g, dateOf(datedTasks[0]?.dueDate))
        .replace(/\{所需事项\}/g, '相关证据材料与书面说明')
        .replace(/\{地点\}/g, '线上会议或本所会议室（待确认）')
        .replace(/\{账单编号\}/g, '（请填写账单编号）')
        .replace(/\{金额\}/g, '（请填写金额）')
        .replace(/\{到期日\}/g, '（请填写到期日）');

    const greeting = contactName ? `${contactName}，您好：` : `${clientName}，您好：`;
    const base = fillTemplate(template?.content ?? '您好，关于{案件名称}，目前进展为：{进展说明}。下一步我们将{下一步安排}。')
      .replace(/^您好[，,]?/, greeting);
    const paragraphs = [base];
    if (inbound) {
      paragraphs.push(`关于您此前提到的「${snippet(inbound.subject || inbound.content)}」，我们正在核实，将在确认后书面回复。`);
    }
    paragraphs.push(`后续我们将按以下计划推进：${nextLine}。如有新的材料或时间要求，请随时告知。`);
    paragraphs.push('本草稿由本地规则依据案件档案与近期对外沟通生成，仅为辅助参考；请主办律师逐项核对事实、期限与金额后方可发送，系统不会自动发送。');

    return {
      content: paragraphs.join('\n\n'),
      source: 'local-rules',
      needsHumanReview: true,
      template: template ? { code: template.code, name: template.name } : null,
      context: {
        matterTitle: matter?.title ?? null,
        caseNumber: matter?.caseNumber ?? null,
        clientName,
        stage: matter?.stage?.name ?? null,
        recentCommunications: recent.length,
        openTasks: openTasks.length,
        topic,
      },
      disclaimer: '草稿严格排除内部备注；所有时间、金额与事实需人工核对，确认后才可对外发送。',
    };
  }

  async templates() {
    return this.templateRepo.find({ order: { id: 'ASC' } });
  }

  async createTemplate(data: Partial<MessageTemplate>) {
    return this.templateRepo.save(this.templateRepo.create(data));
  }

  async updateTemplate(id: number, data: Partial<MessageTemplate>) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`消息模板 ${id} 不存在`);
    Object.assign(template, data);
    return this.templateRepo.save(template);
  }

  async removeTemplate(id: number) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`消息模板 ${id} 不存在`);
    await this.templateRepo.remove(template);
    return { id };
  }

  private async findOrFail(id: number) {
    const message = await this.repo.findOne({ where: { id } });
    if (!message) throw new NotFoundException(`沟通记录 ${id} 不存在`);
    return message;
  }
}

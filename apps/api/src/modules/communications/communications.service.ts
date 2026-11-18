import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { CommunicationQueryDto } from '../../common/dto/special.dto';
import {
  Client,
  Communication,
  Matter,
  MatterTeamMember,
  MessageTemplate,
  User,
} from '../../database/entities';
import { PermissionsService } from '../permissions/permissions.service';

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

  /** AI 起草回复：基于本地规则与案件信息生成草稿，必须由人工确认后才会发送。 */
  async aiDraft(matterId?: number, intent?: string) {
    let context = '案件';
    if (matterId) {
      const matter = await this.matters.findOne({ where: { id: matterId } });
      if (matter) context = `${matter.caseNumber} ${matter.title}`;
    }
    const topic = intent?.trim() || '案件进展';
    return {
      content:
        `您好，关于${context}（${topic}），目前我们正在按计划推进。` +
        `我们会持续跟进并将重要进展及时同步给您。如您有补充材料或疑问，可随时通过本渠道告知。`,
      source: 'local-rules',
      needsHumanReview: true,
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

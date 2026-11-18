import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 沟通渠道：对应 M7 统一收件箱的各来源。internal 为团队内部备注，不对外可见。 */
export const COMMUNICATION_TYPES = [
  'email',
  'sms',
  'call',
  'meeting',
  'message',
  'letter',
  'wechat',
  'whatsapp',
  'portal',
  'internal',
] as const;
export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

export const COMMUNICATION_DIRECTIONS = ['inbound', 'outbound'] as const;
export type CommunicationDirection = (typeof COMMUNICATION_DIRECTIONS)[number];

@Entity('communications')
export class Communication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @Column({ type: 'integer', nullable: true })
  clientId: number | null;

  @Column({ type: 'integer', nullable: true })
  contactId: number | null;

  @Column({ type: 'varchar' })
  type: CommunicationType;

  @Column({ type: 'varchar' })
  direction: CommunicationDirection;

  @Column({ type: 'varchar', nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'datetime' })
  occurredAt: Date;

  @Column({ type: 'integer', nullable: true })
  userId: number | null;

  /** 会话聚合键：按客户或案件聚合，同一会话的消息共享该键。 */
  @Column({ type: 'varchar', nullable: true })
  conversationKey: string | null;

  /** 发送方显示名（渠道侧的客户/律师姓名）。 */
  @Column({ type: 'varchar', nullable: true })
  senderName: string | null;

  /** 未读（客户发来的消息进入收件箱时为未读）。 */
  @Column({ default: false })
  unread: boolean;

  /** 是否已回复；超过 24 小时未回复的 inbound 消息进入预警。 */
  @Column({ default: false })
  replied: boolean;

  /** 需跟进标记：置位后同步进工作台待办。 */
  @Column({ default: false })
  needsFollowUp: boolean;

  /** 内部备注：严格不对外可见，与客户消息分开展示。 */
  @Column({ default: false })
  internal: boolean;

  /** AI 起草的回复：必须人工确认（approved）后才可发送。 */
  @Column({ default: false })
  aiDraft: boolean;

  @Column({ default: false })
  approved: boolean;

  /** 使用的消息模板 ID。 */
  @Column({ type: 'integer', nullable: true })
  templateId: number | null;

  /** 附件（文档/账单发送记录）。 */
  @Column({ type: 'simple-json', nullable: true })
  attachments: Array<{ name: string; kind: string; refId?: number }> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

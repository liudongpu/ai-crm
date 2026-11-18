import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const DRAFT_EVENT_STATUSES = ['draft', 'confirmed', 'dismissed'] as const;
export type DraftEventStatus = (typeof DRAFT_EVENT_STATUSES)[number];

@Entity('calendar_draft_events')
export class CalendarDraftEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: true })
  documentId: number | null;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @Column()
  sourceName: string;

  @Column({ type: 'text' })
  sourceSnippet: string;

  @Column({ type: 'datetime' })
  extractedDate: Date;

  @Column()
  keyword: string;

  @Column()
  title: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: DraftEventStatus;

  @Column({ type: 'integer', nullable: true })
  taskId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}

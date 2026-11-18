import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DeadlineItem } from '../../common/calendar-rules.util';

export const DEADLINE_STATUSES = ['draft', 'confirmed', 'archived'] as const;
export type DeadlineStatus = (typeof DEADLINE_STATUSES)[number];

@Entity('deadline_calculations')
export class DeadlineCalculation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'integer' })
  ruleId: number;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @Column({ type: 'integer', nullable: true })
  ownerId: number | null;

  @Column({ type: 'datetime' })
  triggerDate: Date;

  @Column({ type: 'varchar', default: 'draft' })
  status: DeadlineStatus;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'simple-json' })
  items: DeadlineItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

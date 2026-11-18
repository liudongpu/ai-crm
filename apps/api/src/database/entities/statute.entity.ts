import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const STATUTE_STATUSES = ['tracking', 'paused', 'completed'] as const;
export type StatuteStatus = (typeof STATUTE_STATUSES)[number];

@Entity('statutes')
export class Statute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @Column()
  title: string;

  @Column({ type: 'datetime' })
  causeDate: Date;

  @Column({ type: 'integer' })
  periodDays: number;

  @Column({ type: 'datetime' })
  dueDate: Date;

  @Column({ type: 'integer', default: 30 })
  alertDays: number;

  @Column({ type: 'varchar', default: 'tracking' })
  status: StatuteStatus;

  @Column({ type: 'integer', nullable: true })
  ownerId: number | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

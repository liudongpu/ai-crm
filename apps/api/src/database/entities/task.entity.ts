import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Matter } from './matter.entity';
import { User } from './user.entity';

export const TASK_TYPES = ['task', 'deadline', 'hearing', 'court', 'reminder'] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'varchar' })
  type: TaskType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'varchar', default: 'medium' })
  priority: TaskPriority;

  @Column({ default: false })
  done: boolean;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @Column({ type: 'integer', nullable: true })
  assigneeId: number | null;

  @ManyToOne(() => Matter, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'matterId' })
  matter: Matter | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User | null;

  @Column({ type: 'varchar', default: 'firm' })
  calendarId: string;

  @Column({ type: 'varchar', default: 'firm' })
  visibility: string;

  @Column({ type: 'datetime', nullable: true })
  startDate: Date | null;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date | null;

  @Column({ default: false })
  allDay: boolean;

  @Column({ type: 'integer', default: 60 })
  reminderMinutes: number;

  @Column({ type: 'varchar', nullable: true })
  sourceType: string | null;

  @Column({ type: 'integer', nullable: true })
  sourceId: number | null;

  @Column({ type: 'varchar', nullable: true })
  sourceDetail: string | null;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

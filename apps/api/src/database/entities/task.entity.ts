import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

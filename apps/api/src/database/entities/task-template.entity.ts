import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TASK_PRIORITIES, TASK_TYPES, TaskPriority, TaskType } from './task.entity';

/** 任务模板：小团队常用办案任务清单，可一键生成任务。 */
@Entity('task_templates')
export class TaskTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'general' })
  category: string;

  @Column()
  title: string;

  @Column({ type: 'varchar' })
  type: TaskType;

  @Column({ type: 'varchar', default: 'medium' })
  priority: TaskPriority;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** 相对天数：从案件启动日算起的建议截止天数。 */
  @Column({ type: 'integer', nullable: true })
  dueInDays: number | null;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

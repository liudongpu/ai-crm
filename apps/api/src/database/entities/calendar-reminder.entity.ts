import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Task } from './task.entity';

export const REMINDER_CHANNELS = ['in_app', 'email', 'sms'] as const;
export type ReminderChannel = (typeof REMINDER_CHANNELS)[number];

export const REMINDER_STATUSES = ['pending', 'sent', 'cancelled'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

@Entity('calendar_reminders')
export class CalendarReminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  taskId: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ type: 'varchar' })
  channel: ReminderChannel;

  @Column({ type: 'varchar', nullable: true })
  recipient: string | null;

  @Column({ type: 'integer' })
  leadMinutes: number;

  @Column({ type: 'datetime' })
  sendAt: Date;

  @Column({ type: 'varchar', default: 'pending' })
  status: ReminderStatus;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'datetime', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

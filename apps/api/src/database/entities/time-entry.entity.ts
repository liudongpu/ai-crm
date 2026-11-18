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
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity('time_entries')
export class TimeEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  matterId: number;

  @ManyToOne(() => Matter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matterId' })
  matter: Matter;

  @Column({ type: 'integer' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'integer', nullable: true })
  sourceTaskId: number | null;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sourceTaskId' })
  task: Task | null;

  @Column({ type: 'datetime' })
  date: Date;

  /** 计时器启动时间；非空表示计时中。 */
  @Column({ type: 'datetime', nullable: true })
  timerStartedAt: Date | null;

  @Column({ type: 'float' })
  hours: number;

  @Column()
  description: string;

  @Column({ default: true })
  billable: boolean;

  @Column({ type: 'float', default: 800 })
  rate: number;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ default: false })
  invoiced: boolean;

  @Column({ type: 'integer', nullable: true })
  invoiceId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

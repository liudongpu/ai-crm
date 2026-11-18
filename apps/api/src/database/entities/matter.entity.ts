import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { MatterStage } from './matter-stage.entity';
import { User } from './user.entity';

export const MATTER_STATUSES = ['open', 'on_hold', 'closed', 'won', 'lost'] as const;
export type MatterStatus = (typeof MATTER_STATUSES)[number];

export const MATTER_PRIORITIES = ['low', 'medium', 'high'] as const;
export type MatterPriority = (typeof MATTER_PRIORITIES)[number];

@Entity('matters')
export class Matter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'varchar', nullable: true })
  caseNumber: string | null;

  @Column({ type: 'integer' })
  clientId: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'integer' })
  stageId: number;

  @ManyToOne(() => MatterStage, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stageId' })
  stage: MatterStage;

  @Column({ type: 'varchar' })
  practiceArea: string;

  @Column({ type: 'varchar', default: 'open' })
  status: MatterStatus;

  @Column({ type: 'varchar', default: 'medium' })
  priority: MatterPriority;

  @Column({ type: 'integer', nullable: true })
  ownerId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerId' })
  owner: User | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  openDate: Date;

  @Column({ type: 'datetime', nullable: true })
  closeDate: Date | null;

  @Column({ type: 'float', default: 0 })
  value: number;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

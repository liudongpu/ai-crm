import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Activity } from './activity.entity';
import { Company } from './company.entity';
import { Contact } from './contact.entity';
import { Pipeline } from './pipeline.entity';
import { Stage } from './stage.entity';

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'float', default: 0 })
  value: number;

  @Column({ default: 'CNY' })
  currency: string;

  @Column({ default: 'medium' })
  priority: 'low' | 'medium' | 'high';

  @Column({ default: 'open' })
  status: 'open' | 'won' | 'lost';

  @Column({ type: 'varchar', nullable: true })
  source: string | null;

  @Column({ type: 'date', nullable: true })
  expectedCloseDate: string | null;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({ type: 'integer' })
  pipelineId: number;

  @ManyToOne(() => Pipeline, (pipeline) => pipeline.deals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pipelineId' })
  pipeline: Pipeline;

  @Column({ type: 'integer' })
  stageId: number;

  @ManyToOne(() => Stage, (stage) => stage.deals, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stageId' })
  stage: Stage;

  @Column({ type: 'integer', nullable: true })
  contactId: number | null;

  @ManyToOne(() => Contact, (contact) => contact.deals, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contactId' })
  contact: Contact | null;

  @Column({ type: 'integer', nullable: true })
  companyId: number | null;

  @ManyToOne(() => Company, (company) => company.deals, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'companyId' })
  company: Company | null;

  @OneToMany(() => Activity, (activity) => activity.deal)
  activities: Activity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

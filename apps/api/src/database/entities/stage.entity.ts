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
import { Deal } from './deal.entity';
import { Pipeline } from './pipeline.entity';

@Entity('stages')
export class Stage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 0 })
  position: number;

  @Column({ default: '#6366f1' })
  color: string;

  @Column({ default: 0 })
  probability: number;

  @Column({ type: 'integer' })
  pipelineId: number;

  @ManyToOne(() => Pipeline, (pipeline) => pipeline.stages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pipelineId' })
  pipeline: Pipeline;

  @OneToMany(() => Deal, (deal) => deal.stage)
  deals: Deal[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

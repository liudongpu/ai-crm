import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Deal } from './deal.entity';
import { Stage } from './stage.entity';

@Entity('pipelines')
export class Pipeline {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Stage, (stage) => stage.pipeline)
  stages: Stage[];

  @OneToMany(() => Deal, (deal) => deal.pipeline)
  deals: Deal[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

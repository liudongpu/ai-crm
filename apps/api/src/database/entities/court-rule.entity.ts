import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CourtRuleStep } from '../../common/calendar-rules.util';

@Entity('court_rules')
export class CourtRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'CN' })
  jurisdiction: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({ type: 'simple-json' })
  steps: CourtRuleStep[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

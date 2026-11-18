import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_RATINGS = ['hot', 'warm', 'cold'] as const;
export type LeadRating = (typeof LEAD_RATINGS)[number];

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  company: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  source: string | null;

  @Column({ type: 'varchar', nullable: true })
  practiceArea: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', default: 'new' })
  status: LeadStatus;

  @Column({ type: 'varchar', default: 'warm' })
  rating: LeadRating;

  @Column({ default: false })
  conflictChecked: boolean;

  @Column({ type: 'varchar', nullable: true })
  conflictResult: 'clear' | 'conflict' | null;

  @Column({ type: 'integer', nullable: true })
  ownerId: number | null;

  @Column({ type: 'integer', nullable: true })
  convertedClientId: number | null;

  @Column({ type: 'integer', nullable: true })
  convertedContactId: number | null;

  @Column({ type: 'integer', nullable: true })
  convertedMatterId: number | null;

  @Column({ type: 'datetime', nullable: true })
  convertedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

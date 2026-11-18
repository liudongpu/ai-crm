import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const FEATURE_RECORD_STATUSES = [
  'draft',
  'active',
  'pending',
  'completed',
  'archived',
] as const;
export type FeatureRecordStatus = (typeof FEATURE_RECORD_STATUSES)[number];

export const FEATURE_RECORD_PRIORITIES = ['low', 'medium', 'high'] as const;
export type FeatureRecordPriority = (typeof FEATURE_RECORD_PRIORITIES)[number];

@Entity('feature_records')
export class FeatureRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  featureCode: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', default: 'draft' })
  status: FeatureRecordStatus;

  @Column({ type: 'varchar', default: 'medium' })
  priority: FeatureRecordPriority;

  @Column({ type: 'integer', nullable: true })
  ownerId: number | null;

  @Column({ type: 'varchar', nullable: true })
  ownerName: string | null;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @Column({ type: 'integer', nullable: true })
  clientId: number | null;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'float', nullable: true })
  amount: number | null;

  @Column({ type: 'simple-json', nullable: true })
  data: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

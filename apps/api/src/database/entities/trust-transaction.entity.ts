import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const TRUST_TYPES = ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'refund'] as const;
export type TrustType = (typeof TRUST_TYPES)[number];

export const TRUST_CATEGORIES = ['retainer', 'earned_fee', 'refund', 'cost', 'other'] as const;
export type TrustCategory = (typeof TRUST_CATEGORIES)[number];

@Entity('trust_transactions')
export class TrustTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  clientId: number;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @Column({ type: 'varchar' })
  type: TrustType;

  @Column({ type: 'varchar' })
  category: TrustCategory;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  reference: string | null;

  @Column({ default: false })
  reconciled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

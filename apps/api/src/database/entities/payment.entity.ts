import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const PAYMENT_METHODS = ['card', 'bank', 'cash', 'check', 'etransfer'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  invoiceId: number;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'varchar' })
  method: PaymentMethod;

  @Column({ type: 'varchar', nullable: true })
  reference: string | null;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  type: 'time' | 'expense' | 'manual';
  referenceId?: number;
}

export const INVOICE_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'paid',
  'void',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  number: string;

  @Column({ type: 'integer' })
  clientId: number;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @Column({ type: 'varchar', default: 'draft' })
  status: InvoiceStatus;

  @Column({ type: 'datetime' })
  issueDate: Date;

  @Column({ type: 'datetime' })
  dueDate: Date;

  @Column({ type: 'float', default: 0 })
  subtotal: number;

  @Column({ type: 'float', default: 0.06 })
  taxRate: number;

  @Column({ type: 'float', default: 0 })
  tax: number;

  @Column({ type: 'float', default: 0 })
  total: number;

  @Column({ type: 'float', default: 0 })
  paidAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'simple-json', nullable: true })
  items: InvoiceItem[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

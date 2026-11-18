import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  matterId: number;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'varchar' })
  category: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ default: true })
  billable: boolean;

  @Column({ default: false })
  invoiced: boolean;

  @Column({ type: 'integer', nullable: true })
  invoiceId: number | null;

  @Column({ type: 'varchar', nullable: true })
  receipt: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

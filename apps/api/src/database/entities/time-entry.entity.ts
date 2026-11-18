import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('time_entries')
export class TimeEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  matterId: number;

  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'float' })
  hours: number;

  @Column()
  description: string;

  @Column({ default: true })
  billable: boolean;

  @Column({ type: 'float', default: 800 })
  rate: number;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ default: false })
  invoiced: boolean;

  @Column({ type: 'integer', nullable: true })
  invoiceId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

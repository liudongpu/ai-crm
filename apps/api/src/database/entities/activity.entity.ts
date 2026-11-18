import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Contact } from './contact.entity';
import { Deal } from './deal.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'simple-enum',
    enum: ['call', 'email', 'meeting', 'task', 'deadline'],
    default: 'task',
  })
  type: 'call' | 'email' | 'meeting' | 'task' | 'deadline';

  @Column()
  subject: string;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date | null;

  @Column({ default: false })
  done: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'integer', nullable: true })
  dealId: number | null;

  @ManyToOne(() => Deal, (deal) => deal.activities, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dealId' })
  deal: Deal | null;

  @Column({ type: 'integer', nullable: true })
  contactId: number | null;

  @ManyToOne(() => Contact, (contact) => contact.activities, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contactId' })
  contact: Contact | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export const CLIENT_TYPES = ['company', 'individual'] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const CLIENT_STATUSES = ['active', 'inactive', 'prospect'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'company' })
  type: ClientType;

  @Column({ type: 'varchar', nullable: true })
  industry: string | null;

  @Column({ type: 'varchar', nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  billingAddress: string | null;

  @Column({ type: 'varchar', default: 'active' })
  status: ClientStatus;

  @Column({ type: 'integer', nullable: true })
  ownerId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerId' })
  owner: User | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

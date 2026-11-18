import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Activity } from './activity.entity';
import { Company } from './company.entity';
import { Deal } from './deal.entity';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  position: string | null;

  @Column({ default: '销售团队' })
  owner: string;

  @Column({ type: 'integer', nullable: true })
  companyId: number | null;

  @ManyToOne(() => Company, (company) => company.contacts, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'companyId' })
  company: Company | null;

  @OneToMany(() => Deal, (deal) => deal.contact)
  deals: Deal[];

  @OneToMany(() => Activity, (activity) => activity.contact)
  activities: Activity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

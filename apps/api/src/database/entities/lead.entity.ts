import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  company: string;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({
    type: 'simple-enum',
    enum: ['new', 'working', 'qualified', 'converted', 'unqualified'],
    default: 'new',
  })
  status: 'new' | 'working' | 'qualified' | 'converted' | 'unqualified';

  @Column({ type: 'varchar', nullable: true })
  source: string | null;

  @Column({ type: 'simple-enum', enum: ['hot', 'warm', 'cold'], default: 'warm' })
  rating: 'hot' | 'warm' | 'cold';

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: '销售团队' })
  owner: string;

  @Column({ type: 'datetime', nullable: true })
  convertedAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  convertedContactId: number | null;

  @Column({ type: 'integer', nullable: true })
  convertedDealId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

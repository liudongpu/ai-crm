import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({
    type: 'simple-enum',
    enum: ['account', 'contact', 'lead', 'opportunity'],
  })
  targetType: 'account' | 'contact' | 'lead' | 'opportunity';

  @Column({ type: 'integer' })
  targetId: number;

  @Column({ default: '销售团队' })
  owner: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

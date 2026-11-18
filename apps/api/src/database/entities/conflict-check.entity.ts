import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const CONFLICT_TYPES = ['client', 'contact', 'matter', 'lead'] as const;
export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const CONFLICT_RESULTS = ['clear', 'potential', 'conflict'] as const;
export type ConflictResult = (typeof CONFLICT_RESULTS)[number];

@Entity('conflict_checks')
export class ConflictCheck {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: ConflictType;

  @Column({ type: 'varchar' })
  result: ConflictResult;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({ type: 'integer', nullable: true })
  checkedById: number | null;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

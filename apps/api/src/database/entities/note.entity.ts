import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const NOTE_TARGET_TYPES = ['matter', 'client', 'contact', 'lead', 'document'] as const;
export type NoteTargetType = (typeof NOTE_TARGET_TYPES)[number];

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar' })
  targetType: NoteTargetType;

  @Column({ type: 'integer' })
  targetId: number;

  @Column({ type: 'integer', nullable: true })
  authorId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const DOCUMENT_CATEGORIES = [
  'contract',
  'pleading',
  'evidence',
  'correspondence',
  'template',
  'other',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'varchar' })
  category: DocumentCategory;

  @Column({ type: 'varchar', nullable: true })
  fileName: string | null;

  @Column({ type: 'varchar', default: '1.0' })
  version: string;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @Column({ type: 'integer', nullable: true })
  clientId: number | null;

  @Column({ type: 'integer', nullable: true })
  uploadedById: number | null;

  @Column({ default: false })
  signed: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

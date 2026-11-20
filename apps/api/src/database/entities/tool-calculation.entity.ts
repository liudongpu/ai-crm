import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 律师工具箱计算结果：结构化保存输入与结果快照，关联案件后可追溯。 */
@Entity('tool_calculations')
export class ToolCalculation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  matterId: number;

  @Column({ type: 'varchar' })
  toolCode: string;

  @Column({ type: 'varchar' })
  toolName: string;

  @Column()
  title: string;

  @Column({ type: 'simple-json', nullable: true })
  input: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  result: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'integer', nullable: true })
  createdById: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * 可扩展工作台的业务记录。status 为各功能自定义状态值（中文），
 * 专属字段存放在 data（simple-json）中，由功能定义 schema 决定如何渲染。
 */
@Entity('workspace_items')
export class WorkspaceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  featureCode: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'varchar', default: '待处理' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  ownerName: string | null;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'float', nullable: true })
  amount: number | null;

  @Column({ type: 'simple-json', nullable: true })
  data: Record<string, string> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

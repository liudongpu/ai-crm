import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 配置型功能的本地开关/参数，按 (featureCode, key) 唯一。 */
@Entity('workspace_settings')
@Index(['featureCode', 'key'], { unique: true })
export class WorkspaceSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  featureCode: string;

  @Column({ type: 'varchar' })
  key: string;

  @Column({ type: 'varchar' })
  value: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

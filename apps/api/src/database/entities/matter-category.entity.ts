import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 案例分类的办理阶段（流程模板），按顺序展示。 */
export type MatterCategoryStage = {
  name: string;
  color: string;
  probability: number;
  isFinal: boolean;
};

/** 案件分类及其默认办理流程；分类名与案件的 practiceArea 对应。 */
@Entity('matter_categories')
export class MatterCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ default: '#1b365d' })
  color: string;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'simple-json' })
  stages: MatterCategoryStage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

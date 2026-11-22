import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 阶段内的任务：进入阶段后第几天到期，以及是否允许跳过。 */
export type MatterStageTask = {
  name: string;
  dueDay: number;
  skippable: boolean;
};

/** 案例分类的办理阶段（流程模板），按顺序展示。 */
export type MatterCategoryStage = {
  name: string;
  probability: number;
  isFinal: boolean;
  /** 该阶段预计停留天数。 */
  durationDays: number;
  tasks: MatterStageTask[];
};

/** 案件类型及其默认办理流程；类型名称写入案件的 practiceArea 字段。 */
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

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const MATTER_TEAM_ROLES = ['lead', 'associate', 'assistant', 'viewer'] as const;
export type MatterTeamRole = (typeof MATTER_TEAM_ROLES)[number];

/** 案件团队：主办 / 协办 / 助理；同时决定案件与会话的可见范围。 */
@Entity('matter_team_members')
export class MatterTeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  matterId: number;

  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'varchar', default: 'associate' })
  role: MatterTeamRole;

  /** 是否可查看内部备注（默认仅团队可查看）。 */
  @Column({ default: true })
  canViewInternal: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

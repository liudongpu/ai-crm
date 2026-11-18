import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export const PERMISSION_KEYS = [
  'dashboard.firm',
  'matter.all',
  'invoice.approve',
  'invoice.send',
  'finance.manage',
  'communication.internal',
  'user.manage',
  'ai.use',
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  'dashboard.firm': '查看全所经营报表',
  'matter.all': '查看全部案件',
  'invoice.approve': '审批账单',
  'invoice.send': '发送账单',
  'finance.manage': '收款 / 对账 / 信托',
  'communication.internal': '查看内部备注',
  'user.manage': '管理用户与角色',
  'ai.use': '使用法律 AI 辅助',
};

/** 角色权限矩阵：按角色配置能力，前端演示通过当前用户身份传递 actorId。 */
@Entity('role_permissions')
@Index(['role', 'permission'], { unique: true })
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  role: string;

  @Column()
  permission: string;

  @Column({ default: true })
  enabled: boolean;
}

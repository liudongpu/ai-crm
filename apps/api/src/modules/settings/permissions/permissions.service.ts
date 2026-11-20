import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionKey, RolePermission, User } from '../../../database/entities';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(RolePermission) private readonly repo: Repository<RolePermission>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  list() {
    return this.repo.find({ order: { role: 'ASC', id: 'ASC' } });
  }

  async update(id: number, enabled: boolean) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`权限配置 ${id} 不存在`);
    row.enabled = enabled;
    return this.repo.save(row);
  }

  async forUser(userId?: number | null) {
    if (!userId) return { role: null as string | null, permissions: {} as Record<string, boolean> };
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return { role: null as string | null, permissions: {} as Record<string, boolean> };
    const rows = await this.repo.find({ where: { role: user.role } });
    return {
      role: user.role,
      permissions: Object.fromEntries(rows.map((row) => [row.permission, row.enabled])),
    };
  }

  /** 校验当前用户是否具备权限；未传 userId 时保持向后兼容（仅用于内部服务调用）。 */
  async assert(userId: number | null | undefined, permission: PermissionKey) {
    if (!userId) return;
    const { permissions } = await this.forUser(userId);
    if (permission in permissions && !permissions[permission]) {
      throw new ForbiddenException(`当前角色无权执行：${permission}`);
    }
  }
}

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/common/PageHeader';
import { useMyPermissions, usePermissions, useUpdatePermission, useUsers } from '@/hooks/useCrm';
import { userRoleMeta } from '@/lib/meta';
import type { UserRole } from '@/types';

const permissionOrder = [
  { key: 'dashboard.firm', label: '查看全所经营报表' },
  { key: 'matter.all', label: '查看全部案件' },
  { key: 'invoice.approve', label: '审批账单' },
  { key: 'invoice.send', label: '发送账单' },
  { key: 'finance.manage', label: '收款 / 对账 / 信托' },
  { key: 'communication.internal', label: '查看内部备注' },
  { key: 'user.manage', label: '管理用户与角色' },
  { key: 'ai.use', label: '使用法律 AI 辅助' },
];
const permissionRoles = Object.keys(userRoleMeta) as UserRole[];

export function SettingsPermissionsPage() {
  const { data: users } = useUsers();
  const { data: permissions } = usePermissions();
  const { data: myPermissions } = useMyPermissions(users?.[0]?.id);
  const updatePermission = useUpdatePermission();

  return (
    <Box>
      <PageHeader title="角色权限" subtitle="角色权限矩阵与案件级可见范围，配置持久化到当前演示库。" />
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            角色权限决定可见范围与可执行操作：律师生成账单草稿后需合伙人审批；只有案件团队成员可查看并回复该案件会话。
            当前演示环境未接入登录，前端以第一位用户身份发起请求：角色「{myPermissions?.role ?? '未知'}」，AI 辅助权限{myPermissions?.permissions?.['ai.use'] === false ? '未开放' : '已开放'}。
          </Typography>
          {permissions && permissions.length < permissionRoles.length * permissionOrder.length && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 2 }}>
              部分权限配置行缺失，已禁用的勾选项无法修改；请重新初始化演示数据后重试。
            </Typography>
          )}
          <Paper>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>权限</TableCell>
                    {permissionRoles.map((role) => <TableCell key={role} align="center">{userRoleMeta[role]}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissionOrder.map((item) => (
                    <TableRow key={item.key} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{item.label}</TableCell>
                      {permissionRoles.map((role) => {
                        const config = permissions?.find((row) => row.role === role && row.permission === item.key);
                        return (
                          <TableCell key={role} align="center">
                            <Checkbox
                              size="small"
                              checked={config?.enabled ?? false}
                              disabled={!config}
                              onChange={(event) => {
                                if (config) updatePermission.mutate({ id: config.id, enabled: event.target.checked });
                              }}
                              inputProps={{ 'aria-label': `${userRoleMeta[role]} - ${item.label}` }}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
}

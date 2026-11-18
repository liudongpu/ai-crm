import { useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import {
  useCreateUser,
  useDeleteUser,
  useMatterStages,
  usePermissions,
  useUpdatePermission,
  useUpdateUser,
  useUsers,
} from '@/hooks/useCrm';
import { formatDate } from '@/lib/format';
import { userRoleMeta } from '@/lib/meta';
import type { User, UserInput, UserRole } from '@/types';

type FormState = { name: string; email: string; role: UserRole; title: string; active: boolean };
const emptyForm: FormState = { name: '', email: '', role: 'associate', title: '', active: true };

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

export function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { data: users, isLoading, isError, error, refetch } = useUsers();
  const { data: stages, isLoading: stagesLoading } = useMatterStages();
  const { data: permissions } = usePermissions();
  const updatePermission = useUpdatePermission();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  useEffect(() => {
    if (!formOpen) return;
    setForm({
      name: editing?.name ?? '',
      email: editing?.email ?? '',
      role: editing?.role ?? 'associate',
      title: editing?.title ?? '',
      active: editing?.active ?? true,
    });
  }, [formOpen, editing]);

  const submit = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const payload: UserInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      title: form.title.trim() || null,
      active: form.active,
    };
    if (editing) updateUser.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    else createUser.mutate(payload, { onSuccess: () => setFormOpen(false) });
  };

  return (
    <Box>
      <PageHeader title="系统设置" subtitle="用户、角色权限与案件阶段配置" />
      <Card>
        <Tabs value={tab} onChange={(_, value: number) => setTab(value)} sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tab label="用户与角色" />
          <Tab label="角色权限" />
          <Tab label="案件阶段" />
        </Tabs>
        <CardContent sx={{ p: 2 }}>
          {tab === 0 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">共 {users?.length ?? 0} 位成员</Typography>
                <Button variant="outlined" size="small" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setForm(emptyForm); setFormOpen(true); }}>新建用户</Button>
              </Stack>
              <Paper>
                {isError && <ErrorState message={error?.message ?? '用户列表加载失败'} onRetry={() => void refetch()} />}
                {isLoading && <LoadingRows columns={7} />}
                {!isLoading && !isError && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>姓名</TableCell>
                          <TableCell>邮箱</TableCell>
                          <TableCell>角色</TableCell>
                          <TableCell>职位</TableCell>
                          <TableCell>状态</TableCell>
                          <TableCell>创建时间</TableCell>
                          <TableCell align="right">操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(users ?? []).map((user) => (
                          <TableRow key={user.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell><Chip size="small" variant="outlined" label={userRoleMeta[user.role] ?? user.role} /></TableCell>
                            <TableCell>{user.title ?? '—'}</TableCell>
                            <TableCell>
                              <Chip size="small" label={user.active ? '在职' : '停用'} color={user.active ? 'success' : 'default'} variant="outlined" />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(user.createdAt)}</TableCell>
                            <TableCell align="right">
                              <Button size="small" startIcon={<EditOutlined />} onClick={() => { setEditing(user); setFormOpen(true); }}>编辑</Button>
                              <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmId(user.id)}>删除</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!isLoading && (users ?? []).length === 0 && <EmptyRow columns={7} text="暂无用户" />}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                角色权限决定可见范围与可执行操作：律师生成账单草稿后需合伙人审批；只有案件团队成员可查看并回复该案件会话。
                当前演示环境未接入登录，前端以第一位用户身份发起请求。
              </Typography>
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
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                案件阶段为系统预置数据，供看板与流程使用，此处仅供查看。
              </Typography>
              <Paper>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>顺序</TableCell>
                        <TableCell>阶段名称</TableCell>
                        <TableCell>颜色</TableCell>
                        <TableCell align="right">成交概率</TableCell>
                        <TableCell>结案阶段</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(stages ?? []).map((stage) => (
                        <TableRow key={stage.id} hover>
                          <TableCell>{stage.position}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{stage.name}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: stage.color, border: '1px solid', borderColor: 'divider' }} />
                              <Typography variant="caption" color="text.secondary">{stage.color}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">{stage.probability}%</TableCell>
                          <TableCell>
                            <Chip size="small" label={stage.isFinal ? '是' : '否'} color={stage.isFinal ? 'primary' : 'default'} variant="outlined" />
                          </TableCell>
                        </TableRow>
                      ))}
                      {!stagesLoading && (stages ?? []).length === 0 && <EmptyRow columns={5} text="暂无案件阶段" />}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? '编辑用户' : '新建用户'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="姓名 *" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth autoFocus />
          <TextField label="邮箱 *" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="user-role">角色</InputLabel>
            <Select labelId="user-role" label="角色" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
              {(Object.keys(userRoleMeta) as UserRole[]).map((key) => <MenuItem key={key} value={key}>{userRoleMeta[key]}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="职位" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="user-active">状态</InputLabel>
            <Select labelId="user-active" label="状态" value={form.active ? 'yes' : 'no'} onChange={(event) => setForm({ ...form, active: event.target.value === 'yes' })}>
              <MenuItem value="yes">在职</MenuItem>
              <MenuItem value="no">停用</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name.trim() || !form.email.trim() || createUser.isPending || updateUser.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除用户"
        message="确定删除该用户吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteUser.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
    </Box>
  );
}

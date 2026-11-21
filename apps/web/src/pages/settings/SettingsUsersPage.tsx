import { useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '@/hooks/useCrm';
import { formatDate } from '@/lib/format';
import { userRoleMeta } from '@/lib/meta';
import type { User, UserInput, UserRole } from '@/types';

type FormState = { name: string; email: string; role: UserRole; title: string; active: boolean };
const emptyForm: FormState = { name: '', email: '', role: 'associate', title: '', active: true };

export function SettingsUsersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { data: users, isLoading, isError, error, refetch } = useUsers();
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
      <PageHeader title="人员与角色" subtitle="员工档案、律师档案与角色管理；角色决定权限矩阵中的可见范围与可执行操作。" />
      <Card>
        <CardContent sx={{ p: 2 }}>
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

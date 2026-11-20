import { useState } from 'react';
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
import { format } from 'date-fns';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import {
  useCreateStatute,
  useDeleteStatute,
  useMatters,
  useStatutes,
  useUpdateStatute,
  useUsers,
} from '@/hooks/useCrm';
import { formatDate, toDateInput } from '@/lib/format';
import type { Statute, StatuteInput, StatuteStatus } from '@/types';

const statusMeta: Record<StatuteStatus, { label: string; color: 'info' | 'warning' | 'success' | 'default' }> = {
  tracking: { label: '跟踪中', color: 'info' },
  paused: { label: '已暂停', color: 'warning' },
  completed: { label: '已完成', color: 'success' },
};

type FormState = {
  title: string;
  matterId: string;
  causeDate: string;
  periodDays: string;
  alertDays: string;
  status: StatuteStatus;
  ownerId: string;
  note: string;
};

const emptyForm = (): FormState => ({
  title: '',
  matterId: '',
  causeDate: format(new Date(), 'yyyy-MM-dd'),
  periodDays: '3',
  alertDays: '30',
  status: 'tracking',
  ownerId: '',
  note: '',
});

const isoFromDate = (value: string) => new Date(`${value}T00:00:00`).toISOString();

export function StatutesPage() {
  const [status, setStatus] = useState('all');
  const [matterId, setMatterId] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Statute | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: statutes, isLoading, isError, error, refetch } = useStatutes({
    status: status === 'all' ? undefined : status,
    matterId: matterId || undefined,
    search: search.trim() || undefined,
  });
  const { data: matters } = useMatters();
  const { data: users } = useUsers();
  const createStatute = useCreateStatute();
  const updateStatute = useUpdateStatute();
  const deleteStatute = useDeleteStatute();

  const rows = statutes ?? [];
  const stats = {
    tracking: rows.filter((item) => item.status === 'tracking').length,
    soon: rows.filter((item) => item.status === 'tracking' && (item.daysLeft ?? 0) >= 0 && (item.daysLeft ?? 0) <= 30).length,
    overdue: rows.filter((item) => item.status === 'tracking' && (item.daysLeft ?? 0) < 0).length,
    completed: rows.filter((item) => item.status === 'completed').length,
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (item: Statute) => {
    setEditing(item);
    setForm({
      title: item.title,
      matterId: String(item.matterId ?? ''),
      causeDate: toDateInput(item.causeDate),
      periodDays: String(item.periodDays),
      alertDays: String(item.alertDays),
      status: item.status,
      ownerId: String(item.ownerId ?? ''),
      note: item.note ?? '',
    });
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.title.trim() || !form.causeDate || !form.periodDays) return;
    const payload: StatuteInput = {
      title: form.title.trim(),
      matterId: form.matterId ? Number(form.matterId) : null,
      causeDate: isoFromDate(form.causeDate),
      periodDays: Number(form.periodDays),
      alertDays: Number(form.alertDays) || 30,
      status: form.status,
      ownerId: form.ownerId ? Number(form.ownerId) : null,
      note: form.note.trim() || null,
    };
    if (editing) {
      updateStatute.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createStatute.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  const daysChip = (item: Statute) => {
    const days = item.daysLeft ?? 0;
    if (item.status === 'completed') return <Chip size="small" variant="outlined" label="已完成" />;
    if (days < 0) return <Chip size="small" color="error" label={`逾期 ${Math.abs(days)} 天`} />;
    if (days <= (item.alertDays ?? 30)) return <Chip size="small" color="warning" label={`剩余 ${days} 天`} />;
    return <Chip size="small" color="success" variant="outlined" label={`剩余 ${days} 天`} />;
  };

  return (
    <Box>
      <PageHeader
        title="时效管理"
        subtitle="按起算日与法定期间自动计算到期日，并对临近和逾期时效进行预警"
        actions={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>新建时效</Button>
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mt: 2 }}>
          {[
            { label: '跟踪中', value: stats.tracking, color: 'primary.main' },
            { label: '30 天内到期', value: stats.soon, color: 'warning.main' },
            { label: '已逾期', value: stats.overdue, color: 'error.main' },
            { label: '已完成', value: stats.completed, color: 'success.main' },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="h5" sx={{ color: item.color, fontWeight: 700 }}>{item.value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </PageHeader>

      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              placeholder="搜索时效标题或备注"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ width: 240 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="statute-status-filter">状态</InputLabel>
              <Select labelId="statute-status-filter" label="状态" value={status} onChange={(event) => setStatus(event.target.value)}>
                <MenuItem value="all">全部</MenuItem>
                {(Object.keys(statusMeta) as StatuteStatus[]).map((key) => (
                  <MenuItem key={key} value={key}>{statusMeta[key].label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="statute-matter-filter">案件</InputLabel>
              <Select labelId="statute-matter-filter" label="案件" value={matterId} onChange={(event) => setMatterId(event.target.value)}>
                <MenuItem value="">全部案件</MenuItem>
                {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          {isError && <ErrorState message={error?.message ?? '时效记录加载失败'} onRetry={() => void refetch()} />}
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>标题</TableCell>
                    <TableCell>案件</TableCell>
                    <TableCell>起算日</TableCell>
                    <TableCell align="right">期间（天）</TableCell>
                    <TableCell>到期日</TableCell>
                    <TableCell>预警</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>负责人</TableCell>
                    <TableCell>备注</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading && <LoadingRows columns={10} />}
                  {!isLoading && rows.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{item.title}</TableCell>
                      <TableCell>{matters?.find((matter) => matter.id === item.matterId)?.title ?? '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(item.causeDate)}</TableCell>
                      <TableCell align="right">{item.periodDays}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(item.dueDate)}</TableCell>
                      <TableCell>{daysChip(item)}</TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" color={statusMeta[item.status]?.color ?? 'default'} label={statusMeta[item.status]?.label ?? item.status} />
                      </TableCell>
                      <TableCell>{users?.find((user) => user.id === item.ownerId)?.name ?? '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 180 }}><Typography variant="caption" color="text.secondary" noWrap display="block">{item.note ?? '—'}</Typography></TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<EditOutlined />} onClick={() => openEdit(item)}>编辑</Button>
                        <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmId(item.id)}>删除</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && !isError && rows.length === 0 && <EmptyRow columns={10} text="暂无符合条件的时效记录" />}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑时效记录' : '新建时效记录'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField size="small" label="标题 *" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="statute-matter">关联案件</InputLabel>
              <Select labelId="statute-matter" label="关联案件" value={form.matterId} onChange={(event) => setForm({ ...form, matterId: event.target.value })}>
                <MenuItem value="">不关联</MenuItem>
                {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="起算日 *"
              type="date"
              value={form.causeDate}
              onChange={(event) => setForm({ ...form, causeDate: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField size="small" label="期间天数 *" type="number" value={form.periodDays} onChange={(event) => setForm({ ...form, periodDays: event.target.value })} fullWidth />
            <TextField size="small" label="预警天数" type="number" value={form.alertDays} onChange={(event) => setForm({ ...form, alertDays: event.target.value })} fullWidth />
            <FormControl fullWidth size="small">
              <InputLabel id="statute-status">状态</InputLabel>
              <Select labelId="statute-status" label="状态" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StatuteStatus })}>
                {(Object.keys(statusMeta) as StatuteStatus[]).map((key) => (
                  <MenuItem key={key} value={key}>{statusMeta[key].label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="statute-owner">负责人</InputLabel>
              <Select labelId="statute-owner" label="负责人" value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}>
                <MenuItem value="">未指派</MenuItem>
                {(users ?? []).map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField size="small" label="备注" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} multiline minRows={2} fullWidth />
          <Typography variant="caption" color="text.secondary">到期日由后端按“起算日 + 期间天数”自动计算。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={!form.title.trim() || !form.causeDate || !form.periodDays || createStatute.isPending || updateStatute.isPending}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除时效记录"
        message="确定删除该时效记录吗？此操作不可撤销。"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteStatute.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
    </Box>
  );
}

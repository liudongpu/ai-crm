import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
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
import FormControlLabel from '@mui/material/FormControlLabel';
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
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import { useToast } from '@/components/common/ToastProvider';
import {
  useCreateTimeLink,
  useLoggedTimeEntries,
  useMatters,
  useUnloggedEvents,
  useUsers,
} from '@/hooks/useCrm';
import { formatCurrency, formatDate, formatDateTime, toDateInput } from '@/lib/format';
import { taskTypeMeta } from '@/lib/meta';
import type { Task } from '@/types';

type FormState = {
  hours: string;
  date: string;
  description: string;
  billable: boolean;
  rate: string;
};

const emptyForm = (task?: Task | null): FormState => ({
  hours: '',
  date: toDateInput(task?.dueDate ?? task?.startDate) || format(new Date(), 'yyyy-MM-dd'),
  description: task?.title ?? '',
  billable: true,
  rate: '0',
});

export function TimeLinkPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [matterId, setMatterId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const { data: unlogged, isLoading, isError, error, refetch } = useUnloggedEvents(
    useMemo(
      () => ({
        matterId: matterId || undefined,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
      }),
      [matterId, from, to],
    ),
  );
  const { data: logged } = useLoggedTimeEntries();
  const { data: matters } = useMatters();
  const { data: users } = useUsers();
  const createTimeLink = useCreateTimeLink();

  const openLog = (task: Task) => {
    setSelectedTask(task);
    setForm(emptyForm(task));
    setFormOpen(true);
  };

  const requestedId = searchParams.get('taskId');
  useEffect(() => {
    if (!requestedId || isLoading) return;
    const task = (unlogged ?? []).find((item) => item.id === Number(requestedId));
    if (task) {
      setSelectedTask(task);
      setForm(emptyForm(task));
      setFormOpen(true);
    } else {
      toast.info('该日程无需记工时或已记录');
    }
    const next = new URLSearchParams(searchParams);
    next.delete('taskId');
    setSearchParams(next, { replace: true });
  }, [requestedId, isLoading, unlogged, searchParams, setSearchParams, toast]);

  const loggedRows = logged ?? [];
  const totalHours = loggedRows.reduce((sum, item) => sum + (Number(item.hours) || 0), 0);
  const totalAmount = loggedRows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const submit = () => {
    if (!selectedTask || !form.hours || Number(form.hours) <= 0) return;
    createTimeLink.mutate(
      {
        taskId: selectedTask.id,
        hours: Number(form.hours),
        date: form.date ? new Date(`${form.date}T00:00:00`).toISOString() : undefined,
        description: form.description.trim() || undefined,
        billable: form.billable,
        rate: Number(form.rate) || 0,
      },
      { onSuccess: () => setFormOpen(false) },
    );
  };

  return (
    <Box>
      <PageHeader
        title="日历与计费联动"
        subtitle="从日程直接生成工时记录，并追踪已关联工时的账单状态"
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mt: 2 }}>
          {[
            { label: '未记工时日程', value: String(unlogged?.length ?? 0), icon: <AccessTimeOutlined color="warning" /> },
            { label: '已关联工时', value: `${loggedRows.length} 笔`, icon: <ReceiptLongOutlined color="primary" /> },
            { label: '已关联总工时 / 金额', value: `${totalHours.toFixed(1)} h · ${formatCurrency(totalAmount, true)}`, icon: <ReceiptLongOutlined color="success" /> },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {item.icon}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                  <Typography variant="subtitle1" fontWeight={700}>{item.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </PageHeader>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="timelink-matter">案件</InputLabel>
              <Select labelId="timelink-matter" label="案件" value={matterId} onChange={(event) => setMatterId(event.target.value)}>
                <MenuItem value="">全部案件</MenuItem>
                {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="起始日期" type="date" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField size="small" label="结束日期" type="date" value={to} onChange={(event) => setTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>未记工时日程</Typography>
          {isError && <ErrorState message={error?.message ?? '未记工时日程加载失败'} onRetry={() => void refetch()} />}
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>事项</TableCell>
                    <TableCell>类型</TableCell>
                    <TableCell>案件</TableCell>
                    <TableCell>时间</TableCell>
                    <TableCell>负责人</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading && <LoadingRows columns={6} />}
                  {!isLoading && (unlogged ?? []).map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {task.title}
                        {task.sourceType && <Chip size="small" variant="outlined" label={task.sourceType} sx={{ ml: 1 }} />}
                      </TableCell>
                      <TableCell><Chip size="small" variant="outlined" color={taskTypeMeta[task.type]?.color} label={taskTypeMeta[task.type]?.label ?? task.type} /></TableCell>
                      <TableCell>{matters?.find((matter) => matter.id === task.matterId)?.title ?? '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(task.startDate ?? task.dueDate)}</TableCell>
                      <TableCell>{users?.find((user) => user.id === task.assigneeId)?.name ?? '—'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="contained" startIcon={<AccessTimeOutlined />} onClick={() => openLog(task)}>记工时</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && !isError && (unlogged ?? []).length === 0 && <EmptyRow columns={6} text="当前范围内没有未记工时的日程" />}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>已关联工时</Typography>
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>日期</TableCell>
                    <TableCell>事项</TableCell>
                    <TableCell>案件</TableCell>
                    <TableCell>人员</TableCell>
                    <TableCell align="right">小时</TableCell>
                    <TableCell align="right">金额</TableCell>
                    <TableCell>计费</TableCell>
                    <TableCell>开票</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loggedRows.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</TableCell>
                      <TableCell>{entry.task?.title ?? `日程 #${entry.sourceTaskId ?? '—'}`}</TableCell>
                      <TableCell>{entry.matter?.title ?? matters?.find((matter) => matter.id === entry.matterId)?.title ?? '—'}</TableCell>
                      <TableCell>{entry.user?.name ?? users?.find((user) => user.id === entry.userId)?.name ?? '—'}</TableCell>
                      <TableCell align="right">{entry.hours}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(entry.amount)}</TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" color={entry.billable ? 'success' : 'default'} label={entry.billable ? '可计费' : '不可计费'} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" color={entry.invoiced ? 'primary' : 'warning'} label={entry.invoiced ? '已开票' : '未开票'} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {loggedRows.length === 0 && <EmptyRow columns={8} text="暂无由日程生成的工时记录" />}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>由日程记工时</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="关联事项" value={selectedTask?.title ?? ''} fullWidth InputProps={{ readOnly: true }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField size="small" label="小时 *" type="number" value={form.hours} onChange={(event) => setForm({ ...form, hours: event.target.value })} fullWidth />
            <TextField
              size="small"
              label="日期"
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField size="small" label="费率 (¥/小时)" type="number" value={form.rate} onChange={(event) => setForm({ ...form, rate: event.target.value })} fullWidth />
          </Box>
          <TextField size="small" label="工作说明" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={2} fullWidth />
          <FormControlLabel
            control={<Checkbox checked={form.billable} onChange={(event) => setForm({ ...form, billable: event.target.checked })} />}
            label="可计费"
          />
          <Typography variant="caption" color="text.secondary">
            工时金额 = 小时 × 费率；案件与人员按关联日程自动带入。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>取消</Button>
          <Button variant="contained" onClick={submit} disabled={!selectedTask || !form.hours || Number(form.hours) <= 0 || createTimeLink.isPending}>
            记录工时
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

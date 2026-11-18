import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
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
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/States';
import { TaskFormDialog } from '@/components/common/TasksPanel';
import { useDeleteTask, useMatters, useTasks, useToggleTask, useUsers } from '@/hooks/useCrm';
import { formatDateTime } from '@/lib/format';
import { priorityMeta, taskTypeLabel } from '@/lib/meta';
import type { Task } from '@/types';

const isOverdue = (task: Task) => !task.done && Boolean(task.dueDate) && new Date(task.dueDate!).getTime() < Date.now();

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tasks, isLoading, isError, error, refetch } = useTasks();
  const { data: matters } = useMatters();
  const { data: users } = useUsers();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [matterFilter, setMatterFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const all = tasks ?? [];
  const rows = useMemo(
    () =>
      all.filter((task) => {
        if (search && !`${task.title} ${task.description ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (type !== 'all' && task.type !== type) return false;
        if (status === 'open' && task.done) return false;
        if (status === 'done' && !task.done) return false;
        if (matterFilter !== 'all' && String(task.matterId ?? '') !== matterFilter) return false;
        return true;
      }),
    [all, search, type, status, matterFilter],
  );

  const matterName = (id: number | null | undefined) =>
    id == null ? '—' : matters?.find((item) => item.id === id)?.title ?? `#${id}`;
  const userName = (id: number | null | undefined) =>
    id == null ? '—' : users?.find((item) => item.id === id)?.name ?? `#${id}`;

  const stats = [
    { label: '全部任务', value: all.length },
    { label: '待完成', value: all.filter((task) => !task.done).length },
    { label: '已完成', value: all.filter((task) => task.done).length },
    { label: '已逾期', value: all.filter(isOverdue).length },
  ];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <Box>
      <PageHeader title="任务与流程" subtitle="跨案件统一分派任务、跟踪截止日期与完成进度" actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>新建任务</Button>} />
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        {stats.map((item) => (
          <Card key={item.label} sx={{ minWidth: 150, flex: 1 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
              <Typography variant="h6">{item.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Card>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
            <TextField size="small" label="搜索任务" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: 220 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>类型</InputLabel>
              <Select value={type} label="类型" onChange={(event) => setType(event.target.value)}>
                <MenuItem value="all">全部类型</MenuItem>
                <MenuItem value="task">任务</MenuItem>
                <MenuItem value="deadline">截止日期</MenuItem>
                <MenuItem value="hearing">庭审</MenuItem>
                <MenuItem value="court">法院事项</MenuItem>
                <MenuItem value="reminder">提醒</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>状态</InputLabel>
              <Select value={status} label="状态" onChange={(event) => setStatus(event.target.value)}>
                <MenuItem value="all">全部状态</MenuItem>
                <MenuItem value="open">待完成</MenuItem>
                <MenuItem value="done">已完成</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>案件</InputLabel>
              <Select value={matterFilter} label="案件" onChange={(event) => setMatterFilter(event.target.value)}>
                <MenuItem value="all">全部案件</MenuItem>
                <MenuItem value="">未关联案件</MenuItem>
                {(matters ?? []).map((matter) => (
                  <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {isError && <ErrorState message={error?.message ?? '任务加载失败'} onRetry={() => void refetch()} />}
          {isLoading && <LoadingRows columns={7} />}
          {!isLoading && !isError && rows.length === 0 && (
            <EmptyState title="暂无任务" description="调整筛选条件或新建任务" action={<Button size="small" onClick={openCreate}>新建任务</Button>} />
          )}
          {!isLoading && !isError && rows.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={44} />
                    <TableCell>事项</TableCell>
                    <TableCell>类型</TableCell>
                    <TableCell>案件</TableCell>
                    <TableCell>负责人</TableCell>
                    <TableCell>优先级</TableCell>
                    <TableCell>截止时间</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={task.done}
                          onChange={() => toggleTask.mutate(task.id)}
                          inputProps={{ 'aria-label': `切换任务 ${task.title}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'text.disabled' : 'text.primary' }}>
                          {task.title}
                        </Typography>
                        {task.description && (
                          <Typography variant="caption" color="text.secondary" noWrap display="block">{task.description}</Typography>
                        )}
                      </TableCell>
                      <TableCell><Chip size="small" label={taskTypeLabel(task.type)} variant="outlined" /></TableCell>
                      <TableCell><Typography variant="body2">{matterName(task.matterId)}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{userName(task.assigneeId)}</Typography></TableCell>
                      <TableCell><Chip size="small" label={priorityMeta[task.priority]?.label ?? task.priority} color={priorityMeta[task.priority]?.color} variant="outlined" /></TableCell>
                      <TableCell>
                        <Typography variant="body2" color={isOverdue(task) ? 'error' : 'text.secondary'}>
                          {formatDateTime(task.dueDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => { setEditing(task); setFormOpen(true); }} aria-label="编辑任务">
                          <EditOutlined fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setConfirmId(task.id)} aria-label="删除任务">
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <TaskFormDialog open={formOpen} onClose={() => setFormOpen(false)} task={editing} />
      <ConfirmDialog
        open={confirmId !== null}
        title="删除任务"
        message="确定删除该任务吗？此操作不可撤销。"
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId !== null) deleteTask.mutate(confirmId, { onSuccess: () => setConfirmId(null) });
        }}
      />
    </Box>
  );
}

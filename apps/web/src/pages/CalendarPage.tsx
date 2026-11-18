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
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { addDays, format, isBefore, parseISO, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TaskFormDialog } from '@/components/common/TasksPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/common/States';
import { useDeleteTask, useMatters, useTasks, useToggleTask, useUsers } from '@/hooks/useCrm';
import { formatDateTime } from '@/lib/format';
import { priorityMeta, taskTypeMeta } from '@/lib/meta';
import type { Task, TaskType } from '@/types';

type Bucket = { key: string; label: string; hint?: string; tasks: Task[] };

function bucketFor(task: Task): string {
  if (!task.dueDate) return 'none';
  const due = parseISO(task.dueDate);
  if (Number.isNaN(due.getTime())) return 'none';
  const today = startOfDay(new Date());
  if (isBefore(due, today)) return 'overdue';
  if (format(due, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return 'today';
  if (isBefore(due, addDays(today, 7))) return 'week';
  return 'later';
}

const bucketOrder: Array<{ key: string; label: string; hint?: string }> = [
  { key: 'overdue', label: '已逾期', hint: '需要处理' },
  { key: 'today', label: '今天' },
  { key: 'week', label: '未来 7 天' },
  { key: 'later', label: '以后' },
  { key: 'none', label: '未设置时间' },
];

export function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [type, setType] = useState<TaskType | 'all'>('all');
  const [showDone, setShowDone] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { data: tasks, isLoading, isError, error, refetch } = useTasks({});
  const { data: matters } = useMatters();
  const { data: users } = useUsers();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const buckets = useMemo<Bucket[]>(() => {
    const filtered = (tasks ?? []).filter((task) => {
      if (!showDone && task.done) return false;
      if (type !== 'all' && task.type !== type) return false;
      if (query.trim()) {
        const text = `${task.title} ${task.description ?? ''} ${
          matters?.find((matter) => matter.id === task.matterId)?.title ?? ''
        }`.toLowerCase();
        if (!text.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });
    return bucketOrder
      .map((bucket) => ({
        ...bucket,
        tasks: filtered
          .filter((task) => bucketFor(task) === bucket.key)
          .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')),
      }))
      .filter((bucket) => bucket.tasks.length > 0);
  }, [tasks, matters, type, showDone, query]);

  const pendingCount = (tasks ?? []).filter((task) => !task.done).length;
  const overdueCount = (tasks ?? []).filter((task) => !task.done && bucketFor(task) === 'overdue').length;

  return (
    <Box>
      <PageHeader
        title="日程与任务"
        subtitle={`${format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN })} · 待完成 ${pendingCount} 项${overdueCount ? ` · 逾期 ${overdueCount} 项` : ''}`}
        actions={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            新建事项
          </Button>
        }
      >
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder="搜索事项或案件"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            sx={{ width: 220 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="calendar-type">类型</InputLabel>
            <Select labelId="calendar-type" label="类型" value={type} onChange={(event) => setType(event.target.value as TaskType | 'all')}>
              <MenuItem value="all">全部类型</MenuItem>
              {(Object.keys(taskTypeMeta) as TaskType[]).map((key) => (
                <MenuItem key={key} value={key}>{taskTypeMeta[key].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="calendar-done">状态</InputLabel>
            <Select labelId="calendar-done" label="状态" value={showDone ? 'all' : 'open'} onChange={(event) => setShowDone(event.target.value === 'all')}>
              <MenuItem value="open">待完成</MenuItem>
              <MenuItem value="all">全部</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </PageHeader>

      {isError && <ErrorState message={error?.message ?? '日程加载失败'} onRetry={() => void refetch()} />}
      {isLoading && <LoadingPanel height={480} />}
      {!isLoading && !isError && buckets.length === 0 && (
        <EmptyState title="暂无日程事项" description="新建任务、截止日期或庭审安排" action={<Button onClick={() => setFormOpen(true)}>新建事项</Button>} />
      )}

      {!isLoading && !isError && buckets.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {buckets.map((bucket) => (
            <Card key={bucket.key}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{bucket.label}</Typography>
                  <Chip size="small" label={bucket.tasks.length} />
                  {bucket.hint && <Typography variant="caption" color="text.secondary">{bucket.hint}</Typography>}
                </Stack>
                <Stack spacing={0.5}>
                  {bucket.tasks.map((task) => (
                    <Paper key={task.id} variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 1.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Checkbox size="small" checked={task.done} onChange={() => toggleTask.mutate(task.id)} inputProps={{ 'aria-label': `完成 ${task.title}` }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'text.disabled' : 'text.primary' }}
                          >
                            {task.title}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                            <Chip size="small" variant="outlined" label={taskTypeMeta[task.type]?.label ?? task.type} />
                            <Chip size="small" variant="outlined" color={priorityMeta[task.priority]?.color} label={`优先级：${priorityMeta[task.priority]?.label ?? task.priority}`} />
                            {task.matterId && (
                              <Typography variant="caption" color="text.secondary">
                                案件：{matters?.find((matter) => matter.id === task.matterId)?.title ?? `#${task.matterId}`}
                              </Typography>
                            )}
                            {task.assigneeId && (
                              <Typography variant="caption" color="text.secondary">
                                负责人：{users?.find((user) => user.id === task.assigneeId)?.name ?? `#${task.assigneeId}`}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(task.dueDate)}
                        </Typography>
                        <Button size="small" startIcon={<EditOutlined />} onClick={() => { setEditing(task); setFormOpen(true); }}>编辑</Button>
                        <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmId(task.id)}>删除</Button>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <TaskFormDialog open={formOpen} onClose={() => setFormOpen(false)} task={editing} />
      <ConfirmDialog
        open={confirmId !== null}
        title="删除事项"
        message="确定删除该事项吗？此操作不可撤销。"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteTask.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
    </Box>
  );
}

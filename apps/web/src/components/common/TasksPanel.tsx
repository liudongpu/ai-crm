import { useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState, ErrorState, LoadingRows } from './States';
import {
  useCreateCalendarEvent,
  useCreateTask,
  useDeleteTask,
  useMatters,
  useTasks,
  useToggleTask,
  useUpdateCalendarEvent,
  useUpdateTask,
  useUsers,
} from '@/hooks/useCrm';
import { formatDateTime, toLocalInput } from '@/lib/format';
import { priorityMeta, taskTypeLabel, taskTypeMeta } from '@/lib/meta';
import type { Priority, Task, TaskInput, TaskType } from '@/types';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

type FormState = {
  title: string;
  type: TaskType;
  description: string;
  dueDate: string;
  priority: Priority;
  matterId: string;
  assigneeId: string;
  calendarId: string;
  visibility: 'firm' | 'team' | 'personal';
  startDate: string;
  endDate: string;
  allDay: boolean;
  reminderMinutes: string;
};

const emptyForm: FormState = {
  title: '',
  type: 'task',
  description: '',
  dueDate: '',
  priority: 'medium',
  matterId: '',
  assigneeId: '',
  calendarId: 'firm',
  visibility: 'firm',
  startDate: '',
  endDate: '',
  allDay: false,
  reminderMinutes: '60',
};

export function TaskFormDialog({
  open,
  onClose,
  task,
  defaultMatterId,
  defaultCalendarId,
  defaultStart,
  defaultAllDay,
  calendarApi = false,
}: {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultMatterId?: number;
  /** Preselect a calendar when creating (firm / team / personal / matter:<id>). */
  defaultCalendarId?: string;
  /** ISO date used when a blank calendar day is clicked. */
  defaultStart?: string | null;
  defaultAllDay?: boolean;
  /** Calendar pages use /calendar/events; other callers keep the original tasks API. */
  calendarApi?: boolean;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const { data: matters } = useMatters();
  const { data: users } = useUsers();

  useEffect(() => {
    if (!open) return;
    setForm({
      title: task?.title ?? '',
      type: task?.type ?? 'task',
      description: task?.description ?? '',
      dueDate: toLocalInput(task?.dueDate ?? defaultStart),
      priority: task?.priority ?? 'medium',
      matterId: String(task?.matterId ?? defaultMatterId ?? ''),
      assigneeId: String(task?.assigneeId ?? ''),
      calendarId: task?.calendarId ?? defaultCalendarId ?? 'firm',
      visibility: task?.visibility ?? 'firm',
      startDate: toLocalInput(task?.startDate ?? defaultStart),
      endDate: toLocalInput(task?.endDate),
      allDay: task?.allDay ?? defaultAllDay ?? false,
      reminderMinutes: String(task?.reminderMinutes ?? 60),
    });
  }, [open, task, defaultMatterId, defaultCalendarId, defaultStart, defaultAllDay]);

  const submit = () => {
    if (!form.title.trim()) return;
    const payload: TaskInput = {
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim() || null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      priority: form.priority,
      matterId: form.matterId ? Number(form.matterId) : null,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      calendarId: form.calendarId,
      visibility: form.visibility,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      allDay: form.allDay,
      reminderMinutes: Math.max(0, Number(form.reminderMinutes) || 0),
    };
    const onDone = () => onClose();
    if (task) {
      if (calendarApi) updateEvent.mutate({ id: task.id, data: payload }, { onSuccess: onDone });
      else updateTask.mutate({ id: task.id, data: payload }, { onSuccess: onDone });
    } else if (calendarApi) {
      createEvent.mutate(payload, { onSuccess: onDone });
    } else {
      createTask.mutate(payload, { onSuccess: onDone });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? '编辑任务' : '新建任务'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField
          label="标题 *"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          autoFocus
          fullWidth
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="task-type">类型</InputLabel>
            <Select labelId="task-type" label="类型" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TaskType })}>
              {(Object.keys(taskTypeMeta) as TaskType[]).map((key) => (
                <MenuItem key={key} value={key}>{taskTypeMeta[key].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="task-priority">优先级</InputLabel>
            <Select labelId="task-priority" label="优先级" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>
              {(Object.keys(priorityMeta) as Priority[]).map((key) => (
                <MenuItem key={key} value={key}>{priorityMeta[key].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="截止时间"
            type="datetime-local"
            value={form.dueDate}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="task-matter">关联案件</InputLabel>
            <Select labelId="task-matter" label="关联案件" value={form.matterId} onChange={(event) => setForm({ ...form, matterId: event.target.value })}>
              <MenuItem value="">不关联</MenuItem>
              {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="task-assignee">负责人</InputLabel>
            <Select labelId="task-assignee" label="负责人" value={form.assigneeId} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}>
              <MenuItem value="">未指派</MenuItem>
              {(users ?? []).map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="task-calendar">所属日历</InputLabel>
            <Select labelId="task-calendar" label="所属日历" value={form.calendarId} onChange={(event) => setForm({ ...form, calendarId: event.target.value })}>
              <MenuItem value="firm">律所日历</MenuItem>
              <MenuItem value="team">团队日历</MenuItem>
              <MenuItem value="personal">个人日历</MenuItem>
              {(matters ?? []).map((matter) => (
                <MenuItem key={matter.id} value={`matter:${matter.id}`}>案件：{matter.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="task-visibility">可见性</InputLabel>
            <Select
              labelId="task-visibility"
              label="可见性"
              value={form.visibility}
              onChange={(event) => setForm({ ...form, visibility: event.target.value as FormState['visibility'] })}
            >
              <MenuItem value="firm">全所可见</MenuItem>
              <MenuItem value="team">仅团队可见</MenuItem>
              <MenuItem value="personal">仅自己可见</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="开始时间"
            type="datetime-local"
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="结束时间"
            type="datetime-local"
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="提前提醒（分钟）"
            type="number"
            value={form.reminderMinutes}
            onChange={(event) => setForm({ ...form, reminderMinutes: event.target.value })}
            fullWidth
          />
          <FormControlLabel
            control={<Checkbox checked={form.allDay} onChange={(event) => setForm({ ...form, allDay: event.target.checked })} />}
            label="全天事项"
          />
        </Box>
        <TextField
          label="描述"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          multiline
          minRows={2}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={
            !form.title.trim() ||
            createTask.isPending ||
            updateTask.isPending ||
            createEvent.isPending ||
            updateEvent.isPending
          }
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function TasksPanel({ matterId, clientId }: { matterId?: number; clientId?: number }) {
  const { data: tasks, isLoading, isError, error, refetch } = useTasks(matterId ? { matterId } : {});
  const { data: matters } = useMatters({});
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const rows = (tasks ?? []).filter((task) => {
    if (matterId) return task.matterId === matterId;
    if (clientId) return (matters ?? []).some((matter) => matter.clientId === clientId && matter.id === task.matterId);
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          共 {rows.length} 项 · 待完成 {rows.filter((item) => !item.done).length} 项
        </Typography>
        <Button size="small" variant="outlined" startIcon={<AddOutlined />} onClick={openCreate}>新建任务</Button>
      </Stack>

      {isError && <ErrorState message={error?.message ?? '任务加载失败'} onRetry={() => void refetch()} />}
      {isLoading && <LoadingRows columns={5} />}
      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState title="暂无任务" description="添加任务、截止日期或庭审安排" action={<Button size="small" onClick={openCreate}>新建任务</Button>} />
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={44} />
                <TableCell>事项</TableCell>
                <TableCell>类型</TableCell>
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
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {task.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell><Chip size="small" label={taskTypeLabel(task.type)} variant="outlined" /></TableCell>
                  <TableCell><Chip size="small" label={priorityMeta[task.priority]?.label ?? task.priority} color={priorityMeta[task.priority]?.color} variant="outlined" /></TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={!task.done && task.dueDate && new Date(task.dueDate) < new Date() ? 'error' : 'text.secondary'}
                    >
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

      <TaskFormDialog open={formOpen} onClose={() => setFormOpen(false)} task={editing} defaultMatterId={matterId} />
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

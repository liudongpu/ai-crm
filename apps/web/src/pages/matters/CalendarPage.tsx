import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import TodayOutlined from '@mui/icons-material/TodayOutlined';
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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TaskFormDialog } from '@/components/common/TasksPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/common/States';
import {
  useCalendarEvents,
  useCalendarOverview,
  useDeleteCalendarEvent,
  useMatters,
  useToggleTask,
  useUsers,
} from '@/hooks/useCrm';
import { formatDateTime } from '@/lib/format';
import { priorityMeta, taskTypeMeta, taskTypeTint } from '@/lib/meta';
import type { Task, TaskType } from '@/types';

type CalendarView = 'month' | 'week' | 'list';

const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

function eventDate(task: Task): Date | null {
  const value = task.startDate ?? task.dueDate;
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function eventTime(task: Task): string {
  const date = eventDate(task);
  if (!date) return '未设置时间';
  return task.allDay ? `${format(date, 'yyyy-MM-dd')} · 全天` : formatDateTime(task.startDate ?? task.dueDate);
}

export function CalendarPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<CalendarView>('month');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [calendarFilter, setCalendarFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [showDone, setShowDone] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formDefaults, setFormDefaults] = useState<{
    start?: string | null;
    allDay?: boolean;
    calendarId?: string;
  }>({});
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const deleteEvent = useDeleteCalendarEvent();
  const toggleTask = useToggleTask();
  const { data: matters } = useMatters();
  const { data: users } = useUsers();

  const range = useMemo(() => {
    const monthRange = view === 'week'
      ? { start: startOfWeek(anchor, { weekStartsOn: 1 }), end: endOfWeek(anchor, { weekStartsOn: 1 }) }
      : {
          start: startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }),
          end: endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }),
        };
    return { ...monthRange, from: monthRange.start.toISOString(), to: monthRange.end.toISOString() };
  }, [anchor, view]);

  const eventParams = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      calendarId: calendarFilter === 'all' ? undefined : calendarFilter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      search: query.trim() || undefined,
    }),
    [range.from, range.to, calendarFilter, typeFilter, query],
  );

  const { data: events, isLoading, isError, error, refetch } = useCalendarEvents(eventParams);
  const { data: overview } = useCalendarOverview({ from: range.from, to: range.to });

  useEffect(() => {
    if (searchParams.get('new') !== '1' && searchParams.get('create') !== '1') return;
    setEditing(null);
    setFormDefaults({});
    setFormOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    next.delete('create');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const visibleEvents = useMemo(
    () => (events ?? []).filter((task) => showDone || !task.done),
    [events, showDone],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of visibleEvents) {
      const date = eventDate(task);
      if (!date) continue;
      const key = format(date, 'yyyy-MM-dd');
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return (a.startDate ?? a.dueDate ?? '').localeCompare(b.startDate ?? b.dueDate ?? '');
      });
    }
    return map;
  }, [visibleEvents]);

  const days = useMemo(
    () => eachDayOfInterval({ start: range.start, end: range.end }),
    [range.start, range.end],
  );

  const calendarOptions = useMemo(() => {
    const options: Array<{ id: string; name: string }> = [
      { id: 'firm', name: '律所日历' },
      { id: 'team', name: '团队日历' },
      { id: 'personal', name: '个人日历' },
    ];
    for (const matter of matters ?? []) {
      options.push({ id: `matter:${matter.id}`, name: `案件：${matter.title}` });
    }
    for (const calendar of overview?.calendars ?? []) {
      if (!options.some((option) => option.id === calendar.id)) {
        options.push({ id: calendar.id, name: calendar.name });
      }
    }
    return options;
  }, [matters, overview]);

  const selectedEvents = eventsByDay.get(format(selectedDate, 'yyyy-MM-dd')) ?? [];

  const openCreate = (date?: Date, calendarId?: string) => {
    setEditing(null);
    setFormDefaults({
      start: date ? new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString() : null,
      allDay: Boolean(date),
      calendarId: calendarId && calendarId !== 'all' ? calendarId : undefined,
    });
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setFormDefaults({});
    setSelectedDate(eventDate(task) ?? selectedDate);
    setFormOpen(true);
  };

  const shift = (direction: -1 | 1) => {
    const next = view === 'week'
      ? addWeeks(anchor, direction)
      : addMonths(anchor, direction);
    setAnchor(next);
    setSelectedDate(next);
  };

  const goToday = () => {
    const today = startOfDay(new Date());
    setAnchor(today);
    setSelectedDate(today);
  };

  const remove = () => {
    if (confirmId === null) return;
    deleteEvent.mutate(confirmId, { onSuccess: () => setConfirmId(null) });
  };

  const renderChip = (task: Task, compact = false) => (
    <Chip
      key={`${task.id}-${task.title}`}
      size="small"
      label={`${task.allDay ? '全天 ' : ''}${eventTime(task).split(' · ')[0].slice(-5)} ${task.title}`}
      color={taskTypeMeta[task.type]?.color ?? 'default'}
      variant="outlined"
      onClick={(event) => {
        event.stopPropagation();
        openEdit(task);
      }}
      sx={{
        maxWidth: '100%',
        bgcolor: taskTypeTint(task.type),
        justifyContent: 'flex-start',
        '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        opacity: task.done ? 0.6 : 1,
        textDecoration: task.done ? 'line-through' : 'none',
        fontSize: compact ? 11 : 12,
      }}
    />
  );

  const dayCell = (day: Date, week = false) => {
    const key = format(day, 'yyyy-MM-dd');
    const items = eventsByDay.get(key) ?? [];
    const outside = view === 'month' && !isSameMonth(day, anchor);
    return (
      <Box
        key={key}
        onClick={() => { setSelectedDate(day); openCreate(day, calendarFilter); }}
        sx={{
          borderRight: 1,
          borderBottom: 1,
          borderColor: 'divider',
          p: week ? 1 : 0.75,
          minHeight: week ? 480 : 112,
          bgcolor: outside ? 'action.hover' : isToday(day) ? 'action.selected' : 'background.paper',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: isToday(day) ? 700 : 500,
              color: outside ? 'text.disabled' : isToday(day) ? 'primary.main' : 'text.secondary',
            }}
          >
            {week ? `${format(day, 'M月d日')} 周${weekDays[(day.getDay() + 6) % 7]}` : format(day, 'd')}
          </Typography>
          {isToday(day) && <Chip size="small" color="primary" label="今天" sx={{ height: 18, '& .MuiChip-label': { px: 0.7, fontSize: 10 } }} />}
        </Stack>
        <Stack spacing={0.4}>
          {(week ? items : items.slice(0, 3)).map((task) => renderChip(task, !week))}
          {!week && items.length > 3 && (
            <Typography variant="caption" color="text.secondary">还有 {items.length - 3} 项</Typography>
          )}
        </Stack>
      </Box>
    );
  };

  const headerTitle = view === 'week'
    ? `${format(range.start, 'yyyy年M月d日')} - ${format(range.end, 'M月d日')}`
    : format(anchor, 'yyyy年M月');

  return (
    <Box>
      <PageHeader
        title="日程管理"
        subtitle={`${format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN })} · 本范围 ${visibleEvents.length} 项日程`}
        actions={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => openCreate()}>
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="calendar-select-label">日历</InputLabel>
            <Select
              labelId="calendar-select-label"
              label="日历"
              value={calendarFilter}
              onChange={(event) => setCalendarFilter(event.target.value)}
            >
              <MenuItem value="all">全部日历</MenuItem>
              {calendarOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="calendar-type-label">类型</InputLabel>
            <Select
              labelId="calendar-type-label"
              label="类型"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TaskType | 'all')}
            >
              <MenuItem value="all">全部类型</MenuItem>
              {(Object.keys(taskTypeMeta) as TaskType[]).map((key) => (
                <MenuItem key={key} value={key}>{taskTypeMeta[key].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="calendar-status-label">状态</InputLabel>
            <Select
              labelId="calendar-status-label"
              label="状态"
              value={showDone ? 'all' : 'open'}
              onChange={(event) => setShowDone(event.target.value === 'all')}
            >
              <MenuItem value="open">待完成</MenuItem>
              <MenuItem value="all">全部</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </PageHeader>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={view}
              onChange={(_, value: CalendarView | null) => { if (value) setView(value); }}
            >
              <ToggleButton value="month">月视图</ToggleButton>
              <ToggleButton value="week">周视图</ToggleButton>
              <ToggleButton value="list">列表视图</ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton size="small" aria-label="上一页" onClick={() => shift(-1)}><ChevronLeft /></IconButton>
            <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 180, textAlign: 'center' }}>
              {headerTitle}
            </Typography>
            <IconButton size="small" aria-label="下一页" onClick={() => shift(1)}><ChevronRight /></IconButton>
            <Button size="small" startIcon={<TodayOutlined />} onClick={goToday}>今天</Button>
            {overview && (
              <Typography variant="caption" color="text.secondary">
                共 {overview.total} 项 · 未记工时 {overview.unloggedCount} 项
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {isError && <ErrorState message={error?.message ?? '日程加载失败'} onRetry={() => void refetch()} />}
      {isLoading && <LoadingPanel height={480} />}

      {!isLoading && !isError && view !== 'list' && (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: 1, borderColor: 'divider' }}>
            {weekDays.map((label) => (
              <Box key={label} sx={{ p: 1, textAlign: 'center', bgcolor: 'action.hover' }}>
                <Typography variant="caption" fontWeight={700}>周{label}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {days.map((day) => dayCell(day, view === 'week'))}
          </Box>
        </Paper>
      )}

      {!isLoading && !isError && view === 'list' && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>事项</TableCell>
                  <TableCell>类型</TableCell>
                  <TableCell>日历</TableCell>
                  <TableCell>案件</TableCell>
                  <TableCell>时间</TableCell>
                  <TableCell>优先级</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...visibleEvents]
                  .sort((a, b) => (a.startDate ?? a.dueDate ?? '').localeCompare(b.startDate ?? b.dueDate ?? ''))
                  .map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={task.done}
                          onChange={() => toggleTask.mutate(task.id)}
                          inputProps={{ 'aria-label': `完成 ${task.title}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ textDecoration: task.done ? 'line-through' : 'none' }}>
                          {task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {task.description ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell><Chip size="small" variant="outlined" color={taskTypeMeta[task.type]?.color} label={taskTypeMeta[task.type]?.label ?? task.type} /></TableCell>
                      <TableCell>{calendarOptions.find((item) => item.id === task.calendarId)?.name ?? task.calendarId}</TableCell>
                      <TableCell>{matters?.find((matter) => matter.id === task.matterId)?.title ?? '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{eventTime(task)}</TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" color={priorityMeta[task.priority]?.color} label={priorityMeta[task.priority]?.label ?? task.priority} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="记工时">
                          <Button size="small" onClick={() => navigate(`/calendar/time-link?taskId=${task.id}`)}>记工时</Button>
                        </Tooltip>
                        <IconButton size="small" onClick={() => openEdit(task)} aria-label="编辑日程"><EditOutlined fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => setConfirmId(task.id)} aria-label="删除日程"><DeleteOutline fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                {visibleEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>当前范围内暂无日程</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {!isLoading && !isError && visibleEvents.length === 0 && view !== 'list' && (
        <Box sx={{ mt: 1 }}>
          <EmptyState title="当前范围暂无日程" description="点击日历中的空白日期即可新建事项" />
        </Box>
      )}

      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {format(selectedDate, 'yyyy年M月d日 EEEE', { locale: zhCN })}
            </Typography>
            <Typography variant="caption" color="text.secondary">共 {selectedEvents.length} 项</Typography>
          </Stack>
          {selectedEvents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">这一天暂无日程，点击日期可新建。</Typography>
          ) : (
            <Stack spacing={1}>
              {selectedEvents.map((task) => (
                <Paper key={task.id} variant="outlined" sx={{ p: 1.25 }}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                    <Checkbox size="small" checked={task.done} onChange={() => toggleTask.mutate(task.id)} inputProps={{ 'aria-label': `完成 ${task.title}` }} />
                    <Box sx={{ flex: 1, minWidth: 180 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ textDecoration: task.done ? 'line-through' : 'none' }}>
                        {task.title}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                        <Chip size="small" variant="outlined" color={taskTypeMeta[task.type]?.color} label={taskTypeMeta[task.type]?.label ?? task.type} />
                        <Typography variant="caption" color="text.secondary">{eventTime(task)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {calendarOptions.find((item) => item.id === task.calendarId)?.name ?? task.calendarId}
                        </Typography>
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
                        {task.visibility !== 'firm' && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={task.visibility === 'team' ? '团队可见' : '仅自己可见'}
                          />
                        )}
                      </Stack>
                    </Box>
                    <Button size="small" onClick={() => navigate(`/calendar/time-link?taskId=${task.id}`)}>记工时</Button>
                    <Button size="small" startIcon={<EditOutlined />} onClick={() => openEdit(task)}>编辑</Button>
                    <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmId(task.id)}>删除</Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <TaskFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setFormDefaults({}); }}
        task={editing}
        defaultStart={formDefaults.start}
        defaultAllDay={formDefaults.allDay}
        defaultCalendarId={formDefaults.calendarId}
        calendarApi
      />
      <ConfirmDialog
        open={confirmId !== null}
        title="删除日程"
        message="确定删除该日程吗？此操作不可撤销。"
        onClose={() => setConfirmId(null)}
        onConfirm={remove}
      />
    </Box>
  );
}

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
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
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
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/common/States';
import { TaskFormDialog } from '@/components/common/TasksPanel';
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

type ScheduleView = 'day' | 'week' | 'month' | 'list';
type DatePreset = 'all' | 'today' | 'tomorrow' | 'week' | 'nextweek';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_HEIGHT = 52;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, index) => HOUR_START + index);
const TYPE_COLORS: Record<TaskType, string> = {
  task: '#1b365d',
  deadline: '#b4443c',
  hearing: '#b8860b',
  court: '#2c6b8f',
  reminder: '#7c3aed',
};

function eventDate(task: Task): Date | null {
  const value = task.startDate ?? task.dueDate;
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function eventEnd(task: Task, start: Date): Date {
  if (task.endDate) {
    const parsed = parseISO(task.endDate);
    if (isValid(parsed) && parsed > start) return parsed;
  }
  return new Date(start.getTime() + 30 * 60_000);
}

/** Minutes from midnight, clamped to the visible time grid. */
function gridWindow(task: Task) {
  const start = eventDate(task)!;
  const end = eventEnd(task, start);
  const from = Math.max(start.getHours() * 60 + start.getMinutes(), HOUR_START * 60);
  const to = Math.min(
    end.getHours() * 60 + end.getMinutes() || HOUR_END * 60,
    HOUR_END * 60,
  );
  return {
    top: ((from - HOUR_START * 60) / 60) * HOUR_HEIGHT,
    height: Math.max(24, ((to - from) / 60) * HOUR_HEIGHT),
  };
}

/** Assign overlapping events in a day to side-by-side lanes. */
function layoutDay(items: Task[]) {
  const sorted = [...items].sort((a, b) => {
    const startA = eventDate(a)!.getTime();
    const startB = eventDate(b)!.getTime();
    return startA - startB || eventEnd(b, eventDate(b)!).getTime() - eventEnd(a, eventDate(a)!).getTime();
  });
  const laneEnds: number[] = [];
  const assigned = sorted.map((task) => {
    const start = eventDate(task)!.getTime();
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(start);
    }
    laneEnds[lane] = Math.max(laneEnds[lane], eventEnd(task, eventDate(task)!).getTime());
    return { task, lane };
  });
  return assigned.map((item) => ({ ...item, lanes: laneEnds.length }));
}

function EventChip({
  task,
  onClick,
  compact = false,
}: {
  task: Task;
  onClick: () => void;
  compact?: boolean;
}) {
  const date = eventDate(task);
  const color = TYPE_COLORS[task.type] ?? '#1b365d';
  return (
    <Box
      component="button"
      type="button"
      onClick={(event) => { event.stopPropagation(); onClick(); }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        width: '100%',
        minWidth: 0,
        px: 0.6,
        py: 0.25,
        border: 0,
        borderLeft: `3px solid ${color}`,
        borderRadius: 0.5,
        bgcolor: taskTypeTint(task.type),
        cursor: 'pointer',
        textAlign: 'left',
        opacity: task.done ? 0.6 : 1,
        '&:hover': { filter: 'brightness(0.97)' },
      }}
    >
      {!task.allDay && date && (
        <Typography component="span" sx={{ fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>
          {format(date, 'HH:mm')}
        </Typography>
      )}
      <Typography
        component="span"
        noWrap
        sx={{
          fontSize: compact ? 11 : 12,
          fontWeight: 600,
          textDecoration: task.done ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {task.title}
      </Typography>
    </Box>
  );
}

export function SchedulePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ScheduleView>('week');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [query, setQuery] = useState('');
  const [calendarFilter, setCalendarFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [showDone, setShowDone] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formDefaults, setFormDefaults] = useState<{ start?: string; allDay?: boolean; calendarId?: string }>({});
  const [detailId, setDetailId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: overview } = useCalendarOverview();
  const { data: matters = [] } = useMatters();
  const { data: users = [] } = useUsers();
  const toggleTask = useToggleTask();
  const deleteEvent = useDeleteCalendarEvent();

  // The range fetched from the API follows the visible period; local filters are
  // applied afterwards so switching views never loses the current selection.
  const range = useMemo(() => {
    let start: Date;
    let end: Date;
    if (view === 'day') {
      start = startOfDay(anchor);
      end = endOfDay(anchor);
    } else if (view === 'week') {
      start = startOfWeek(anchor, { weekStartsOn: 1 });
      end = endOfWeek(anchor, { weekStartsOn: 1 });
    } else {
      start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
      end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
    }
    return { start, end, from: start.toISOString(), to: end.toISOString() };
  }, [anchor, view]);

  const { data: visibleEvents = [], isLoading: loadingEvents, isError: eventsError, error: eventsErrorObj, refetch: refetchEvents } =
    useCalendarEvents({ from: range.from, to: range.to });

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

  const inPreset = (date: Date) => {
    const today = startOfDay(new Date());
    if (datePreset === 'today') return isSameDay(date, today);
    if (datePreset === 'tomorrow') return isSameDay(date, addDays(today, 1));
    if (datePreset === 'week') {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      return date >= start && date <= endOfWeek(start, { weekStartsOn: 1 });
    }
    if (datePreset === 'nextweek') {
      const start = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
      return date >= start && date <= endOfWeek(start, { weekStartsOn: 1 });
    }
    return true;
  };

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return visibleEvents.filter((task) => {
      const date = eventDate(task);
      if (!date || (!showDone && task.done)) return false;
      if (calendarFilter !== 'all' && task.calendarId !== calendarFilter) return false;
      if (typeFilter !== 'all' && task.type !== typeFilter) return false;
      if (ownerFilter !== 'all' && String(task.assigneeId ?? '') !== ownerFilter) return false;
      if (!inPreset(date)) return false;
      if (term) {
        const haystack = [
          task.title,
          task.description ?? '',
          task.calendarId,
          matters.find((matter) => matter.id === task.matterId)?.title ?? '',
        ].join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleEvents, query, calendarFilter, typeFilter, ownerFilter, datePreset, showDone, matters]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of filtered) {
      const date = eventDate(task);
      if (!date) continue;
      const key = format(date, 'yyyy-MM-dd');
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [filtered]);

  const days = useMemo(
    () => (view === 'day' ? [startOfDay(anchor)] : eachDayOfInterval({ start: range.start, end: range.end })),
    [anchor, range.start, range.end, view],
  );

  const calendarOptions = useMemo(() => {
    const options = [
      { id: 'firm', name: '律所日历' },
      { id: 'team', name: '团队日历' },
      { id: 'personal', name: '个人日历' },
    ];
    for (const matter of matters) options.push({ id: `matter:${matter.id}`, name: `案件：${matter.title}` });
    for (const calendar of overview?.calendars ?? []) {
      if (!options.some((item) => item.id === calendar.id)) options.push({ id: calendar.id, name: calendar.name });
    }
    return options;
  }, [matters, overview]);

  const detail = visibleEvents.find((task) => task.id === detailId) ?? null;
  const headerTitle = view === 'day'
    ? format(anchor, 'yyyy年M月d日 EEEE', { locale: zhCN })
    : view === 'week'
      ? `${format(range.start, 'yyyy年M月d日')} - ${format(range.end, 'M月d日')}`
      : format(anchor, 'yyyy年M月');

  const openCreate = (date?: Date, options?: { allDay?: boolean; hour?: number; minute?: number }) => {
    setEditing(null);
    let start: string | undefined;
    if (date) {
      const value = new Date(date);
      value.setHours(options?.hour ?? 9, options?.minute ?? 0, 0, 0);
      start = value.toISOString();
    }
    setFormDefaults({
      start,
      allDay: options?.allDay ?? Boolean(date && options?.hour === undefined),
      calendarId: calendarFilter !== 'all' ? calendarFilter : undefined,
    });
    setDetailId(null);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setFormDefaults({});
    setDetailId(null);
    setFormOpen(true);
  };

  const shift = (direction: -1 | 1) => {
    const next = view === 'day' ? addDays(anchor, direction)
      : view === 'week' ? addWeeks(anchor, direction)
        : addMonths(anchor, direction);
    setAnchor(next);
  };

  const remove = () => {
    if (confirmId === null) return;
    deleteEvent.mutate(confirmId, { onSuccess: () => { setConfirmId(null); setDetailId(null); } });
  };

  const renderEventChip = (task: Task, compact = false) => (
    <EventChip key={task.id} task={task} compact={compact} onClick={() => setDetailId(task.id)} />
  );

  const renderGrid = () => (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))`, borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
        <Box />
        {days.map((day) => (
          <Box key={day.toISOString()} sx={{ p: 1, borderLeft: 1, borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">{WEEKDAYS[(day.getDay() + 6) % 7]}</Typography>
            <Typography
              component="span"
              sx={{
                display: 'inline-grid',
                placeItems: 'center',
                minWidth: 26,
                height: 26,
                mt: 0.25,
                borderRadius: '13px',
                fontSize: 14,
                fontWeight: 700,
                bgcolor: isToday(day) ? 'primary.main' : 'transparent',
                color: isToday(day) ? '#fff' : 'text.primary',
              }}
            >
              {format(day, 'd')}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* All-day row: mirrors the reference calendar's "全天" lane. */}
      <Box sx={{ display: 'grid', gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))`, borderBottom: 1, borderColor: 'divider', minHeight: 36 }}>
        <Box sx={{ p: 1, color: 'text.secondary', fontSize: 11 }}>全天</Box>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const items = (eventsByDay.get(key) ?? []).filter((task) => task.allDay);
          return (
            <Box
              key={key}
              onClick={() => openCreate(day, { allDay: true })}
              sx={{ p: 0.5, borderLeft: 1, borderColor: 'divider', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 0.25, '&:hover': { bgcolor: 'action.hover' } }}
            >
              {items.map((task) => renderEventChip(task))}
            </Box>
          );
        })}
      </Box>

      <Box sx={view === 'week' ? undefined : { maxHeight: 540, overflowY: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))`, height: HOURS.length * HOUR_HEIGHT }}>
          <Box>
            {HOURS.map((hour) => (
              <Box key={hour} sx={{ height: HOUR_HEIGHT, borderBottom: 1, borderColor: 'divider', position: 'relative' }}>
                <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', top: -7, right: 6, fontSize: 10 }}>
                  {String(hour).padStart(2, '0')}:00
                </Typography>
              </Box>
            ))}
          </Box>
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const timed = (eventsByDay.get(key) ?? []).filter((task) => !task.allDay);
            const laidOut = layoutDay(timed);
            return (
              <Box
                key={key}
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const minutes = Math.min(HOURS.length * 60 - 30, Math.max(0, Math.floor(((event.clientY - rect.top) / HOUR_HEIGHT) * 2) * 30));
                  openCreate(day, { hour: HOUR_START + Math.floor(minutes / 60), minute: minutes % 60 });
                }}
                sx={{ position: 'relative', borderLeft: 1, borderColor: 'divider', bgcolor: isToday(day) ? '#fafcff' : 'background.paper', cursor: 'pointer' }}
              >
                {HOURS.map((hour) => (
                  <Box key={hour} sx={{ height: HOUR_HEIGHT, borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }} />
                ))}
                {laidOut.map(({ task, lane, lanes }) => {
                  const { top, height } = gridWindow(task);
                  const color = TYPE_COLORS[task.type] ?? '#1b365d';
                  const start = eventDate(task)!;
                  return (
                    <Box
                      key={task.id}
                      onClick={(event) => { event.stopPropagation(); setDetailId(task.id); }}
                      sx={{
                        position: 'absolute',
                        top,
                        height,
                        left: `calc(${(lane * 100) / lanes}% + 2px)`,
                        width: `calc(${100 / lanes}% - 4px)`,
                        overflow: 'hidden',
                        px: 0.6,
                        py: 0.3,
                        borderRadius: 0.5,
                        borderLeft: `3px solid ${color}`,
                        bgcolor: taskTypeTint(task.type),
                        cursor: 'pointer',
                        opacity: task.done ? 0.6 : 1,
                        '&:hover': { filter: 'brightness(0.97)' },
                      }}
                    >
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color, lineHeight: 1.3 }}>
                        {format(start, 'HH:mm')} {task.title}
                      </Typography>
                      {height > 44 && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                          {calendarOptions.find((item) => item.id === task.calendarId)?.name ?? task.calendarId}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );

  const renderMonth = () => (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
        {WEEKDAYS.map((label) => (
          <Box key={label} sx={{ p: 1, textAlign: 'center' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const items = (eventsByDay.get(key) ?? []).slice().sort((a, b) => {
            if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
            return (eventDate(a)?.getTime() ?? 0) - (eventDate(b)?.getTime() ?? 0);
          });
          return (
            <Box
              key={key}
              onClick={() => openCreate(day, { allDay: true })}
              sx={{
                minHeight: 124,
                p: 0.5,
                borderRight: 1,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: !isSameMonth(day, anchor) ? '#fafafb' : isToday(day) ? '#fafcff' : 'background.paper',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Button
                size="small"
                onClick={(event) => { event.stopPropagation(); setAnchor(day); setView('day'); }}
                sx={{
                  minWidth: 26,
                  height: 26,
                  px: 0.5,
                  borderRadius: '13px',
                  color: isToday(day) ? '#fff' : !isSameMonth(day, anchor) ? 'text.disabled' : 'text.primary',
                  bgcolor: isToday(day) ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: isToday(day) ? 'primary.dark' : 'action.hover' },
                }}
              >
                {format(day, 'd')}
              </Button>
              <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                {items.slice(0, 4).map((task) => renderEventChip(task, true))}
                {items.length > 4 && (
                  <Button
                    size="small"
                    onClick={(event) => { event.stopPropagation(); setAnchor(day); setView('day'); }}
                    sx={{ alignSelf: 'flex-start', fontSize: 11, px: 0.5, minWidth: 0 }}
                  >
                    还有 {items.length - 4} 项
                  </Button>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );

  const renderList = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>日程</TableCell>
            <TableCell>类型</TableCell>
            <TableCell>日历</TableCell>
            <TableCell>案件</TableCell>
            <TableCell>时间</TableCell>
            <TableCell>负责人</TableCell>
            <TableCell align="right">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...filtered].sort((a, b) => (eventDate(a)?.getTime() ?? 0) - (eventDate(b)?.getTime() ?? 0)).map((task) => (
            <TableRow key={task.id} hover>
              <TableCell padding="checkbox">
                <Checkbox size="small" checked={task.done} onChange={() => toggleTask.mutate(task.id)} inputProps={{ 'aria-label': `完成 ${task.title}` }} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600} sx={{ textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">{task.description ?? '—'}</Typography>
              </TableCell>
              <TableCell><Chip size="small" variant="outlined" color={taskTypeMeta[task.type]?.color} label={taskTypeMeta[task.type]?.label ?? task.type} /></TableCell>
              <TableCell>{calendarOptions.find((item) => item.id === task.calendarId)?.name ?? task.calendarId}</TableCell>
              <TableCell>{matters.find((matter) => matter.id === task.matterId)?.title ?? '—'}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {task.allDay ? `${format(eventDate(task)!, 'yyyy-MM-dd')} · 全天` : formatDateTime(task.startDate ?? task.dueDate)}
              </TableCell>
              <TableCell>{users.find((user) => user.id === task.assigneeId)?.name ?? '—'}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => setDetailId(task.id)}>详情</Button>
                <Tooltip title="编辑"><IconButton size="small" onClick={() => openEdit(task)} aria-label="编辑日程"><EditOutlined fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="删除"><IconButton size="small" color="error" onClick={() => setConfirmId(task.id)} aria-label="删除日程"><DeleteOutline fontSize="small" /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>当前范围内暂无日程</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const isBusy = loadingEvents;
  const hasError = eventsError;

  return (
    <Box>
      <PageHeader
        title="日程"
        subtitle={`${format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN })} · 当前范围 ${filtered.length} 项日程`}
        actions={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => openCreate()}>
            新建日程
          </Button>
        }
      >
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder="搜索日程、案件"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            sx={{ width: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="schedule-calendar-label">日历</InputLabel>
            <Select labelId="schedule-calendar-label" label="日历" value={calendarFilter} onChange={(event) => setCalendarFilter(event.target.value)}>
              <MenuItem value="all">全部日历</MenuItem>
              {calendarOptions.map((option) => <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="schedule-type-label">类型</InputLabel>
            <Select labelId="schedule-type-label" label="类型" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TaskType | 'all')}>
              <MenuItem value="all">全部类型</MenuItem>
              {(Object.keys(taskTypeMeta) as TaskType[]).map((key) => <MenuItem key={key} value={key}>{taskTypeMeta[key].label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="schedule-owner-label">负责人</InputLabel>
            <Select labelId="schedule-owner-label" label="负责人" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
              <MenuItem value="all">全部负责人</MenuItem>
              {users.map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="schedule-date-label">时间</InputLabel>
            <Select labelId="schedule-date-label" label="时间" value={datePreset} onChange={(event) => setDatePreset(event.target.value as DatePreset)}>
              <MenuItem value="all">全部时间</MenuItem>
              <MenuItem value="today">今天</MenuItem>
              <MenuItem value="tomorrow">明天</MenuItem>
              <MenuItem value="week">本周</MenuItem>
              <MenuItem value="nextweek">下周</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel id="schedule-status-label">状态</InputLabel>
            <Select labelId="schedule-status-label" label="状态" value={showDone ? 'all' : 'open'} onChange={(event) => setShowDone(event.target.value === 'all')}>
              <MenuItem value="open">待完成</MenuItem>
              <MenuItem value="all">全部</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </PageHeader>

      <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, value: ScheduleView | null) => { if (value) setView(value); }}
          >
            <ToggleButton value="day">日</ToggleButton>
            <ToggleButton value="week">周</ToggleButton>
            <ToggleButton value="month">月</ToggleButton>
            <ToggleButton value="list">列表</ToggleButton>
          </ToggleButtonGroup>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="上一页"><IconButton size="small" onClick={() => shift(-1)} aria-label="上一页"><ChevronLeft /></IconButton></Tooltip>
          <Button size="small" startIcon={<TodayOutlined />} onClick={() => setAnchor(startOfDay(new Date()))}>今天</Button>
          <Tooltip title="下一页"><IconButton size="small" onClick={() => shift(1)} aria-label="下一页"><ChevronRight /></IconButton></Tooltip>
          <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 190, textAlign: 'center' }}>{headerTitle}</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary">
            共 {overview?.total ?? visibleEvents.length} 项 · 未记工时 {overview?.unloggedCount ?? 0} 项
          </Typography>
        </Stack>
      </Paper>

      {hasError && <ErrorState message={eventsErrorObj?.message ?? '日程加载失败'} onRetry={() => void refetchEvents()} />}
      {isBusy && <LoadingPanel height={420} />}

      {!isBusy && !hasError && (
        <>
          {view === 'month' ? renderMonth() : view === 'list' ? renderList() : renderGrid()}
          {filtered.length === 0 && view !== 'list' && (
            <Box sx={{ mt: 2 }}>
              <EmptyState
                title="当前范围暂无日程"
                description="点击日期或时间格即可新建日程，也可以调整上方筛选条件"
                action={<Button variant="outlined" startIcon={<AddOutlined />} onClick={() => openCreate()}>新建日程</Button>}
              />
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            点击日期或空白时间格可快速新建；点击已有日程查看详情、编辑或标记完成。
          </Typography>
        </>
      )}

      <TaskFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setFormDefaults({}); }}
        task={editing}
        defaultStart={formDefaults.start}
        defaultAllDay={formDefaults.allDay}
        defaultCalendarId={formDefaults.calendarId}
        calendarApi
      />

      <Dialog open={detail !== null} onClose={() => setDetailId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{detail?.title ?? '日程详情'}</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {detail && (
            <Stack spacing={1.25} sx={{ pt: 0.5 }}>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" color={taskTypeMeta[detail.type]?.color} label={taskTypeMeta[detail.type]?.label ?? detail.type} />
                <Chip size="small" variant="outlined" color={priorityMeta[detail.priority]?.color} label={`优先级：${priorityMeta[detail.priority]?.label ?? detail.priority}`} />
                <Chip size="small" variant="outlined" label={detail.done ? '已完成' : '待完成'} />
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Typography variant="body2">
                  时间：{detail.allDay
                    ? `${format(eventDate(detail)!, 'yyyy年M月d日')} · 全天`
                    : formatDateTime(detail.startDate ?? detail.dueDate)}
                </Typography>
                <Typography variant="body2">日历：{calendarOptions.find((item) => item.id === detail.calendarId)?.name ?? detail.calendarId}</Typography>
              </Stack>
              {detail.matterId && (
                <Typography variant="body2">案件：{matters.find((matter) => matter.id === detail.matterId)?.title ?? `#${detail.matterId}`}</Typography>
              )}
              {detail.assigneeId && (
                <Typography variant="body2">负责人：{users.find((user) => user.id === detail.assigneeId)?.name ?? `#${detail.assigneeId}`}</Typography>
              )}
              <Typography variant="body2" color="text.secondary">{detail.description || '暂无说明'}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setDetailId(null)}>关闭</Button>
          {detail && (
            <>
              <Button onClick={() => toggleTask.mutate(detail.id)}>{detail.done ? '取消完成' : '标记完成'}</Button>
              <Button onClick={() => navigate(`/calendar/time-link?taskId=${detail.id}`)}>记工时</Button>
              <Button startIcon={<EditOutlined />} onClick={() => openEdit(detail)}>编辑</Button>
              <Button color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmId(detail.id)}>删除</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

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

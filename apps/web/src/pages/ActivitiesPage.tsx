import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isTomorrow,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import AddOutlined from '@mui/icons-material/AddOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ListAltOutlined from '@mui/icons-material/ListAltOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { useActivities, useContacts, useCreateActivity, useDeals, useDeleteActivity, useUpdateActivity } from '@/hooks/useCrm';
import { formatDateTime, toLocalInput } from '@/lib/format';
import { activityMeta } from '@/lib/meta';
import type { Activity, ActivityInput, ActivityType } from '@/types';

type Filter = 'pending' | 'done' | 'all';
type GroupLabel = '已逾期' | '今天' | '明天' | '未来' | '无日期';

function groupActivities(activities: Activity[]) {
  const groups: Record<GroupLabel, Activity[]> = { 已逾期: [], 今天: [], 明天: [], 未来: [], 无日期: [] };
  for (const activity of activities) {
    if (!activity.dueDate) {
      groups['无日期'].push(activity);
    } else {
      const date = parseISO(activity.dueDate);
      if (isToday(date)) groups['今天'].push(activity);
      else if (isTomorrow(date)) groups['明天'].push(activity);
      else if (date < new Date()) groups['已逾期'].push(activity);
      else groups['未来'].push(activity);
    }
  }
  return groups;
}

function ActivityRow({ activity, onEdit, onDelete }: { activity: Activity; onEdit: () => void; onDelete: () => void }) {
  const updateActivity = useUpdateActivity();
  const meta = activityMeta[activity.type];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 }, '&:hover': { bgcolor: '#fafafa' } }}>
      <Checkbox size="small" checked={activity.done} onChange={(event) => updateActivity.mutate({ id: activity.id, data: { done: event.target.checked } })} inputProps={{ 'aria-label': '标记完成' }} />
      <Avatar sx={{ width: 32, height: 32, bgcolor: meta.bg, color: meta.color, fontSize: 12 }}>{meta.label.slice(0, 1)}</Avatar>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} sx={{ textDecoration: activity.done ? 'line-through' : 'none', color: activity.done ? 'text.disabled' : 'text.primary' }} noWrap>
          {activity.subject}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip size="small" variant="outlined" label={meta.label} sx={{ height: 18, fontSize: 10 }} />
          {activity.deal && <Typography variant="caption" color="text.secondary">{activity.deal.title}</Typography>}
          {activity.contact && <Typography variant="caption" color="text.secondary">· {activity.contact.name}</Typography>}
          {activity.notes && <Typography variant="caption" color="text.secondary" noWrap>· {activity.notes}</Typography>}
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(activity.dueDate)}</Typography>
      <Tooltip title="编辑"><IconButton size="small" onClick={onEdit}><EditOutlined fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="删除"><IconButton size="small" color="error" onClick={onDelete}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
    </Box>
  );
}

export function ActivitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('pending');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [month, setMonth] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<ActivityInput>({ type: 'task', subject: '' });
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: activities, isLoading } = useActivities();
  const { data: deals } = useDeals();
  const { data: contacts } = useContacts();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      const presetDate = searchParams.get('date');
      const presetDeal = Number(searchParams.get('dealId')) || null;
      const presetContact = Number(searchParams.get('contactId')) || null;
      const dueDate = presetDate ? new Date(`${presetDate}T10:00:00`).toISOString() : new Date(Date.now() + 86_400_000).toISOString();
      setEditing(null);
      setForm({ type: 'task', subject: '', dueDate, notes: '', dealId: presetDeal, contactId: presetContact });
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      next.delete('date');
      next.delete('dealId');
      next.delete('contactId');
      next.delete('accountId');
      next.delete('leadId');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const visible = useMemo(() => {
    const list = activities ?? [];
    if (filter === 'pending') return list.filter((item) => !item.done);
    if (filter === 'done') return list.filter((item) => item.done);
    return list;
  }, [activities, filter]);

  const groups = useMemo(() => groupActivities(visible), [visible]);
  const doneCount = activities?.filter((item) => item.done).length ?? 0;
  const pendingCount = activities?.filter((item) => !item.done).length ?? 0;

  const openCreate = (date?: Date) => {
    setEditing(null);
    const due = date ? new Date(date) : new Date(Date.now() + 86_400_000);
    if (!date) due.setHours(10, 0, 0, 0);
    setForm({ type: 'task', subject: '', dueDate: due.toISOString(), notes: '', dealId: null, contactId: null });
    setFormOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditing(activity);
    setForm({
      type: activity.type,
      subject: activity.subject,
      dueDate: activity.dueDate,
      notes: activity.notes ?? '',
      dealId: activity.dealId,
      contactId: activity.contactId,
    });
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.subject?.trim()) return;
    const payload: ActivityInput = {
      ...form,
      subject: form.subject.trim(),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    };
    if (editing) {
      updateActivity.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createActivity.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <Box>
      <PageHeader title="活动" subtitle="管理任务、电话、邮件与会议安排" />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Tabs value={filter} onChange={(_, value) => setFilter(value as Filter)}>
          <Tab value="pending" label={`待办 (${pendingCount})`} />
          <Tab value="done" label={`已完成 (${doneCount})`} />
          <Tab value="all" label="全部" />
        </Tabs>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5 }}>
          <ButtonGroup size="small" variant="outlined">
            <Button startIcon={<ListAltOutlined />} variant={view === 'list' ? 'contained' : 'outlined'} onClick={() => setView('list')}>列表</Button>
            <Button startIcon={<CalendarMonthOutlined />} variant={view === 'calendar' ? 'contained' : 'outlined'} onClick={() => setView('calendar')}>日历</Button>
          </ButtonGroup>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => openCreate()}>新建活动</Button>
        </Box>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} variant="rounded" height={64} />)}
        </Box>
      )}

      {!isLoading && view === 'list' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {(Object.keys(groups) as GroupLabel[]).map((label) =>
            groups[label].length ? (
              <Box key={label}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: label === '已逾期' ? 'error.main' : 'text.primary' }}>{label}</Typography>
                  <Chip size="small" label={groups[label].length} />
                </Box>
                <Paper sx={{ overflow: 'hidden' }}>
                  {groups[label].map((activity) => (
                    <ActivityRow key={activity.id} activity={activity} onEdit={() => openEdit(activity)} onDelete={() => setConfirmId(activity.id)} />
                  ))}
                </Paper>
              </Box>
            ) : null,
          )}
          {visible.length === 0 && (
            <Paper sx={{ textAlign: 'center', py: 8, borderStyle: 'dashed' }}>
              <CheckCircleOutline sx={{ fontSize: 44, color: 'success.main' }} />
              <Typography variant="subtitle1" sx={{ mt: 1 }}>太棒了，当前没有待办活动</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>点击「新建活动」安排下一次跟进。</Typography>
            </Paper>
          )}
        </Box>
      )}

      {!isLoading && view === 'calendar' && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <IconButton size="small" onClick={() => setMonth(subMonths(month, 1))} aria-label="上个月"><ChevronLeft /></IconButton>
            <Typography variant="h6">{format(month, 'yyyy年 M月')}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button size="small" variant="text" onClick={() => setMonth(new Date())}>今天</Button>
              <IconButton size="small" onClick={() => setMonth(addMonths(month, 1))} aria-label="下个月"><ChevronRight /></IconButton>
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
              <Box key={day} sx={{ p: 1, textAlign: 'center', bgcolor: '#f7f7f7', borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700, fontSize: 12 }}>
                {day}
              </Box>
            ))}
            {calendarDays.map((day) => {
              const dayActivities = visible.filter((item) => item.dueDate && isSameDay(parseISO(item.dueDate), day));
              return (
                <Box
                  key={day.toISOString()}
                  sx={{
                    minHeight: 96,
                    p: 0.75,
                    borderRight: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: isSameMonth(day, month) ? '#fff' : '#fafafa',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f3f9ff' },
                    '&:nth-child(7n)': { borderRight: 0 },
                  }}
                  onClick={() => openCreate(day)}
                >
                  <Typography variant="caption" sx={{ fontWeight: isToday(day) ? 700 : 400, color: isToday(day) ? 'primary.main' : isSameMonth(day, month) ? 'text.primary' : 'text.disabled' }}>
                    {format(day, 'd')}
                  </Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    {dayActivities.slice(0, 3).map((activity) => {
                      const meta = activityMeta[activity.type];
                      return (
                        <Box key={activity.id} sx={{ bgcolor: meta.bg, color: meta.color, borderRadius: 0.5, px: 0.5, py: 0.25, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={(event) => { event.stopPropagation(); openEdit(activity); }}>
                          {format(parseISO(activity.dueDate!), 'HH:mm')} {activity.subject}
                        </Box>
                      );
                    })}
                    {dayActivities.length > 3 && <Typography variant="caption" color="text.secondary">还有 {dayActivities.length - 3} 项</Typography>}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑活动' : '新建活动'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="activity-type">活动类型</InputLabel>
              <Select labelId="activity-type" label="活动类型" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ActivityType })}>
                {(Object.keys(activityMeta) as ActivityType[]).map((type) => <MenuItem key={type} value={type}>{activityMeta[type].label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="日期时间"
              type="datetime-local"
              value={toLocalInput(form.dueDate)}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value ? new Date(event.target.value).toISOString() : null })}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Box>
          <TextField label="活动主题 *" value={form.subject ?? ''} onChange={(event) => setForm({ ...form, subject: event.target.value })} fullWidth autoFocus />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="activity-deal">关联商机</InputLabel>
              <Select labelId="activity-deal" label="关联商机" value={form.dealId ? String(form.dealId) : ''} onChange={(event) => setForm({ ...form, dealId: event.target.value ? Number(event.target.value) : null })}>
                <MenuItem value="">未关联</MenuItem>
                {deals?.map((deal) => <MenuItem key={deal.id} value={String(deal.id)}>{deal.title}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="activity-contact">关联联系人</InputLabel>
              <Select labelId="activity-contact" label="关联联系人" value={form.contactId ? String(form.contactId) : ''} onChange={(event) => setForm({ ...form, contactId: event.target.value ? Number(event.target.value) : null })}>
                <MenuItem value="">未关联</MenuItem>
                {contacts?.map((contact) => <MenuItem key={contact.id} value={String(contact.id)}>{contact.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="备注" value={form.notes ?? ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} multiline minRows={3} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.subject?.trim() || createActivity.isPending || updateActivity.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除活动"
        message="确定删除这条活动吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteActivity.mutate(confirmId, { onSuccess: () => setConfirmId(null) })}
      />
    </Box>
  );
}

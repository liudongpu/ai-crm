import { useEffect, useMemo, useState } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  Target,
  Trash2,
  Video,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useActivities,
  useContacts,
  useCreateActivity,
  useDeals,
  useDeleteActivity,
  useUpdateActivity,
} from '@/hooks/useCrm';
import { cn } from '@/lib/utils';
import type { Activity, ActivityInput, ActivityType } from '@/types';

const typeMeta: Record<ActivityType, { label: string; icon: typeof Phone; color: string; bg: string }> = {
  call: { label: '电话', icon: Phone, color: 'text-sky-600', bg: 'bg-sky-50' },
  email: { label: '邮件', icon: Mail, color: 'text-violet-600', bg: 'bg-violet-50' },
  meeting: { label: '会议', icon: Video, color: 'text-amber-600', bg: 'bg-amber-50' },
  task: { label: '任务', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  deadline: { label: '截止', icon: CalendarClock, color: 'text-rose-600', bg: 'bg-rose-50' },
};

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const date = parseISO(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function groupActivities(activities: Activity[]) {
  const groups: Record<string, Activity[]> = { 已逾期: [], 今天: [], 明天: [], 未来: [], 无日期: [] };
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

export function ActivitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<ActivityInput>({ type: 'task', subject: '' });

  const { data: activities, isLoading } = useActivities();
  const { data: deals } = useDeals();
  const { data: contacts } = useContacts();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const visible = useMemo(() => {
    const list = activities ?? [];
    if (filter === 'pending') return list.filter((item) => !item.done);
    if (filter === 'done') return list.filter((item) => item.done);
    return list;
  }, [activities, filter]);

  const groups = useMemo(() => groupActivities(visible), [visible]);
  const doneCount = activities?.filter((item) => item.done).length ?? 0;
  const pendingCount = activities?.filter((item) => !item.done).length ?? 0;

  const openCreate = () => {
    setEditing(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setForm({
      type: 'task',
      subject: '',
      dueDate: tomorrow.toISOString(),
      notes: '',
      dealId: null,
      contactId: null,
    });
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
    if (!form.subject?.trim()) {
      toast.error('请填写活动主题');
      return;
    }
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
          <TabsList>
            <TabsTrigger value="pending">待办 <span className="text-xs opacity-60">{pendingCount}</span></TabsTrigger>
            <TabsTrigger value="done">已完成 <span className="text-xs opacity-60">{doneCount}</span></TabsTrigger>
            <TabsTrigger value="all">全部</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button className="ml-auto" onClick={openCreate}><Plus className="h-4 w-4" /> 新活动</Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
        </div>
      )}

      {!isLoading && (
        <div className="space-y-5">
          {Object.entries(groups).map(([label, items]) =>
            items.length ? (
              <div key={label}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className={cn('text-sm font-semibold', label === '已逾期' && 'text-destructive')}>{label}</h3>
                  <span className="rounded-full bg-secondary px-2 text-[11px] text-muted-foreground">{items.length}</span>
                </div>
                <div className="overflow-hidden rounded-xl border bg-white">
                  <div className="divide-y">
                    {items.map((activity) => {
                      const meta = typeMeta[activity.type];
                      const Icon = meta.icon;
                      return (
                        <div key={activity.id} className={cn('flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40', activity.done && 'opacity-60')}>
                          <Checkbox
                            checked={activity.done}
                            onCheckedChange={(checked) => updateActivity.mutate({ id: activity.id, data: { done: Boolean(checked) } })}
                            aria-label="标记完成"
                          />
                          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.bg, meta.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn('truncate text-sm font-medium', activity.done && 'line-through')}>{activity.subject}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{meta.label}</Badge>
                              {activity.deal && <span>{activity.deal.title}</span>}
                              {activity.contact && <span>· {activity.contact.name}</span>}
                              {activity.notes && <span className="truncate">· {activity.notes}</span>}
                            </div>
                          </div>
                          {activity.dueDate && (
                            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {format(parseISO(activity.dueDate), 'M月d日 HH:mm')}
                            </span>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(activity)} title="编辑">
                            <Target className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (window.confirm('确定删除这条活动吗？')) deleteActivity.mutate(activity.id);
                            }}
                            title="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null,
          )}
          {visible.length === 0 && (
            <div className="rounded-xl border border-dashed py-20 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
              <p className="mt-3 text-sm font-medium">太棒了，当前没有待办活动</p>
              <p className="mt-1 text-xs text-muted-foreground">点击右上角「新活动」安排下一次跟进。</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑活动' : '新建活动'}</DialogTitle>
            <DialogDescription>安排跟进任务，不错过任何成交机会。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>活动类型</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as ActivityType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(typeMeta) as ActivityType[]).map((type) => (
                    <SelectItem key={type} value={type}>{typeMeta[type].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity-due">日期时间</Label>
              <Input
                id="activity-due"
                type="datetime-local"
                value={toLocalInput(form.dueDate)}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="activity-subject">活动主题 *</Label>
              <Input id="activity-subject" value={form.subject ?? ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="例如：致电客户确认方案" />
            </div>
            <div className="space-y-1.5">
              <Label>关联交易</Label>
              <Select value={form.dealId ? String(form.dealId) : 'none'} onValueChange={(value) => setForm({ ...form, dealId: value === 'none' ? null : Number(value) })}>
                <SelectTrigger><SelectValue placeholder="选择交易" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未关联</SelectItem>
                  {deals?.map((deal) => <SelectItem key={deal.id} value={String(deal.id)}>{deal.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>关联联系人</Label>
              <Select value={form.contactId ? String(form.contactId) : 'none'} onValueChange={(value) => setForm({ ...form, contactId: value === 'none' ? null : Number(value) })}>
                <SelectTrigger><SelectValue placeholder="选择联系人" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未关联</SelectItem>
                  {contacts?.map((contact) => <SelectItem key={contact.id} value={String(contact.id)}>{contact.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="activity-notes">备注</Label>
              <Textarea id="activity-notes" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="补充活动说明..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={submit} disabled={createActivity.isPending || updateActivity.isPending}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

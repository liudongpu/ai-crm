import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO } from 'date-fns';
import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  GripVertical,
  LayoutGrid,
  List,
  Plus,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useActivities, useCompanies, useContacts, useCreateDeal, useDeleteDeal, useDeals, useMoveDeal, usePipelines, useUpdateDeal } from '@/hooks/useCrm';
import { cn, formatCurrency } from '@/lib/utils';
import type { Deal, Stage } from '@/types';

const priorityMeta = {
  high: { label: '高优先级', variant: 'danger' as const },
  medium: { label: '中优先级', variant: 'warning' as const },
  low: { label: '低优先级', variant: 'secondary' as const },
};

function DealCard({ deal, onOpen, overlay = false }: { deal: Deal; onOpen?: () => void; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: overlay ? `overlay-${deal.id}` : `deal-${deal.id}`,
    disabled: overlay,
  });

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : { transform: CSS.Translate.toString(transform) }}
      className={cn(
        'group cursor-pointer rounded-xl border border-border bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        isDragging && 'opacity-30',
        overlay && 'rotate-2 shadow-xl',
      )}
      onClick={onOpen}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-semibold leading-snug">{deal.title}</p>
        <GripVertical className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        <span className="truncate">{deal.company?.name ?? '未关联公司'}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">{formatCurrency(deal.value, true)}</span>
        <Badge variant={priorityMeta[deal.priority].variant}>{priorityMeta[deal.priority].label}</Badge>
      </div>
      {deal.expectedCloseDate && (
        <div className="mt-2.5 flex items-center gap-1 border-t border-dashed pt-2 text-[11px] text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          预计 {format(parseISO(deal.expectedCloseDate), 'M月d日')}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  stage,
  deals,
  onOpenDeal,
  onCreate,
}: {
  stage: Stage;
  deals: Deal[];
  onOpenDeal: (deal: Deal) => void;
  onCreate: (stageId: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}` });
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div className="flex w-[268px] shrink-0 flex-col rounded-xl bg-[#f0f3f7] p-2.5">
      <div className="mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
          <span className="text-sm font-semibold">{stage.name}</span>
          <span className="rounded-full bg-white px-1.5 text-[11px] font-medium text-muted-foreground">
            {deals.length}
          </span>
          <button
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-white hover:text-foreground"
            onClick={() => onCreate(stage.id)}
            aria-label={`在${stage.name}中新增交易`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 pl-4 text-[11px] text-muted-foreground">金额合计 {formatCurrency(total, true)}</p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[160px] flex-1 flex-col gap-2 rounded-lg p-1 transition-colors',
          isOver && 'bg-primary/10 ring-2 ring-primary/30',
        )}
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onOpen={() => onOpenDeal(deal)} />
        ))}
        {deals.length === 0 && (
          <button
            onClick={() => onCreate(stage.id)}
            className="rounded-lg border border-dashed border-slate-300 py-6 text-xs text-muted-foreground hover:border-primary hover:text-primary"
          >
            + 添加交易
          </button>
        )}
      </div>
    </div>
  );
}

function DealFormFields({
  form,
  setForm,
  stages,
  companies,
  contacts,
}: {
  form: Record<string, string>;
  setForm: (next: Record<string, string>) => void;
  stages: Stage[];
  companies: Array<{ id: number; name: string }>;
  contacts: Array<{ id: number; name: string }>;
}) {
  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor="deal-title">交易名称 *</Label>
        <Input id="deal-title" value={form.title ?? ''} onChange={(e) => update('title', e.target.value)} placeholder="例如：CRM 系统年度授权" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deal-value">金额 (元) *</Label>
        <Input id="deal-value" type="number" min="0" value={form.value ?? ''} onChange={(e) => update('value', e.target.value)} placeholder="0" />
      </div>
      <div className="space-y-1.5">
        <Label>所在阶段</Label>
        <Select value={form.stageId} onValueChange={(value) => update('stageId', value)}>
          <SelectTrigger><SelectValue placeholder="选择阶段" /></SelectTrigger>
          <SelectContent>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={String(stage.id)}>{stage.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>关联公司</Label>
        <Select value={form.companyId ?? 'none'} onValueChange={(value) => update('companyId', value)}>
          <SelectTrigger><SelectValue placeholder="选择公司" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">未关联</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={String(company.id)}>{company.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>关联联系人</Label>
        <Select value={form.contactId ?? 'none'} onValueChange={(value) => update('contactId', value)}>
          <SelectTrigger><SelectValue placeholder="选择联系人" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">未关联</SelectItem>
            {contacts.map((contact) => (
              <SelectItem key={contact.id} value={String(contact.id)}>{contact.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>优先级</Label>
        <Select value={form.priority ?? 'medium'} onValueChange={(value) => update('priority', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">低</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="high">高</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deal-date">预计成交日</Label>
        <Input id="deal-date" type="date" value={form.expectedCloseDate ?? ''} onChange={(e) => update('expectedCloseDate', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deal-source">来源</Label>
        <Input id="deal-source" value={form.source ?? ''} onChange={(e) => update('source', e.target.value)} placeholder="官网咨询 / 客户推荐" />
      </div>
    </div>
  );
}

function toForm(deal?: Deal | null, stageId?: number): Record<string, string> {
  if (!deal) {
    return {
      title: '',
      value: '',
      stageId: String(stageId ?? ''),
      companyId: 'none',
      contactId: 'none',
      priority: 'medium',
      expectedCloseDate: '',
      source: '',
    };
  }
  return {
    title: deal.title,
    value: String(deal.value),
    stageId: String(deal.stageId),
    companyId: deal.companyId ? String(deal.companyId) : 'none',
    contactId: deal.contactId ? String(deal.contactId) : 'none',
    priority: deal.priority,
    expectedCloseDate: deal.expectedCloseDate ?? '',
    source: deal.source ?? '',
  };
}

function optionalId(value?: string) {
  return !value || value === 'none' ? null : Number(value);
}

export function DealsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [view, setView] = useState<'board' | 'list'>('board');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [activeDrag, setActiveDrag] = useState<Deal | null>(null);

  const { data: pipelines } = usePipelines();
  const [pipelineId, setPipelineId] = useState<number | undefined>();
  const { data: deals, isLoading } = useDeals(search, pipelineId);
  const { data: companies } = useCompanies();
  const { data: contacts } = useContacts();
  const { data: activities } = useActivities({ done: false });
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const moveDeal = useMoveDeal();
  const deleteDeal = useDeleteDeal();

  const stages = pipelines?.[0]?.stages ?? [];
  const effectiveStages = pipelines?.find((item) => item.id === pipelineId)?.stages ?? stages;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingDeal(null);
      setForm(toForm(null, effectiveStages[0]?.id));
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const dealsByStage = useMemo(() => {
    const map = new Map<number, Deal[]>();
    for (const stage of effectiveStages) map.set(stage.id, []);
    for (const deal of deals ?? []) {
      const list = map.get(deal.stageId);
      if (list) list.push(deal);
    }
    return map;
  }, [deals, effectiveStages]);

  const openCreate = (stageId?: number) => {
    setEditingDeal(null);
    setForm(toForm(null, stageId ?? effectiveStages[0]?.id));
    setFormOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setSelectedDeal(null);
    setEditingDeal(deal);
    setForm(toForm(deal));
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.title?.trim() || !form.value) {
      toast.error('请填写交易名称和金额');
      return;
    }
    const payload = {
      title: form.title.trim(),
      value: Number(form.value),
      stageId: Number(form.stageId) || undefined,
      companyId: optionalId(form.companyId),
      contactId: optionalId(form.contactId),
      priority: (form.priority ?? 'medium') as Deal['priority'],
      expectedCloseDate: form.expectedCloseDate || null,
      source: form.source || null,
    };
    if (editingDeal) {
      updateDeal.mutate({ id: editingDeal.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createDeal.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const activeId = String(event.active.id ?? '');
    const overId = String(event.over?.id ?? '');
    if (!activeId.startsWith('deal-') || !overId.startsWith('stage-')) return;
    const dealId = Number(activeId.replace('deal-', ''));
    const stageId = Number(overId.replace('stage-', ''));
    const deal = deals?.find((item) => item.id === dealId);
    if (deal && deal.stageId !== stageId) moveDeal.mutate({ id: dealId, stageId });
  };

  if (isLoading || !pipelines) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-[420px] w-[268px] shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              setSearchParams(value ? { search: value } : {});
            }}
            placeholder="搜索交易名称..."
            className="pl-9"
          />
        </div>
        <Select value={String(pipelineId ?? pipelines[0]?.id ?? '')} onValueChange={(value) => setPipelineId(Number(value))}>
          <SelectTrigger className="w-44"><SelectValue placeholder="销售流程" /></SelectTrigger>
          <SelectContent>
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline.id} value={String(pipeline.id)}>{pipeline.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border bg-white p-0.5">
            <Button variant={view === 'board' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('board')} title="看板视图">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('list')} title="列表视图">
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => openCreate()}>
            <Plus className="h-4 w-4" /> 新交易
          </Button>
        </div>
      </div>

      {view === 'board' ? (
        <DndContext
          sensors={sensors}
          onDragStart={(event) => {
            const deal = deals?.find((item) => `deal-${item.id}` === event.active.id);
            setActiveDrag(deal ?? null);
          }}
          onDragCancel={() => setActiveDrag(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {effectiveStages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage.get(stage.id) ?? []}
                onOpenDeal={setSelectedDeal}
                onCreate={openCreate}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDrag ? <div className="w-[250px]"><DealCard deal={activeDrag} overlay /></div> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">交易</th>
                <th className="px-4 py-3 text-left font-medium">公司 / 联系人</th>
                <th className="px-4 py-3 text-left font-medium">阶段</th>
                <th className="px-4 py-3 text-right font-medium">金额</th>
                <th className="px-4 py-3 text-left font-medium">预计成交</th>
                <th className="px-4 py-3 text-left font-medium">优先级</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deals?.map((deal) => (
                <tr key={deal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDeal(deal)}>
                  <td className="px-4 py-3 font-medium">{deal.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {deal.company?.name ?? '-'} / {deal.contact?.name ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: deal.stage.color }} />
                      {deal.stage.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(deal.value)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {deal.expectedCloseDate ? format(parseISO(deal.expectedCloseDate), 'yyyy-MM-dd') : '-'}
                  </td>
                  <td className="px-4 py-3"><Badge variant={priorityMeta[deal.priority].variant}>{priorityMeta[deal.priority].label}</Badge></td>
                </tr>
              ))}
              {deals?.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">没有找到符合条件的交易</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDeal ? '编辑交易' : '新建交易'}</DialogTitle>
            <DialogDescription>填写交易信息，帮助你更好地推进销售流程。</DialogDescription>
          </DialogHeader>
          <DealFormFields form={form} setForm={setForm} stages={effectiveStages} companies={companies ?? []} contacts={contacts ?? []} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={submitForm} disabled={createDeal.isPending || updateDeal.isPending}>
              {editingDeal ? '保存修改' : '创建交易'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedDeal} onOpenChange={(open) => !open && setSelectedDeal(null)}>
        <DialogContent className="left-auto right-0 top-0 h-full max-w-md translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none border-y-0 border-r-0 p-0">
          {selectedDeal && (
            <>
              <div className="border-b p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={selectedDeal.status === 'won' ? 'success' : selectedDeal.status === 'lost' ? 'danger' : 'info'}>
                    {selectedDeal.status === 'won' ? '已赢单' : selectedDeal.status === 'lost' ? '已输单' : '进行中'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">创建于 {format(new Date(selectedDeal.createdAt), 'yyyy-MM-dd')}</span>
                </div>
                <DialogTitle className="text-xl">{selectedDeal.title}</DialogTitle>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(selectedDeal.value)}</p>
              </div>
              <div className="space-y-5 p-6">
                <div className="space-y-1.5">
                  <Label>阶段</Label>
                  <Select
                    value={String(selectedDeal.stageId)}
                    onValueChange={(value) => {
                      const updated = { ...selectedDeal, stageId: Number(value) };
                      setSelectedDeal(updated);
                      moveDeal.mutate({ id: selectedDeal.id, stageId: Number(value) });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {effectiveStages.map((stage) => (
                        <SelectItem key={stage.id} value={String(stage.id)}>{stage.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">优先级</p>
                    <p className="mt-1 font-medium">{priorityMeta[selectedDeal.priority].label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">预计成交</p>
                    <p className="mt-1 font-medium">{selectedDeal.expectedCloseDate ? format(parseISO(selectedDeal.expectedCloseDate), 'yyyy-MM-dd') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">来源</p>
                    <p className="mt-1 font-medium">{selectedDeal.source ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">成功率</p>
                    <p className="mt-1 font-medium">{selectedDeal.stage.probability}%</p>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {selectedDeal.company?.name ?? '未关联公司'}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {selectedDeal.contact?.name ?? '未关联联系人'}
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    {selectedDeal.currency} · {formatCurrency(selectedDeal.value)}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">相关活动</p>
                  <div className="space-y-2">
                    {activities?.filter((item) => item.dealId === selectedDeal.id).map((activity) => (
                      <div key={activity.id} className="rounded-lg bg-muted/60 p-2.5 text-xs">
                        <p className="font-medium">{activity.subject}</p>
                        <p className="mt-0.5 text-muted-foreground">
                          {activity.dueDate ? format(parseISO(activity.dueDate), 'M月d日 HH:mm') : '未设置时间'}
                        </p>
                      </div>
                    ))}
                    {activities?.filter((item) => item.dealId === selectedDeal.id).length === 0 && (
                      <p className="text-xs text-muted-foreground">暂无相关活动</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => openEdit(selectedDeal)}>编辑交易</Button>
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => {
                      deleteDeal.mutate(selectedDeal.id, { onSuccess: () => setSelectedDeal(null) });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

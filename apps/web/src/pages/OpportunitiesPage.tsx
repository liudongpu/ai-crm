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
import AddOutlined from '@mui/icons-material/AddOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DragIndicator from '@mui/icons-material/DragIndicator';
import SearchIcon from '@mui/icons-material/Search';
import TableRowsOutlined from '@mui/icons-material/TableRowsOutlined';
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import {
  useCompanies,
  useContacts,
  useCreateDeal,
  useDeals,
  useDeleteDeal,
  useMoveDeal,
  usePipelines,
  useUpdateDeal,
} from '@/hooks/useCrm';
import { avatarColor, formatCurrency, formatDate, initials } from '@/lib/format';
import { dealStatusMeta, priorityMeta } from '@/lib/meta';
import type { Deal, DealInput, DealStatus, Stage } from '@/types';

function DealCard({ deal, onOpen, overlay = false }: { deal: Deal; onOpen: () => void; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: overlay ? `overlay-${deal.id}` : `deal-${deal.id}`,
    disabled: overlay,
  });

  return (
    <Paper
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : { transform: CSS.Translate.toString(transform) }}
      onClick={onOpen}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
      sx={{
        p: 1.5,
        cursor: overlay ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        boxShadow: overlay ? 4 : 0,
        borderColor: overlay ? 'primary.main' : 'divider',
        '&:hover': { borderColor: 'primary.light', boxShadow: 1 },
        transition: 'box-shadow .15s, border-color .15s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Typography variant="body2" fontWeight={700} sx={{ flexGrow: 1, lineHeight: 1.4 }}>{deal.title}</Typography>
        <DragIndicator sx={{ fontSize: 16, color: 'text.disabled' }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <Avatar sx={{ width: 20, height: 20, fontSize: 9, bgcolor: avatarColor(deal.company?.name ?? deal.title) }}>
          {initials(deal.company?.name ?? deal.title)}
        </Avatar>
        <Typography variant="caption" color="text.secondary" noWrap>{deal.company?.name ?? '未关联客户'}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
        <Typography variant="body2" fontWeight={700} color="primary.main">{formatCurrency(deal.value, true)}</Typography>
        <Chip size="small" label={priorityMeta[deal.priority].label} color={priorityMeta[deal.priority].color} variant="outlined" />
      </Box>
      {deal.expectedCloseDate && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.25, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
          <CalendarTodayOutlined sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">预计 {formatDate(deal.expectedCloseDate, 'M月d日')}</Typography>
        </Box>
      )}
    </Paper>
  );
}

function KanbanColumn({
  stage,
  deals,
  onOpen,
  onCreate,
}: {
  stage: Stage;
  deals: Deal[];
  onOpen: (deal: Deal) => void;
  onCreate: (stageId: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}` });
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <Box sx={{ width: 272, flexShrink: 0, bgcolor: '#f0f1f2', borderRadius: 2, p: 1.25 }}>
      <Box sx={{ px: 0.5, mb: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: stage.color }} />
          <Typography variant="body2" fontWeight={700}>{stage.name}</Typography>
          <Chip size="small" label={deals.length} sx={{ height: 20, bgcolor: '#fff' }} />
          <Tooltip title="在此阶段新建商机">
            <IconButton size="small" sx={{ ml: 'auto' }} onClick={() => onCreate(stage.id)}><AddOutlined fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ pl: 2.5 }}>金额合计 {formatCurrency(total, true)}</Typography>
      </Box>
      <Box
        ref={setNodeRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: 160,
          p: 0.5,
          borderRadius: 1,
          bgcolor: isOver ? 'rgba(1,118,211,.08)' : 'transparent',
          outline: isOver ? '2px solid' : 'none',
          outlineColor: 'primary.light',
        }}
      >
        {deals.map((deal) => <DealCard key={deal.id} deal={deal} onOpen={() => onOpen(deal)} />)}
        {deals.length === 0 && (
          <Button size="small" variant="text" onClick={() => onCreate(stage.id)} sx={{ border: '1px dashed', borderColor: 'divider', color: 'text.secondary', py: 2 }}>+ 添加商机</Button>
        )}
      </Box>
    </Box>
  );
}

function toForm(deal?: Deal | null, stageId?: number, companyId?: number, contactId?: number): DealInput {
  if (!deal) {
    return {
      title: '', value: 0, stageId: stageId ?? 0, companyId: companyId ?? null, contactId: contactId ?? null,
      priority: 'medium', status: 'open', expectedCloseDate: '', source: '',
    };
  }
  return {
    title: deal.title,
    value: deal.value,
    stageId: deal.stageId,
    companyId: deal.companyId,
    contactId: deal.contactId,
    priority: deal.priority,
    status: deal.status,
    expectedCloseDate: deal.expectedCloseDate ?? '',
    source: deal.source ?? '',
  };
}

export function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const navigate = useNavigate();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState<DealInput>(toForm());
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [activeDrag, setActiveDrag] = useState<Deal | null>(null);
  const [pipelineId, setPipelineId] = useState<number | undefined>();

  const { data: pipelines } = usePipelines();
  const { data: deals, isLoading } = useDeals(search, pipelineId);
  const { data: companies } = useCompanies();
  const { data: contacts } = useContacts();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const moveDeal = useMoveDeal();
  const deleteDeal = useDeleteDeal();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const stages = pipelines?.[0]?.stages ?? [];
  const effectiveStages = pipelines?.find((item) => item.id === pipelineId)?.stages ?? stages;

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setForm(toForm(null, effectiveStages[0]?.id, Number(searchParams.get('companyId')) || undefined, Number(searchParams.get('contactId')) || undefined));
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      next.delete('companyId');
      next.delete('contactId');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), effectiveStages.length]);

  const dealsByStage = useMemo(() => {
    const map = new Map<number, Deal[]>();
    for (const stage of effectiveStages) map.set(stage.id, []);
    for (const deal of deals ?? []) map.get(deal.stageId)?.push(deal);
    return map;
  }, [deals, effectiveStages]);

  const openCreate = (stageId?: number) => {
    setEditing(null);
    setForm(toForm(null, stageId ?? effectiveStages[0]?.id));
    setFormOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setEditing(deal);
    setForm(toForm(deal));
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.title?.trim() || !form.value) return;
    const payload: DealInput = {
      title: form.title.trim(),
      value: Number(form.value),
      stageId: Number(form.stageId) || undefined,
      companyId: form.companyId || null,
      contactId: form.contactId || null,
      priority: form.priority ?? 'medium',
      status: form.status ?? 'open',
      expectedCloseDate: form.expectedCloseDate || null,
      source: form.source || null,
    };
    if (editing) {
      updateDeal.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
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
      <Box sx={{ display: 'flex', gap: 2, overflow: 'hidden' }}>
        {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} variant="rounded" height={420} sx={{ width: 272, flexShrink: 0 }} />)}
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="商机" subtitle={`共 ${deals?.length ?? 0} 个商机 · 拖拽卡片可调整阶段`} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <TextField
          size="small"
          placeholder="搜索商机..."
          value={search}
          onChange={(event) => setSearchParams(event.target.value ? { search: event.target.value } : {})}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          sx={{ width: { xs: '100%', sm: 240 } }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="pipeline-select">销售流程</InputLabel>
          <Select labelId="pipeline-select" label="销售流程" value={String(pipelineId ?? pipelines[0]?.id ?? '')} onChange={(event) => setPipelineId(Number(event.target.value))}>
            {pipelines.map((pipeline) => <MenuItem key={pipeline.id} value={String(pipeline.id)}>{pipeline.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5 }}>
          <ButtonGroup size="small" variant="outlined">
            <Button startIcon={<ViewKanbanOutlined />} variant={view === 'board' ? 'contained' : 'outlined'} onClick={() => setView('board')}>看板</Button>
            <Button startIcon={<TableRowsOutlined />} variant={view === 'list' ? 'contained' : 'outlined'} onClick={() => setView('list')}>列表</Button>
          </ButtonGroup>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => openCreate()}>新建商机</Button>
        </Box>
      </Box>

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
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, alignItems: 'flex-start' }}>
            {effectiveStages.map((stage) => (
              <KanbanColumn key={stage.id} stage={stage} deals={dealsByStage.get(stage.id) ?? []} onOpen={(deal) => navigate(`/opportunities/${deal.id}`)} onCreate={openCreate} />
            ))}
          </Box>
          <DragOverlay dropAnimation={null}>
            {activeDrag ? <Box sx={{ width: 250 }}><DealCard deal={activeDrag} overlay onOpen={() => undefined} /></Box> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>商机名称</TableCell>
                <TableCell>客户 / 联系人</TableCell>
                <TableCell>阶段</TableCell>
                <TableCell>状态</TableCell>
                <TableCell align="right">金额</TableCell>
                <TableCell>预计成交</TableCell>
                <TableCell>优先级</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deals?.map((deal) => (
                <TableRow key={deal.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/opportunities/${deal.id}`)}>
                  <TableCell sx={{ fontWeight: 600 }}>{deal.title}</TableCell>
                  <TableCell>{deal.company?.name ?? '-'} / {deal.contact?.name ?? '-'}</TableCell>
                  <TableCell><Chip size="small" variant="outlined" label={deal.stage.name} /></TableCell>
                  <TableCell><Chip size="small" variant="outlined" color={dealStatusMeta[deal.status].color} label={dealStatusMeta[deal.status].label} /></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(deal.value)}</TableCell>
                  <TableCell>{formatDate(deal.expectedCloseDate)}</TableCell>
                  <TableCell><Chip size="small" variant="outlined" color={priorityMeta[deal.priority].color} label={priorityMeta[deal.priority].label} /></TableCell>
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    <Button size="small" onClick={() => openEdit(deal)}>编辑</Button>
                    <IconButton size="small" color="error" onClick={() => setConfirmId(deal.id)} aria-label="删除"><DeleteOutline fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {deals?.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>没有找到符合条件的商机</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑商机' : '新建商机'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="商机名称 *" value={form.title ?? ''} onChange={(event) => setForm({ ...form, title: event.target.value })} autoFocus fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="金额 (元) *" type="number" value={form.value ?? ''} onChange={(event) => setForm({ ...form, value: Number(event.target.value) })} />
            <FormControl fullWidth>
              <InputLabel id="deal-stage">阶段</InputLabel>
              <Select labelId="deal-stage" label="阶段" value={String(form.stageId ?? '')} onChange={(event) => setForm({ ...form, stageId: Number(event.target.value) })}>
                {effectiveStages.map((stage) => <MenuItem key={stage.id} value={String(stage.id)}>{stage.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="deal-company">客户公司</InputLabel>
              <Select labelId="deal-company" label="客户公司" value={form.companyId ? String(form.companyId) : ''} onChange={(event) => setForm({ ...form, companyId: event.target.value ? Number(event.target.value) : null })}>
                <MenuItem value="">未关联</MenuItem>
                {companies?.map((company) => <MenuItem key={company.id} value={String(company.id)}>{company.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="deal-contact">联系人</InputLabel>
              <Select labelId="deal-contact" label="联系人" value={form.contactId ? String(form.contactId) : ''} onChange={(event) => setForm({ ...form, contactId: event.target.value ? Number(event.target.value) : null })}>
                <MenuItem value="">未关联</MenuItem>
                {contacts?.map((contact) => <MenuItem key={contact.id} value={String(contact.id)}>{contact.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="deal-priority">优先级</InputLabel>
              <Select labelId="deal-priority" label="优先级" value={form.priority ?? 'medium'} onChange={(event) => setForm({ ...form, priority: event.target.value as DealInput['priority'] })}>
                {(Object.keys(priorityMeta) as Array<keyof typeof priorityMeta>).map((key) => <MenuItem key={key} value={key}>{key === 'high' ? '高' : key === 'medium' ? '中' : '低'}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="deal-status">状态</InputLabel>
              <Select labelId="deal-status" label="状态" value={form.status ?? 'open'} onChange={(event) => setForm({ ...form, status: event.target.value as DealStatus })}>
                {(Object.keys(dealStatusMeta) as DealStatus[]).map((key) => <MenuItem key={key} value={key}>{dealStatusMeta[key].label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="预计成交日" type="date" value={form.expectedCloseDate ?? ''} onChange={(event) => setForm({ ...form, expectedCloseDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="来源" value={form.source ?? ''} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="官网 / 客户推荐" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.title?.trim() || !form.value || createDeal.isPending || updateDeal.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除商机"
        message="确定删除该商机吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteDeal.mutate(confirmId, { onSuccess: () => setConfirmId(null) })}
      />
    </Box>
  );
}

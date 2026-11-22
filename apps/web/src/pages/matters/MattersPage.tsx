import { useEffect, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import TableRowsOutlined from '@mui/icons-material/TableRowsOutlined';
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MatterCategorySelect } from '@/components/common/MatterCategorySelect';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import { useClients, useCreateMatter, useDeleteMatter, useMatters, useMatterStages, useMoveMatter, useMyPermissions, useUpdateMatter, useUsers } from '@/hooks/useCrm';
import { formatCurrency, formatDate, toDateInput } from '@/lib/format';
import { matterStatusMeta, priorityMeta } from '@/lib/meta';
import type { Matter, MatterInput, MatterStatus, Priority } from '@/types';

type FormState = {
  title: string;
  caseNumber: string;
  clientId: string;
  stageId: string;
  practiceArea: string;
  status: MatterStatus;
  priority: Priority;
  ownerId: string;
  value: string;
  openDate: string;
  description: string;
};

const emptyForm = (stageId = ''): FormState => ({
  title: '',
  caseNumber: '',
  clientId: '',
  stageId,
  practiceArea: '',
  status: 'open',
  priority: 'medium',
  ownerId: '',
  value: '0',
  openDate: toDateInput(new Date().toISOString()),
  description: '',
});

export function MatterFormDialog({
  open,
  onClose,
  matter,
  defaultStageId,
  stages,
}: {
  open: boolean;
  onClose: () => void;
  matter?: Matter | null;
  defaultStageId?: number;
  stages: Array<{ id: number; name: string }>;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const { data: clients } = useClients();
  const { data: users } = useUsers();
  const createMatter = useCreateMatter();
  const updateMatter = useUpdateMatter();

  useEffect(() => {
    if (!open) return;
    setForm({
      title: matter?.title ?? '',
      caseNumber: matter?.caseNumber ?? '',
      clientId: String(matter?.clientId ?? ''),
      stageId: String(matter?.stageId ?? defaultStageId ?? stages[0]?.id ?? ''),
      practiceArea: matter?.practiceArea ?? '',
      status: matter?.status ?? 'open',
      priority: matter?.priority ?? 'medium',
      ownerId: String(matter?.ownerId ?? ''),
      value: String(matter?.value ?? 0),
      openDate: toDateInput(matter?.openDate ?? new Date().toISOString()),
      description: matter?.description ?? '',
    });
  }, [open, matter, defaultStageId, stages]);

  const submit = () => {
    if (!form.title.trim() || !form.clientId || !form.stageId || !form.practiceArea) return;
    const payload: MatterInput = {
      title: form.title.trim(),
      caseNumber: form.caseNumber.trim() || null,
      clientId: Number(form.clientId),
      stageId: Number(form.stageId),
      practiceArea: form.practiceArea,
      status: form.status,
      priority: form.priority,
      ownerId: form.ownerId ? Number(form.ownerId) : null,
      value: Number(form.value) || 0,
      openDate: form.openDate ? new Date(`${form.openDate}T00:00:00`).toISOString() : undefined,
      description: form.description.trim() || null,
    };
    if (matter) {
      updateMatter.mutate({ id: matter.id, data: payload }, { onSuccess: onClose });
    } else {
      createMatter.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{matter ? '编辑案件' : '新建案件'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField label="案件标题 *" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} fullWidth autoFocus />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label="案号" value={form.caseNumber} onChange={(event) => setForm({ ...form, caseNumber: event.target.value })} fullWidth />
          <MatterCategorySelect
            label="案件类型 *"
            value={form.practiceArea}
            onChange={(practiceArea) => setForm({ ...form, practiceArea })}
            allowEmpty
          />
          <FormControl fullWidth>
            <InputLabel id="matter-client">客户 *</InputLabel>
            <Select labelId="matter-client" label="客户 *" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
              <MenuItem value="">请选择</MenuItem>
              {(clients ?? []).map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="matter-stage">阶段 *</InputLabel>
            <Select labelId="matter-stage" label="阶段 *" value={form.stageId} onChange={(event) => setForm({ ...form, stageId: event.target.value })}>
              <MenuItem value="">请选择</MenuItem>
              {stages.map((stage) => <MenuItem key={stage.id} value={String(stage.id)}>{stage.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="matter-status">状态</InputLabel>
            <Select labelId="matter-status" label="状态" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as MatterStatus })}>
              {(Object.keys(matterStatusMeta) as MatterStatus[]).map((key) => <MenuItem key={key} value={key}>{matterStatusMeta[key].label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="matter-priority">优先级</InputLabel>
            <Select labelId="matter-priority" label="优先级" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>
              {(Object.keys(priorityMeta) as Priority[]).map((key) => <MenuItem key={key} value={key}>{priorityMeta[key].label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="matter-owner">负责人</InputLabel>
            <Select labelId="matter-owner" label="负责人" value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}>
              <MenuItem value="">未指派</MenuItem>
              {(users ?? []).map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="标的金额" type="number" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} fullWidth />
          <TextField label="立案日期" type="date" value={form.openDate} onChange={(event) => setForm({ ...form, openDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Box>
        <TextField label="案件描述" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={2} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button variant="contained" onClick={submit} disabled={!form.title.trim() || !form.clientId || !form.stageId || !form.practiceArea || createMatter.isPending || updateMatter.isPending}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

function SortableMatterCard({ matter, onClick }: { matter: Matter; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: matter.id,
    data: { stageId: matter.stageId },
  });
  return (
    <Paper
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      sx={{
        p: 1.25,
        mb: 1,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transform: CSS.Translate.toString(transform),
        border: '1px solid',
        borderColor: 'divider',
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <Typography variant="body2" fontWeight={700} noWrap>{matter.title}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" noWrap>
        {matter.caseNumber || `客户 #${matter.clientId}`} · {matter.practiceArea}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Chip size="small" label={priorityMeta[matter.priority]?.label ?? matter.priority} color={priorityMeta[matter.priority]?.color} variant="outlined" />
        <Typography variant="caption" fontWeight={700}>{formatCurrency(matter.value, true)}</Typography>
      </Box>
    </Paper>
  );
}

function StageColumn({
  stage,
  matters,
  onOpen,
}: {
  stage: { id: number; name: string; color: string };
  matters: Matter[];
  onOpen: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}`, data: { stageId: stage.id } });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        minWidth: 240,
        flex: '1 0 240px',
        bgcolor: isOver ? '#eef2f7' : '#f8fafc',
        border: '1px solid',
        borderColor: isOver ? 'primary.main' : 'divider',
        borderRadius: 1.5,
        p: 1,
        minHeight: 200,
        transition: 'background-color .15s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, px: 0.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: stage.color }} />
        <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>{stage.name}</Typography>
        <Chip size="small" label={matters.length} />
      </Box>
      {matters.map((matter) => <SortableMatterCard key={matter.id} matter={matter} onClick={() => onOpen(matter.id)} />)}
      {matters.length === 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', py: 3 }}>
          拖拽案件到此阶段
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 0.5, mt: 1 }}>
        合计 {formatCurrency(matters.reduce((sum, item) => sum + Number(item.value || 0), 0), true)}
      </Typography>
    </Box>
  );
}

export function MattersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'list' | 'board'>('list');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MatterStatus | ''>('');
  const [ownerId, setOwnerId] = useState<number | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Matter | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data: stages } = useMatterStages();
  const { data: users } = useUsers();
  const { data: matters, isLoading, isError, error, refetch } = useMatters({
    search: search || undefined,
    status: status || undefined,
    ownerId: ownerId || undefined,
  });
  const { data: clients } = useClients();
  // 演示环境以第一位用户身份操作：是否可新建案件由「查看全部案件」权限决定。
  const { data: myPermissions } = useMyPermissions(users?.[0]?.id);
  const createAllowed = myPermissions?.permissions?.['matter.all'] !== false;
  const deleteMatter = useDeleteMatter();
  const moveMatter = useMoveMatter();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as { stageId?: number } | undefined;
    const overData = over.data.current as { stageId?: number } | undefined;
    const targetStageId = overData?.stageId ?? Number(String(over.id).replace('stage-', ''));
    const matterId = Number(active.id);
    if (!targetStageId || !matterId || activeData?.stageId === targetStageId) return;
    moveMatter.mutate({ id: matterId, stageId: targetStageId });
  };

  const rows = matters ?? [];

  return (
    <Box>
      <PageHeader
        title="案件管理"
        subtitle={`共 ${rows.length} 件案件 · 拖拽看板卡片可更新阶段`}
        actions={
          <>
            <ToggleButtonGroup
              size="small"
              value={mode}
              exclusive
              onChange={(_, value: 'list' | 'board' | null) => value && setMode(value)}
            >
              <ToggleButton value="list"><TableRowsOutlined fontSize="small" sx={{ mr: 0.5 }} />列表</ToggleButton>
              <ToggleButton value="board"><ViewKanbanOutlined fontSize="small" sx={{ mr: 0.5 }} />看板</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }} disabled={!createAllowed}>新建案件</Button>
          </>
        }
      />

      <Paper sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="搜索案件标题 / 案号"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          sx={{ width: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="filter-status">状态</InputLabel>
          <Select labelId="filter-status" label="状态" value={status} onChange={(event) => setStatus(event.target.value as MatterStatus | '')}>
            <MenuItem value="">全部状态</MenuItem>
            {(Object.keys(matterStatusMeta) as MatterStatus[]).map((key) => <MenuItem key={key} value={key}>{matterStatusMeta[key].label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="filter-owner">负责人</InputLabel>
          <Select labelId="filter-owner" label="负责人" value={ownerId} onChange={(event) => setOwnerId(event.target.value as number | '')}>
            <MenuItem value="">全部人员</MenuItem>
            {(users ?? []).map((user) => <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button size="small" onClick={() => { setSearch(''); setStatus(''); setOwnerId(''); }}>重置</Button>
      </Paper>

      {isError && <ErrorState message={error?.message ?? '案件加载失败'} onRetry={() => void refetch()} />}

      {mode === 'list' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>案件</TableCell>
                <TableCell>客户</TableCell>
                <TableCell>阶段</TableCell>
                <TableCell>案件类型</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>优先级</TableCell>
                <TableCell>负责人</TableCell>
                <TableCell align="right">标的金额</TableCell>
                <TableCell>立案日期</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <LoadingRows columns={10} />}
              {rows.map((matter) => (
                <TableRow key={matter.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/matters/${matter.id}`)}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{matter.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{matter.caseNumber || '未编号'}</Typography>
                  </TableCell>
                  <TableCell>{clients?.find((client) => client.id === matter.clientId)?.name ?? `#${matter.clientId}`}</TableCell>
                  <TableCell><Chip size="small" variant="outlined" label={matter.stage?.name ?? stages?.find((stage) => stage.id === matter.stageId)?.name ?? `阶段 #${matter.stageId}`} /></TableCell>
                  <TableCell>{matter.practiceArea}</TableCell>
                  <TableCell><Chip size="small" variant="outlined" label={matterStatusMeta[matter.status]?.label ?? matter.status} color={matterStatusMeta[matter.status]?.color} /></TableCell>
                  <TableCell><Chip size="small" variant="outlined" label={priorityMeta[matter.priority]?.label ?? matter.priority} color={priorityMeta[matter.priority]?.color} /></TableCell>
                  <TableCell>{users?.find((user) => user.id === matter.ownerId)?.name ?? '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(matter.value, true)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(matter.openDate)}</TableCell>
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    <IconButton size="small" onClick={() => { setEditing(matter); setFormOpen(true); }} aria-label="编辑案件"><EditOutlined fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirmId(matter.id)} aria-label="删除案件"><DeleteOutline fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 && <EmptyRow columns={10} text="没有符合条件的案件" />}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {mode === 'board' && (
        <Box sx={{ overflowX: 'auto', pb: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', gap: 2 }}>{Array.from({ length: 6 }).map((_, index) => <Paper key={index} sx={{ minWidth: 240, height: 220, p: 2 }}><LoadingRows columns={1} count={3} /></Paper>)}</Box>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                {(stages ?? []).map((stage) => (
                  <StageColumn
                    key={stage.id}
                    stage={stage}
                    matters={rows.filter((matter) => matter.stageId === stage.id)}
                    onOpen={(id) => navigate(`/matters/${id}`)}
                  />
                ))}
              </Box>
            </DndContext>
          )}
        </Box>
      )}

      <MatterFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        matter={editing}
        stages={stages ?? []}
      />
      <ConfirmDialog
        open={confirmId !== null}
        title="删除案件"
        message="确定删除该案件吗？相关记录不会自动删除。"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteMatter.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
    </Box>
  );
}

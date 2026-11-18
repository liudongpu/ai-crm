import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip, { type ChipProps } from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Field, FieldGrid } from '@/components/common/Field';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import { useToast } from '@/components/common/ToastProvider';
import {
  useCreateFeatureRecord,
  useDeleteFeatureRecord,
  useFeatureCatalog,
  useFeatureRecords,
  useFeatureStats,
  useUpdateFeatureRecord,
} from '@/hooks/useCrm';
import { formatCurrency, formatDate, formatDateTime, toDateInput } from '@/lib/format';
import { priorityMeta } from '@/lib/meta';
import type { FeatureRecord, FeatureRecordInput, FeatureStatus, Priority } from '@/types';

const columns = 8;
const statuses: FeatureStatus[] = ['draft', 'active', 'pending', 'completed', 'archived'];
const priorities: Priority[] = ['low', 'medium', 'high'];
const demoModules = ['integrations', 'work_ai', 'security'];

const statusMeta: Record<FeatureStatus, { label: string; color: ChipProps['color'] }> = {
  draft: { label: '草稿', color: 'default' },
  active: { label: '进行中', color: 'info' },
  pending: { label: '待处理', color: 'warning' },
  completed: { label: '已完成', color: 'success' },
  archived: { label: '已归档', color: 'secondary' },
};

type FormState = {
  title: string;
  description: string;
  status: FeatureStatus;
  priority: Priority;
  ownerId: string;
  ownerName: string;
  dueDate: string;
  amount: string;
  data: string;
};

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  status: 'draft',
  priority: 'medium',
  ownerId: '',
  ownerName: '',
  dueDate: '',
  amount: '',
  data: '',
});

export function FeaturePage() {
  const { featureCode = '' } = useParams();
  const toast = useToast();
  const { data: catalog } = useFeatureCatalog();
  const current = (catalog ?? [])
    .flatMap((module) => module.features.map((feature) => ({ module, feature })))
    .find((entry) => entry.feature.code === featureCode);
  const feature = current?.feature;
  const module = current?.module;

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FeatureStatus | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FeatureRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [detail, setDetail] = useState<FeatureRecord | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const {
    data: records,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useFeatureRecords({
    featureCode,
    status: status || undefined,
    search: query || undefined,
  });
  const { data: stats, isLoading: statsLoading } = useFeatureStats(featureCode);
  const createRecord = useCreateFeatureRecord();
  const updateRecord = useUpdateFeatureRecord();
  const deleteRecord = useDeleteFeatureRecord();

  useEffect(() => {
    setQuery('');
    setStatus('');
    setPriority('');
    setPage(0);
    setFormOpen(false);
    setEditing(null);
    setDetail(null);
    setConfirmId(null);
  }, [featureCode]);

  const rows = (records ?? []).filter((record) => priority === '' || record.priority === priority);
  const safePage = Math.min(page, Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1));
  const pageRows = rows.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (record: FeatureRecord) => {
    setEditing(record);
    setForm({
      title: record.title,
      description: record.description ?? '',
      status: record.status ?? 'draft',
      priority: record.priority ?? 'medium',
      ownerId: record.ownerId ? String(record.ownerId) : '',
      ownerName: record.ownerName ?? '',
      dueDate: toDateInput(record.dueDate),
      amount: record.amount != null ? String(record.amount) : '',
      data: record.data ? JSON.stringify(record.data, null, 2) : '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.warning('请填写标题');
      return;
    }
    let data: Record<string, unknown> | null = null;
    if (form.data.trim()) {
      try {
        const parsed: unknown = JSON.parse(form.data);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('data 必须是 JSON 对象');
        }
        data = parsed as Record<string, unknown>;
      } catch {
        toast.error('data 必须是合法的 JSON 对象');
        return;
      }
    }

    const payload: FeatureRecordInput = {
      featureCode,
      title: form.title.trim(),
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      ownerId: form.ownerId ? Number(form.ownerId) : null,
      ownerName: form.ownerName || null,
      dueDate: form.dueDate ? new Date(`${form.dueDate}T00:00:00`).toISOString() : null,
      amount: form.amount !== '' ? Number(form.amount) : null,
      data,
    };

    try {
      if (editing) {
        await updateRecord.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createRecord.mutateAsync(payload);
      }
      setFormOpen(false);
      setEditing(null);
    } catch {
      // Error toast is shown by the mutation hooks.
    }
  };

  const statCards: Array<{ key: 'total' | FeatureStatus; label: string }> = [
    { key: 'total', label: '总数' },
    { key: 'draft', label: '草稿' },
    { key: 'active', label: '进行中' },
    { key: 'pending', label: '待处理' },
    { key: 'completed', label: '已完成' },
    { key: 'archived', label: '已归档' },
  ];

  return (
    <Box>
      <PageHeader
        title={feature?.name ?? featureCode}
        subtitle={feature?.description ?? '管理该功能下的业务记录、状态流转与负责人'}
      >
        {module && demoModules.includes(module.code) && (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            该模块为本地演示能力，用于配置与跟踪，不代表已完成真实第三方对接或法律AI推理。
          </Alert>
        )}
        {!feature && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            功能目录中未找到该编码，仍可按当前编码直接管理记录。
          </Alert>
        )}
      </PageHeader>

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, mb: 2 }}>
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              {statsLoading ? (
                <Skeleton variant="text" width={40} height={30} />
              ) : (
                <Typography variant="h6">
                  {card.key === 'total' ? (stats?.total ?? 0) : (stats?.byStatus[card.key] ?? 0)}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          <TextField
            size="small"
            placeholder="搜索标题或说明"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            sx={{ width: 240 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="feature-status-filter">状态</InputLabel>
            <Select
              labelId="feature-status-filter"
              label="状态"
              value={status}
              onChange={(event) => { setStatus(event.target.value as FeatureStatus | ''); setPage(0); }}
            >
              <MenuItem value="">全部状态</MenuItem>
              {statuses.map((item) => <MenuItem key={item} value={item}>{statusMeta[item].label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="feature-priority-filter">优先级</InputLabel>
            <Select
              labelId="feature-priority-filter"
              label="优先级"
              value={priority}
              onChange={(event) => { setPriority(event.target.value as Priority | ''); setPage(0); }}
            >
              <MenuItem value="">全部优先级</MenuItem>
              {priorities.map((item) => <MenuItem key={item} value={item}>{priorityMeta[item].label}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title="刷新">
            <IconButton onClick={() => void refetch()} aria-label="刷新" disabled={isFetching}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>新建记录</Button>
        </Stack>
      </Paper>

      {isError && <ErrorState message={error?.message ?? '功能记录加载失败'} onRetry={() => void refetch()} />}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>标题</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>优先级</TableCell>
              <TableCell>负责人</TableCell>
              <TableCell>截止日期</TableCell>
              <TableCell>金额</TableCell>
              <TableCell>更新时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <LoadingRows columns={columns} />}
            {!isLoading && pageRows.map((record) => (
              <TableRow key={record.id} hover>
                <TableCell>
                  <Button
                    size="small"
                    sx={{ p: 0, minWidth: 0, textTransform: 'none', justifyContent: 'flex-start' }}
                    onClick={() => setDetail(record)}
                  >
                    {record.title}
                  </Button>
                  {record.description && (
                    <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 260 }}>
                      {record.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={statusMeta[record.status]?.label ?? record.status}
                    color={statusMeta[record.status]?.color ?? 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" label={priorityMeta[record.priority]?.label ?? record.priority} color={priorityMeta[record.priority]?.color ?? 'default'} />
                </TableCell>
                <TableCell>{record.ownerName ?? (record.ownerId ? `#${record.ownerId}` : '—')}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(record.dueDate)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{record.amount != null ? formatCurrency(record.amount) : '—'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(record.updatedAt)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setDetail(record)} aria-label="查看详情"><SearchIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => openEdit(record)} aria-label="编辑记录"><EditOutlined fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setConfirmId(record.id)} aria-label="删除记录"><DeleteOutline fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !isError && pageRows.length === 0 && (
              <EmptyRow columns={columns} text="暂无符合条件的记录，点击“新建记录”开始" />
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={rows.length}
        page={safePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={(_, next) => setPage(next)}
        onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
        labelRowsPerPage="每页"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑记录' : '新建记录'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mt: 1 }}>
            <TextField
              label="标题"
              required
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="说明"
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              multiline
              minRows={2}
              sx={{ gridColumn: '1 / -1' }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="record-status-label">状态</InputLabel>
              <Select labelId="record-status-label" label="状态" value={form.status} onChange={(event) => setField('status', event.target.value as FeatureStatus)}>
                {statuses.map((item) => <MenuItem key={item} value={item}>{statusMeta[item].label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel id="record-priority-label">优先级</InputLabel>
              <Select labelId="record-priority-label" label="优先级" value={form.priority} onChange={(event) => setField('priority', event.target.value as Priority)}>
                {priorities.map((item) => <MenuItem key={item} value={item}>{priorityMeta[item].label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="负责人 ID" type="number" value={form.ownerId} onChange={(event) => setField('ownerId', event.target.value)} />
            <TextField label="负责人姓名" value={form.ownerName} onChange={(event) => setField('ownerName', event.target.value)} />
            <TextField label="截止日期" type="date" value={form.dueDate} onChange={(event) => setField('dueDate', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="金额" type="number" value={form.amount} onChange={(event) => setField('amount', event.target.value)} />
            <TextField
              label="附加数据 (JSON 对象)"
              value={form.data}
              onChange={(event) => setField('data', event.target.value)}
              multiline
              minRows={3}
              placeholder='{"key": "value"}'
              slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">取消</Button>
          <Button
            onClick={() => void handleSubmit()}
            variant="contained"
            disabled={createRecord.isPending || updateRecord.isPending}
          >
            {editing ? '保存' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={detail !== null} onClose={() => setDetail(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 2.5 } }}>
        {detail && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6">{detail.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {statusMeta[detail.status]?.label ?? detail.status} · 更新于 {formatDateTime(detail.updatedAt)}
                </Typography>
              </Box>
              <Button size="small" startIcon={<EditOutlined />} onClick={() => openEdit(detail)}>编辑</Button>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <FieldGrid columns={2}>
              <Field label="功能编码">{detail.featureCode}</Field>
              <Field label="优先级">{priorityMeta[detail.priority]?.label ?? detail.priority}</Field>
              <Field label="负责人">{detail.ownerName ?? (detail.ownerId ? `#${detail.ownerId}` : undefined)}</Field>
              <Field label="截止日期">{formatDate(detail.dueDate)}</Field>
              <Field label="金额">{detail.amount != null ? formatCurrency(detail.amount) : undefined}</Field>
              <Field label="关联案件">{detail.matterId ? `#${detail.matterId}` : undefined}</Field>
              <Field label="关联客户">{detail.clientId ? `#${detail.clientId}` : undefined}</Field>
              <Field label="创建时间">{formatDateTime(detail.createdAt)}</Field>
              <Field label="说明" span={2}>{detail.description}</Field>
            </FieldGrid>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, mb: 0.5 }}>
              附加数据 (JSON)
            </Typography>
            <Box
              component="pre"
              sx={{ m: 0, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, fontSize: 12, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {JSON.stringify(detail.data ?? {}, null, 2)}
            </Box>
          </Box>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除记录"
        message="确定删除该记录吗？此操作不可撤销。"
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId !== null) {
            deleteRecord.mutate(confirmId, {
              onSuccess: () => { setConfirmId(null); setDetail(null); },
            });
          }
        }}
      />
    </Box>
  );
}

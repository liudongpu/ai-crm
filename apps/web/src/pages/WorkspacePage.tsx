import { useEffect, useState } from 'react';
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
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Field, FieldGrid } from '@/components/common/Field';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import { useToast } from '@/components/common/ToastProvider';
import {
  useCreateWorkspaceItem,
  useDeleteWorkspaceItem,
  useFeatureCatalog,
  useUpdateWorkspaceItem,
  useUpdateWorkspaceSettings,
  useWorkspaceDefinition,
  useWorkspaceItems,
  useWorkspaceSettings,
  useWorkspaceStats,
} from '@/hooks/useCrm';
import { formatCurrency, formatDate, formatDateTime, toDateInput } from '@/lib/format';
import type {
  WorkspaceFieldDef,
  WorkspaceItem,
  WorkspaceItemInput,
  WorkspaceSettingDef,
} from '@/types';

const KIND_LABEL: Record<string, string> = {
  business: '业务工作台',
  config: '本地配置台',
  analytics: '分析工作台',
};

type FormState = {
  title: string;
  summary: string;
  status: string;
  ownerName: string;
  dueDate: string;
  amount: string;
  values: Record<string, string>;
};

function emptyForm(defaultStatus: string): FormState {
  return {
    title: '',
    summary: '',
    status: defaultStatus,
    ownerName: '',
    dueDate: '',
    amount: '',
    values: {},
  };
}

function fieldValue(field: WorkspaceFieldDef, value: string | undefined) {
  if (value === undefined || value === null || value === '') return '—';
  if (field.type === 'currency') {
    const numeric = Number(value);
    return Number.isNaN(numeric) ? value : formatCurrency(numeric);
  }
  return value;
}

export function WorkspacePage({ code }: { code: string }) {
  const toast = useToast();
  const { data: catalog } = useFeatureCatalog();
  const current = (catalog ?? [])
    .flatMap((module) => module.features.map((feature) => ({ module, feature })))
    .find((entry) => entry.feature.code === code);
  const feature = current?.feature;
  const module = current?.module;

  const {
    data: definition,
    isLoading: definitionLoading,
    isError: definitionError,
    error: definitionErrorObject,
    refetch: refetchDefinition,
  } = useWorkspaceDefinition(code);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tab, setTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WorkspaceItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm('待处理'));
  const [detail, setDetail] = useState<WorkspaceItem | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({});

  const {
    data: items,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useWorkspaceItems({
    featureCode: code,
    status: status || undefined,
    search: query || undefined,
  });
  const { data: stats, isLoading: statsLoading } = useWorkspaceStats(code);
  const { data: settings, isLoading: settingsLoading } = useWorkspaceSettings(code);
  const createItem = useCreateWorkspaceItem();
  const updateItem = useUpdateWorkspaceItem();
  const deleteItem = useDeleteWorkspaceItem();
  const saveSettings = useUpdateWorkspaceSettings(code);

  useEffect(() => {
    setQuery('');
    setStatus('');
    setPage(0);
    setTab(0);
    setFormOpen(false);
    setEditing(null);
    setDetail(null);
    setConfirmId(null);
  }, [code]);

  useEffect(() => {
    setForm(emptyForm(definition?.statuses[0]?.value ?? '待处理'));
  }, [definition]);

  useEffect(() => {
    const draft: Record<string, string> = {};
    (settings ?? []).forEach((setting) => {
      draft[setting.key] = setting.value;
    });
    setSettingsDraft(draft);
  }, [settings]);

  const rows = items ?? [];
  const safePage = Math.min(page, Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1));
  const pageRows = rows.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);
  const fields = definition?.fields ?? [];
  const statuses = definition?.statuses ?? [];
  const settingDefs = definition?.settings ?? [];
  const hasSettings = settingDefs.length > 0;

  const statusChip = (value: string) => {
    const matched = statuses.find((item) => item.value === value);
    return (
      <Chip
        size="small"
        variant="outlined"
        label={matched?.label ?? value}
        color={(matched?.color as ChipProps['color']) ?? 'default'}
      />
    );
  };

  const setFormField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setFieldValue = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, values: { ...prev.values, [key]: value } }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(statuses[0]?.value ?? '待处理'));
    setFormOpen(true);
  };

  const openEdit = (item: WorkspaceItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      summary: item.summary ?? '',
      status: item.status,
      ownerName: item.ownerName ?? '',
      dueDate: toDateInput(item.dueDate),
      amount: item.amount != null ? String(item.amount) : '',
      values: { ...(item.data ?? {}) },
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.warning('请填写标题');
      return;
    }
    const values: Record<string, string> = {};
    for (const field of fields) {
      const value = form.values[field.key];
      if (value !== undefined && value !== '') values[field.key] = value;
    }
    const payload: WorkspaceItemInput = {
      featureCode: code,
      title: form.title.trim(),
      summary: form.summary || null,
      status: form.status,
      ownerName: form.ownerName || null,
      dueDate: form.dueDate ? new Date(`${form.dueDate}T00:00:00`).toISOString() : null,
      amount: form.amount !== '' ? Number(form.amount) : null,
      data: values,
    };
    try {
      if (editing) {
        await updateItem.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createItem.mutateAsync(payload);
      }
      setFormOpen(false);
      setEditing(null);
    } catch {
      // mutation hooks surface the error toast
    }
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings.mutateAsync(
        settingDefs.map((setting) => ({ key: setting.key, value: settingsDraft[setting.key] ?? setting.defaultValue })),
      );
    } catch {
      // mutation hook surfaces the error toast
    }
  };

  const renderDynamicField = (field: WorkspaceFieldDef) => {
    const value = form.values[field.key] ?? '';
    const common = { label: field.label, fullWidth: true, size: 'small' as const };
    if (field.type === 'textarea') {
      return (
        <TextField
          key={field.key}
          {...common}
          value={value}
          onChange={(event) => setFieldValue(field.key, event.target.value)}
          multiline
          minRows={2}
          sx={{ gridColumn: '1 / -1' }}
        />
      );
    }
    if (field.type === 'select') {
      return (
        <FormControl key={field.key} size="small" fullWidth>
          <InputLabel id={`ws-field-${field.key}`}>{field.label}</InputLabel>
          <Select
            labelId={`ws-field-${field.key}`}
            label={field.label}
            value={value}
            onChange={(event) => setFieldValue(field.key, event.target.value)}
          >
            {(field.options ?? []).map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    if (field.type === 'date') {
      return (
        <TextField
          key={field.key}
          {...common}
          type="date"
          value={value}
          onChange={(event) => setFieldValue(field.key, event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      );
    }
    return (
      <TextField
        key={field.key}
        {...common}
        type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
        value={value}
        onChange={(event) => setFieldValue(field.key, event.target.value)}
      />
    );
  };

  const renderSettingControl = (setting: WorkspaceSettingDef) => {
    const value = settingsDraft[setting.key] ?? setting.defaultValue;
    const setValue = (next: string) =>
      setSettingsDraft((prev) => ({ ...prev, [setting.key]: next }));

    if (setting.type === 'switch') {
      return (
        <FormControlLabel
          key={setting.key}
          control={
            <Switch
              checked={value === 'true'}
              onChange={(event) => setValue(event.target.checked ? 'true' : 'false')}
            />
          }
          label={setting.label}
        />
      );
    }
    if (setting.type === 'select') {
      return (
        <FormControl key={setting.key} size="small" sx={{ minWidth: 200 }}>
          <InputLabel id={`ws-setting-${setting.key}`}>{setting.label}</InputLabel>
          <Select
            labelId={`ws-setting-${setting.key}`}
            label={setting.label}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          >
            {(setting.options ?? []).map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    return (
      <TextField
        key={setting.key}
        size="small"
        label={setting.label}
        type={setting.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        sx={{ minWidth: 220 }}
      />
    );
  };

  return (
    <Box>
      <PageHeader
        title={feature?.name ?? code}
        subtitle={feature?.description ?? '按该功能的专属字段、状态与配置承载真实业务数据'}
      >
        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
          {definition && <Chip size="small" label={KIND_LABEL[definition.kind] ?? '工作台'} color="primary" variant="outlined" />}
          {module && <Chip size="small" label={module.name} variant="outlined" />}
        </Stack>
        {definition?.kind === 'config' && hasSettings && (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            该功能的开关与参数保存在当前演示库中，可真实修改并持久化；不会发起对第三方系统的调用。
          </Alert>
        )}
        {definition?.kind === 'analytics' && (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            该分析页基于当前演示库中的真实记录进行统计与跟踪。
          </Alert>
        )}
        {!feature && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            功能目录中未找到该编码，仍可按当前编码直接使用工作台。
          </Alert>
        )}
      </PageHeader>

      {definitionLoading && (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(4, 1fr)', mb: 2 }}>
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} variant="rounded" height={70} />)}
        </Box>
      )}
      {definitionError && (
        <ErrorState
          message={definitionErrorObject?.message ?? '功能定义加载失败'}
          onRetry={() => void refetchDefinition()}
        />
      )}

      {definition && (
        <>
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: `repeat(${Math.min(statuses.length + 1, 6)}, 1fr)` },
              mb: 2,
            }}
          >
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">总数</Typography>
                {statsLoading ? <Skeleton variant="text" width={40} height={30} /> : (
                  <Typography variant="h6">{stats?.total ?? 0}</Typography>
                )}
              </CardContent>
            </Card>
            {statuses.map((item) => (
              <Card key={item.value}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  {statsLoading ? <Skeleton variant="text" width={40} height={30} /> : (
                    <Typography variant="h6">{stats?.byStatus[item.value] ?? 0}</Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={tab}
              onChange={(_, next) => setTab(next)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 1 }}
            >
              <Tab label="业务记录" />
              {hasSettings && <Tab label="本地配置" />}
            </Tabs>
          </Paper>

          {tab === 0 && (
            <>
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
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="ws-status-filter">状态</InputLabel>
                    <Select
                      labelId="ws-status-filter"
                      label="状态"
                      value={status}
                      onChange={(event) => { setStatus(event.target.value); setPage(0); }}
                    >
                      <MenuItem value="">全部状态</MenuItem>
                      {statuses.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
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

              {isError && <ErrorState message={error?.message ?? '记录加载失败'} onRetry={() => void refetch()} />}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>标题</TableCell>
                      {fields.map((field) => <TableCell key={field.key}>{field.label}</TableCell>)}
                      <TableCell>状态</TableCell>
                      <TableCell>负责人</TableCell>
                      <TableCell>截止日期</TableCell>
                      <TableCell>金额</TableCell>
                      <TableCell>更新时间</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading && <LoadingRows columns={fields.length + 6} />}
                    {!isLoading && pageRows.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Button
                            size="small"
                            sx={{ p: 0, minWidth: 0, textTransform: 'none', justifyContent: 'flex-start' }}
                            onClick={() => setDetail(item)}
                          >
                            {item.title}
                          </Button>
                          {item.summary && (
                            <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 240 }}>
                              {item.summary}
                            </Typography>
                          )}
                        </TableCell>
                        {fields.map((field) => (
                          <TableCell key={field.key} sx={{ whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {fieldValue(field, item.data?.[field.key])}
                          </TableCell>
                        ))}
                        <TableCell>{statusChip(item.status)}</TableCell>
                        <TableCell>{item.ownerName ?? '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(item.dueDate)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {item.amount != null ? formatCurrency(item.amount) : '—'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.updatedAt)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => setDetail(item)} aria-label="查看详情"><SearchIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => openEdit(item)} aria-label="编辑记录"><EditOutlined fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => setConfirmId(item.id)} aria-label="删除记录"><DeleteOutline fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && !isError && pageRows.length === 0 && (
                      <EmptyRow columns={fields.length + 6} text="暂无符合条件的记录，点击“新建记录”开始" />
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
            </>
          )}

          {tab === 1 && hasSettings && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>本地配置</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  修改后点击“保存配置”，设置将写入当前演示库并立即生效。
                </Typography>
                <Divider sx={{ my: 2 }} />
                {settingsLoading ? (
                  <LoadingRows columns={2} />
                ) : (
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    {settingDefs.map(renderSettingControl)}
                  </Box>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                  <Button variant="contained" onClick={() => void handleSaveSettings()} disabled={saveSettings.isPending}>
                    保存配置
                  </Button>
                  <Button
                    color="inherit"
                    onClick={() => {
                      const defaults: Record<string, string> = {};
                      settingDefs.forEach((setting) => { defaults[setting.key] = setting.defaultValue; });
                      setSettingsDraft(defaults);
                    }}
                  >
                    恢复默认
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑记录' : '新建记录'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mt: 1 }}>
            <TextField
              label="标题"
              required
              value={form.title}
              onChange={(event) => setFormField('title', event.target.value)}
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="说明"
              value={form.summary}
              onChange={(event) => setFormField('summary', event.target.value)}
              multiline
              minRows={2}
              sx={{ gridColumn: '1 / -1' }}
            />
            {fields.map(renderDynamicField)}
            <FormControl size="small" fullWidth>
              <InputLabel id="ws-form-status">状态</InputLabel>
              <Select
                labelId="ws-form-status"
                label="状态"
                value={form.status}
                onChange={(event) => setFormField('status', event.target.value)}
              >
                {statuses.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="负责人" value={form.ownerName} onChange={(event) => setFormField('ownerName', event.target.value)} />
            <TextField
              label="截止日期"
              type="date"
              value={form.dueDate}
              onChange={(event) => setFormField('dueDate', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="金额"
              type="number"
              value={form.amount}
              onChange={(event) => setFormField('amount', event.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">取消</Button>
          <Button
            onClick={() => void handleSubmit()}
            variant="contained"
            disabled={createItem.isPending || updateItem.isPending}
          >
            {editing ? '保存' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={detail !== null}
        onClose={() => setDetail(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 2.5 } }}
      >
        {detail && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6">{detail.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {statuses.find((item) => item.value === detail.status)?.label ?? detail.status} · 更新于 {formatDateTime(detail.updatedAt)}
                </Typography>
              </Box>
              <Button size="small" startIcon={<EditOutlined />} onClick={() => openEdit(detail)}>编辑</Button>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <FieldGrid columns={2}>
              <Field label="状态">{statuses.find((item) => item.value === detail.status)?.label ?? detail.status}</Field>
              <Field label="负责人">{detail.ownerName}</Field>
              <Field label="截止日期">{formatDate(detail.dueDate)}</Field>
              <Field label="金额">{detail.amount != null ? formatCurrency(detail.amount) : undefined}</Field>
              <Field label="创建时间">{formatDateTime(detail.createdAt)}</Field>
              <Field label="说明" span={2}>{detail.summary}</Field>
            </FieldGrid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>专属字段</Typography>
            <FieldGrid columns={2}>
              {fields.map((field) => (
                <Field key={field.key} label={field.label}>{fieldValue(field, detail.data?.[field.key])}</Field>
              ))}
            </FieldGrid>
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
            deleteItem.mutate(confirmId, {
              onSuccess: () => { setConfirmId(null); setDetail(null); },
            });
          }
        }}
      />
    </Box>
  );
}

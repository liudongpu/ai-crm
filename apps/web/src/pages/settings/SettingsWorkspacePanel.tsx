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
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Field, FieldGrid } from '@/components/common/Field';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import { useToast } from '@/components/common/ToastProvider';
import {
  useCreateWorkspaceItem,
  useDeleteWorkspaceItem,
  useUpdateWorkspaceItem,
  useUpdateWorkspaceSettings,
  useWorkspaceDefinition,
  useWorkspaceItems,
  useWorkspaceSettings,
  useWorkspaceStats,
} from '@/hooks/useCrm';
import { formatDate, formatDateTime, toDateInput } from '@/lib/format';
import type {
  WorkspaceFieldDef,
  WorkspaceItem,
  WorkspaceItemInput,
  WorkspaceSettingDef,
} from '@/types';

type FormState = {
  title: string;
  summary: string;
  status: string;
  ownerName: string;
  dueDate: string;
  values: Record<string, string>;
};

function emptyForm(status: string): FormState {
  return { title: '', summary: '', status, ownerName: '', dueDate: '', values: {} };
}

/**
 * 设置安全模块的专用配置面板：配置开关与记录均通过 /api/workspace 读写当前演示库，
 * 不复用其他模块的通用工作台页面，也不发起对第三方系统的调用。
 */
export function SettingsWorkspacePanel({ code }: { code: string }) {
  const toast = useToast();
  const {
    data: definition,
    isLoading: definitionLoading,
    isError: definitionError,
    error: definitionErrorObject,
    refetch: refetchDefinition,
  } = useWorkspaceDefinition(code);
  const { data: items, isLoading, isFetching, isError, error, refetch } = useWorkspaceItems({
    featureCode: code,
  });
  const { data: stats } = useWorkspaceStats(code);
  const { data: settings } = useWorkspaceSettings(code);
  const createItem = useCreateWorkspaceItem();
  const updateItem = useUpdateWorkspaceItem();
  const deleteItem = useDeleteWorkspaceItem();
  const saveSettings = useUpdateWorkspaceSettings(code);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WorkspaceItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm('待处理'));
  const [detail, setDetail] = useState<WorkspaceItem | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    setQuery('');
    setStatus('');
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
    (settings ?? []).forEach((setting) => { draft[setting.key] = setting.value; });
    setSettingsDraft(draft);
  }, [settings]);

  const statuses = definition?.statuses ?? [];
  const fields = definition?.fields ?? [];
  const settingDefs = definition?.settings ?? [];
  const allRows = items ?? [];
  const keyword = query.trim().toLowerCase();
  const rows = allRows.filter((item) => {
    const matchesStatus = !status || item.status === status;
    const matchesKeyword = !keyword ||
      item.title.toLowerCase().includes(keyword) ||
      (item.summary ?? '').toLowerCase().includes(keyword);
    return matchesStatus && matchesKeyword;
  });

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
      values: { ...(item.data ?? {}) },
    });
    setFormOpen(true);
  };

  const submit = async () => {
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
      data: values,
    };
    try {
      if (editing) await updateItem.mutateAsync({ id: editing.id, data: payload });
      else await createItem.mutateAsync(payload);
      setFormOpen(false);
      setEditing(null);
      setDetail(null);
    } catch {
      // mutation hooks surface the error toast
    }
  };

  const saveConfig = async () => {
    try {
      await saveSettings.mutateAsync(
        settingDefs.map((setting) => ({ key: setting.key, value: settingsDraft[setting.key] ?? setting.defaultValue })),
      );
      toast.success('配置已保存');
    } catch {
      // mutation hook surfaces the error toast
    }
  };

  const renderField = (field: WorkspaceFieldDef) => {
    const value = form.values[field.key] ?? '';
    const common = { label: field.label, fullWidth: true, size: 'small' as const };
    const change = (next: string) => setForm((prev) => ({ ...prev, values: { ...prev.values, [field.key]: next } }));
    if (field.type === 'textarea') {
      return <TextField key={field.key} {...common} value={value} onChange={(event) => change(event.target.value)} multiline minRows={2} sx={{ gridColumn: '1 / -1' }} />;
    }
    if (field.type === 'select') {
      return (
        <FormControl key={field.key} size="small" fullWidth>
          <InputLabel id={`settings-field-${field.key}`}>{field.label}</InputLabel>
          <Select labelId={`settings-field-${field.key}`} label={field.label} value={value} onChange={(event) => change(event.target.value)}>
            {(field.options ?? []).map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
          </Select>
        </FormControl>
      );
    }
    if (field.type === 'date') {
      return <TextField key={field.key} {...common} type="date" value={value} onChange={(event) => change(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />;
    }
    return <TextField key={field.key} {...common} type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'} value={value} onChange={(event) => change(event.target.value)} />;
  };

  const renderSetting = (setting: WorkspaceSettingDef) => {
    const value = settingsDraft[setting.key] ?? setting.defaultValue;
    const change = (next: string) => setSettingsDraft((prev) => ({ ...prev, [setting.key]: next }));
    if (setting.type === 'switch') {
      return (
        <FormControlLabel
          key={setting.key}
          control={<Switch checked={value === 'true'} onChange={(event) => change(event.target.checked ? 'true' : 'false')} />}
          label={setting.label}
        />
      );
    }
    if (setting.type === 'select') {
      return (
        <FormControl key={setting.key} size="small" sx={{ minWidth: 220 }}>
          <InputLabel id={`settings-config-${setting.key}`}>{setting.label}</InputLabel>
          <Select labelId={`settings-config-${setting.key}`} label={setting.label} value={value} onChange={(event) => change(event.target.value)}>
            {(setting.options ?? []).map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
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
        onChange={(event) => change(event.target.value)}
        sx={{ minWidth: 220 }}
      />
    );
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        本页的开关与记录保存在当前演示库中，可真实修改并持久化；不会发起对第三方系统的调用或认证审计。
      </Alert>

      {definitionLoading && <LoadingRows columns={4} />}
      {definitionError && <ErrorState message={definitionErrorObject?.message ?? '设置定义加载失败'} onRetry={() => void refetchDefinition()} />}
      {!definitionLoading && !definitionError && !definition && (
        <Alert severity="warning">该功能定义暂不可用，请刷新后重试。</Alert>
      )}

      {definition && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
            <Card><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">记录总数</Typography>
              <Typography variant="h6">{stats?.total ?? allRows.length}</Typography>
            </CardContent></Card>
            {statuses.slice(0, 3).map((item) => (
              <Card key={item.value}><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="h6">{stats?.byStatus[item.value] ?? 0}</Typography>
              </CardContent></Card>
            ))}
          </Box>

          {settingDefs.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>本地配置</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  修改后点击「保存配置」，设置将写入当前演示库并立即生效。
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                  {settingDefs.map(renderSetting)}
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                  <Button variant="contained" onClick={() => void saveConfig()} disabled={saveSettings.isPending}>保存配置</Button>
                  <Button color="inherit" onClick={() => {
                    const defaults: Record<string, string> = {};
                    settingDefs.forEach((setting) => { defaults[setting.key] = setting.defaultValue; });
                    setSettingsDraft(defaults);
                  }}>恢复默认</Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          <Paper sx={{ p: 1.5, mb: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <TextField
                size="small"
                placeholder="搜索标题或说明"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                sx={{ width: 240 }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="settings-status-filter">状态</InputLabel>
                <Select labelId="settings-status-filter" label="状态" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <MenuItem value="">全部状态</MenuItem>
                  {statuses.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
                </Select>
              </FormControl>
              <Tooltip title="刷新">
                <IconButton onClick={() => void refetch()} aria-label="刷新" disabled={isFetching}><RefreshOutlined /></IconButton>
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
                  <TableCell>更新时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && <LoadingRows columns={fields.length + 4} />}
                {!isLoading && rows.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Button size="small" sx={{ p: 0, minWidth: 0, textTransform: 'none' }} onClick={() => setDetail(item)}>{item.title}</Button>
                      {item.summary && <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 220 }}>{item.summary}</Typography>}
                    </TableCell>
                    {fields.map((field) => (
                      <TableCell key={field.key} sx={{ whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.data?.[field.key] ?? '—'}
                      </TableCell>
                    ))}
                    <TableCell>{statusChip(item.status)}</TableCell>
                    <TableCell>{item.ownerName ?? '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(item)} aria-label="编辑记录"><EditOutlined fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setConfirmId(item.id)} aria-label="删除记录"><DeleteOutline fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && !isError && rows.length === 0 && <EmptyRow columns={fields.length + 4} text="暂无符合条件的记录" />}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑记录' : '新建记录'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mt: 1 }}>
            <TextField label="标题" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} sx={{ gridColumn: '1 / -1' }} />
            <TextField label="说明" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} multiline minRows={2} sx={{ gridColumn: '1 / -1' }} />
            {fields.map(renderField)}
            <FormControl size="small" fullWidth>
              <InputLabel id="settings-form-status">状态</InputLabel>
              <Select labelId="settings-form-status" label="状态" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {statuses.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="负责人" value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} />
            <TextField label="截止日期" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={() => void submit()} disabled={createItem.isPending || updateItem.isPending}>{editing ? '保存' : '创建'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detail !== null} onClose={() => setDetail(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{detail?.title}</DialogTitle>
        <DialogContent>
          {detail && (
            <FieldGrid columns={2}>
              <Field label="状态">{statuses.find((item) => item.value === detail.status)?.label ?? detail.status}</Field>
              <Field label="负责人">{detail.ownerName}</Field>
              <Field label="截止日期">{formatDate(detail.dueDate)}</Field>
              <Field label="更新时间">{formatDateTime(detail.updatedAt)}</Field>
              <Field label="说明" span={2}>{detail.summary}</Field>
              {fields.map((field) => (
                <Field key={field.key} label={field.label}>{detail.data?.[field.key] ?? '—'}</Field>
              ))}
            </FieldGrid>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>关闭</Button></DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除记录"
        message="确定删除该记录吗？此操作不可撤销。"
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId !== null) deleteItem.mutate(confirmId, { onSuccess: () => { setConfirmId(null); setDetail(null); } });
        }}
      />
    </Box>
  );
}

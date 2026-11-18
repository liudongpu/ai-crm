import { useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import GavelOutlined from '@mui/icons-material/Gavel';
import HistoryOutlined from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import Avatar from '@mui/material/Avatar';
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
import Typography from '@mui/material/Typography';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import {
  useCheckConflict,
  useConflicts,
  useCreateLead,
  useDeleteConflict,
  useDeleteLead,
  useLeads,
  useUpdateLead,
  useUsers,
} from '@/hooks/useCrm';
import { avatarColor, formatDate, initials } from '@/lib/format';
import { conflictResultMeta, leadRatingMeta, leadStatusMeta } from '@/lib/meta';
import type { ConflictCheckResult, ConflictTargetType, Lead, LeadInput, LeadRating, LeadStatus } from '@/types';

type FormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  practiceArea: string;
  description: string;
  status: LeadStatus;
  rating: LeadRating;
  ownerId: string;
};

const emptyForm: FormState = {
  name: '', company: '', email: '', phone: '', source: '', practiceArea: '', description: '',
  status: 'new', rating: 'warm', ownerId: '',
};

export function LeadFormDialog({ open, onClose, lead }: { open: boolean; onClose: () => void; lead?: Lead | null }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const { data: users } = useUsers();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  useEffect(() => {
    if (!open) return;
    setForm({
      name: lead?.name ?? '',
      company: lead?.company ?? '',
      email: lead?.email ?? '',
      phone: lead?.phone ?? '',
      source: lead?.source ?? '',
      practiceArea: lead?.practiceArea ?? '',
      description: lead?.description ?? '',
      status: lead?.status ?? 'new',
      rating: lead?.rating ?? 'warm',
      ownerId: String(lead?.ownerId ?? ''),
    });
  }, [open, lead]);

  const submit = () => {
    if (!form.name.trim()) return;
    const payload: LeadInput = {
      name: form.name.trim(),
      company: form.company.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      source: form.source.trim() || null,
      practiceArea: form.practiceArea.trim() || null,
      description: form.description.trim() || null,
      status: form.status,
      rating: form.rating,
      ownerId: form.ownerId ? Number(form.ownerId) : null,
    };
    if (lead) {
      updateLead.mutate({ id: lead.id, data: payload }, { onSuccess: onClose });
    } else {
      createLead.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{lead ? '编辑咨询线索' : '新建咨询线索'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label="咨询人姓名 *" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth autoFocus />
          <TextField label="公司" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} fullWidth />
          <TextField label="邮箱" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} fullWidth />
          <TextField label="电话" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} fullWidth />
          <TextField label="来源" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} fullWidth placeholder="网站 / 转介绍 / 广告 / 线下活动 / 老客户" />
          <TextField label="意向执业领域" value={form.practiceArea} onChange={(event) => setForm({ ...form, practiceArea: event.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="lead-status">状态</InputLabel>
            <Select labelId="lead-status" label="状态" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as LeadStatus })}>
              {(Object.keys(leadStatusMeta) as LeadStatus[]).map((key) => <MenuItem key={key} value={key}>{leadStatusMeta[key].label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="lead-rating">意向评级</InputLabel>
            <Select labelId="lead-rating" label="意向评级" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value as LeadRating })}>
              {(Object.keys(leadRatingMeta) as LeadRating[]).map((key) => <MenuItem key={key} value={key}>{leadRatingMeta[key].label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="lead-owner">负责人</InputLabel>
            <Select labelId="lead-owner" label="负责人" value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}>
              <MenuItem value="">未指派</MenuItem>
              {(users ?? []).map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <TextField label="咨询描述" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={3} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button variant="contained" onClick={submit} disabled={!form.name.trim() || createLead.isPending || updateLead.isPending}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ConflictCheckDialog({
  open,
  onClose,
  initialName,
}: {
  open: boolean;
  onClose: () => void;
  initialName?: string;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ConflictTargetType>('client');
  const [result, setResult] = useState<ConflictCheckResult | null>(null);
  const check = useCheckConflict();

  useEffect(() => {
    if (open) {
      setName(initialName ?? '');
      setResult(null);
    }
  }, [open, initialName]);

  const submit = () => {
    if (!name.trim()) return;
    check.mutate({ name: name.trim(), type }, { onSuccess: (data) => setResult(data) });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>利益冲突检查</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Typography variant="body2" color="text.secondary">
          在客户、联系人、案件与咨询线索中按名称模糊匹配，检查结果将留痕保存。
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
          <TextField label="检索名称 *" value={name} onChange={(event) => setName(event.target.value)} fullWidth autoFocus />
          <FormControl fullWidth>
            <InputLabel id="conflict-type">检索类型</InputLabel>
            <Select labelId="conflict-type" label="检索类型" value={type} onChange={(event) => setType(event.target.value as ConflictTargetType)}>
              <MenuItem value="client">客户</MenuItem>
              <MenuItem value="contact">联系人</MenuItem>
              <MenuItem value="matter">案件</MenuItem>
              <MenuItem value="lead">咨询线索</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {result && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GavelOutlined fontSize="small" color={result.hasConflict ? 'error' : 'success'} />
              <Typography variant="subtitle2">
                {result.hasConflict ? '发现潜在利益冲突，请谨慎接案' : '未发现同名记录，可继续接案'}
              </Typography>
            </Box>
            {result.matches.length ? (
              <Table size="small">
                <TableHead><TableRow><TableCell>类型</TableCell><TableCell>名称</TableCell><TableCell>详情</TableCell></TableRow></TableHead>
                <TableBody>
                  {result.matches.map((match, index) => (
                    <TableRow key={`${match.type}-${match.id}-${index}`}>
                      <TableCell>{match.type}</TableCell>
                      <TableCell>{match.name}</TableCell>
                      <TableCell>{match.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <Typography variant="body2" color="text.secondary">无匹配记录</Typography>}
            {result.record && (
              <Chip size="small" sx={{ mt: 1.5 }} variant="outlined"
                color={conflictResultMeta[result.record.result]?.color}
                label={conflictResultMeta[result.record.result]?.label ?? result.record.result} />
            )}
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">关闭</Button>
        <Button variant="contained" onClick={submit} disabled={!name.trim() || check.isPending}>执行检查</Button>
      </DialogActions>
    </Dialog>
  );
}

export function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [rating, setRating] = useState<LeadRating | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictName, setConflictName] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteConflictId, setDeleteConflictId] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data: leads, isLoading, isError, error, refetch } = useLeads();
  const { data: users } = useUsers();
  const { data: history } = useConflicts();
  const deleteLead = useDeleteLead();
  const deleteConflict = useDeleteConflict();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const rows = (leads ?? []).filter((lead) => {
    if (status && lead.status !== status) return false;
    if (rating && lead.rating !== rating) return false;
    if (search && !`${lead.name}${lead.company ?? ''}${lead.email ?? ''}${lead.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Box>
      <PageHeader
        title="咨询线索 / Intake"
        subtitle={`共 ${rows.length} 条线索 · 接案前请先做利益冲突检查`}
        actions={
          <>
            <Button size="small" variant="outlined" startIcon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>检查记录</Button>
            <Button size="small" variant="outlined" startIcon={<GavelOutlined />} onClick={() => { setConflictName(''); setConflictOpen(true); }}>冲突检查</Button>
            <Button variant="contained" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>新建线索</Button>
          </>
        }
      />

      <Paper sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="搜索咨询人 / 公司 / 电话"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          sx={{ width: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="lead-filter-status">状态</InputLabel>
          <Select labelId="lead-filter-status" label="状态" value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | '')}>
            <MenuItem value="">全部状态</MenuItem>
            {(Object.keys(leadStatusMeta) as LeadStatus[]).map((key) => <MenuItem key={key} value={key}>{leadStatusMeta[key].label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="lead-filter-rating">评级</InputLabel>
          <Select labelId="lead-filter-rating" label="评级" value={rating} onChange={(event) => setRating(event.target.value as LeadRating | '')}>
            <MenuItem value="">全部评级</MenuItem>
            {(Object.keys(leadRatingMeta) as LeadRating[]).map((key) => <MenuItem key={key} value={key}>{leadRatingMeta[key].label}</MenuItem>)}
          </Select>
        </FormControl>
        <Button size="small" onClick={() => { setSearch(''); setStatus(''); setRating(''); }}>重置</Button>
      </Paper>

      {isError && <ErrorState message={error?.message ?? '线索加载失败'} onRetry={() => void refetch()} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>咨询人</TableCell>
              <TableCell>公司 / 来源</TableCell>
              <TableCell>意向领域</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>评级</TableCell>
              <TableCell>冲突检查</TableCell>
              <TableCell>负责人</TableCell>
              <TableCell>创建日期</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <LoadingRows columns={9} />}
            {rows.map((lead) => (
              <TableRow key={lead.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/leads/${lead.id}`)}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 11, bgcolor: avatarColor(lead.name) }}>{initials(lead.name)}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{lead.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{lead.email ?? lead.phone ?? '—'}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{lead.company ?? '个人咨询'}</Typography>
                  <Typography variant="caption" color="text.secondary">{lead.source ?? '未记录来源'}</Typography>
                </TableCell>
                <TableCell>{lead.practiceArea ?? '—'}</TableCell>
                <TableCell><Chip size="small" variant="outlined" color={leadStatusMeta[lead.status]?.color} label={leadStatusMeta[lead.status]?.label ?? lead.status} /></TableCell>
                <TableCell><Typography variant="body2" sx={{ color: leadRatingMeta[lead.rating]?.color, fontWeight: 600 }}>{leadRatingMeta[lead.rating]?.label ?? lead.rating}</Typography></TableCell>
                <TableCell>
                  {lead.conflictChecked ? (
                    <Chip size="small" variant="outlined" color={lead.conflictResult === 'clear' ? 'success' : 'error'}
                      label={lead.conflictResult === 'clear' ? '无冲突' : '存在冲突'} />
                  ) : <Chip size="small" variant="outlined" label="未检查" />}
                </TableCell>
                <TableCell>{users?.find((user) => user.id === lead.ownerId)?.name ?? '—'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(lead.createdAt)}</TableCell>
                <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                  <Button size="small" onClick={() => { setConflictName(lead.name); setConflictOpen(true); }}>检查冲突</Button>
                  <IconButton size="small" onClick={() => { setEditing(lead); setFormOpen(true); }} aria-label="编辑线索"><EditOutlined fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setConfirmId(lead.id)} aria-label="删除线索"><DeleteOutline fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && rows.length === 0 && <EmptyRow columns={9} text="没有符合条件的咨询线索" />}
          </TableBody>
        </Table>
      </TableContainer>

      <LeadFormDialog open={formOpen} onClose={() => setFormOpen(false)} lead={editing} />
      <ConflictCheckDialog open={conflictOpen} onClose={() => setConflictOpen(false)} initialName={conflictName} />
      <ConfirmDialog
        open={confirmId !== null}
        title="删除咨询线索"
        message="确定删除该咨询线索吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteLead.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>冲突检查历史</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead><TableRow><TableCell>检索名称</TableCell><TableCell>类型</TableCell><TableCell>结果</TableCell><TableCell>日期</TableCell><TableCell align="right">操作</TableCell></TableRow></TableHead>
            <TableBody>
              {(history ?? []).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.name}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell><Chip size="small" variant="outlined" color={conflictResultMeta[record.result]?.color} label={conflictResultMeta[record.result]?.label ?? record.result} /></TableCell>
                  <TableCell>{formatDate(record.createdAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => setDeleteConflictId(record.id)} aria-label="删除检查记录"><DeleteOutline fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {(history ?? []).length === 0 && <EmptyRow columns={5} text="暂无冲突检查记录" />}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setHistoryOpen(false)}>关闭</Button></DialogActions>
      </Dialog>
      <ConfirmDialog
        open={deleteConflictId !== null}
        title="删除检查记录"
        message="确定删除该冲突检查记录吗？"
        onClose={() => setDeleteConflictId(null)}
        onConfirm={() => { if (deleteConflictId !== null) deleteConflict.mutate(deleteConflictId, { onSuccess: () => setDeleteConflictId(null) }); }}
      />
    </Box>
  );
}

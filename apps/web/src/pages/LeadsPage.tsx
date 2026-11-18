import { useEffect, useMemo, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
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
import Skeleton from '@mui/material/Skeleton';
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
import { useConvertLead, useCreateLead, useDeleteLead, useLeads, useUpdateLead } from '@/hooks/useCrm';
import { avatarColor, formatDate, initials } from '@/lib/format';
import { leadRatingMeta, leadStatusMeta } from '@/lib/meta';
import type { Lead, LeadInput, LeadStatus } from '@/types';

const emptyForm: LeadInput = {
  name: '', company: '', title: '', email: '', phone: '', status: 'new', rating: 'warm', source: '', description: '', owner: '销售团队',
};

const statusFilters: Array<{ value: LeadStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'new', label: '新建' },
  { value: 'working', label: '跟进中' },
  { value: 'qualified', label: '已验证' },
  { value: 'converted', label: '已转换' },
  { value: 'unqualified', label: '不合格' },
];

export function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<LeadStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadInput>(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data: leads, isLoading } = useLeads({ status: status === 'all' ? undefined : status, search });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const convertLead = useConvertLead();
  const deleteLead = useDeleteLead();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setForm(emptyForm);
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const lead of leads ?? []) map.set(lead.status, (map.get(lead.status) ?? 0) + 1);
    return map;
  }, [leads]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setForm({
      name: lead.name,
      company: lead.company,
      title: lead.title ?? '',
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      status: lead.status,
      rating: lead.rating,
      source: lead.source ?? '',
      description: lead.description ?? '',
      owner: lead.owner,
    });
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.name?.trim() || !form.company?.trim()) return;
    const payload = {
      ...form,
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email || null,
      phone: form.phone || null,
      title: form.title || null,
      source: form.source || null,
      description: form.description || null,
    };
    if (editing) {
      updateLead.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createLead.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <Box>
      <PageHeader
        title="潜在客户"
        subtitle={`共 ${leads?.length ?? 0} 条线索 · 跟进并转化为客户与商机`}
        actions={
          <>
            <TextField size="small" placeholder="搜索姓名、公司..." value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} sx={{ width: { xs: 160, sm: 220 } }} />
            <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>新建潜在客户</Button>
          </>
        }
      />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {statusFilters.map((item) => (
          <Chip
            key={item.value}
            label={`${item.label}${item.value !== 'all' ? ` (${counts.get(item.value) ?? 0})` : ''}`}
            color={status === item.value ? 'primary' : 'default'}
            variant={status === item.value ? 'filled' : 'outlined'}
            onClick={() => setStatus(item.value)}
          />
        ))}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>潜在客户</TableCell>
              <TableCell>公司 / 职位</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>意向</TableCell>
              <TableCell>来源</TableCell>
              <TableCell>负责人</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}><TableCell colSpan={8}><Skeleton height={32} /></TableCell></TableRow>
            ))}
            {leads?.map((lead) => (
              <TableRow key={lead.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/leads/${lead.id}`)}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: avatarColor(lead.name) }}>{initials(lead.name)}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{lead.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{lead.email ?? lead.phone ?? '—'}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{lead.company}</Typography>
                  <Typography variant="caption" color="text.secondary">{lead.title ?? '—'}</Typography>
                </TableCell>
                <TableCell><Chip size="small" color={leadStatusMeta[lead.status].color} label={leadStatusMeta[lead.status].label} variant="outlined" /></TableCell>
                <TableCell><Typography variant="body2" sx={{ color: leadRatingMeta[lead.rating].color, fontWeight: 600 }}>{leadRatingMeta[lead.rating].label}</Typography></TableCell>
                <TableCell>{lead.source ?? '—'}</TableCell>
                <TableCell>{lead.owner}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{formatDate(lead.createdAt)}</TableCell>
                <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                  {lead.status !== 'converted' && (
                    <Button size="small" variant="text" onClick={() => convertLead.mutate(lead.id)} disabled={convertLead.isPending}>转换</Button>
                  )}
                  <IconButton size="small" onClick={() => openEdit(lead)} aria-label="编辑"><EditOutlined fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setConfirmId(lead.id)} aria-label="删除"><DeleteOutline fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && leads?.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>没有符合条件的潜在客户</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑潜在客户' : '新建潜在客户'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="姓名 *" value={form.name ?? ''} onChange={(event) => setForm({ ...form, name: event.target.value })} autoFocus />
            <TextField label="公司 *" value={form.company ?? ''} onChange={(event) => setForm({ ...form, company: event.target.value })} />
            <TextField label="职位" value={form.title ?? ''} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <TextField label="电话" value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <TextField label="邮箱" value={form.email ?? ''} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <TextField label="来源" value={form.source ?? ''} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="官网 / 展会 / 转介绍" />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="lead-status">状态</InputLabel>
              <Select labelId="lead-status" label="状态" value={form.status ?? 'new'} onChange={(event) => setForm({ ...form, status: event.target.value as LeadStatus })}>
                {(Object.keys(leadStatusMeta) as LeadStatus[]).map((key) => <MenuItem key={key} value={key}>{leadStatusMeta[key].label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="lead-rating">意向程度</InputLabel>
              <Select labelId="lead-rating" label="意向程度" value={form.rating ?? 'warm'} onChange={(event) => setForm({ ...form, rating: event.target.value as LeadInput['rating'] })}>
                {(Object.keys(leadRatingMeta) as Array<keyof typeof leadRatingMeta>).map((key) => <MenuItem key={key} value={key}>{leadRatingMeta[key].label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="描述" value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={2} />
          <TextField label="负责人" value={form.owner ?? ''} onChange={(event) => setForm({ ...form, owner: event.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name?.trim() || !form.company?.trim() || createLead.isPending || updateLead.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除潜在客户"
        message="确定删除该潜在客户吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteLead.mutate(confirmId, { onSuccess: () => setConfirmId(null) })}
      />
    </Box>
  );
}

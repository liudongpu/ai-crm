import { useEffect, useState } from 'react';
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
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import { useClients, useCreateClient, useDeleteClient, useUpdateClient, useUsers } from '@/hooks/useCrm';
import { avatarColor, formatDate, initials } from '@/lib/format';
import { clientStatusMeta } from '@/lib/meta';
import type { Client, ClientInput, ClientStatus, ClientType } from '@/types';

type FormState = {
  name: string;
  type: ClientType;
  industry: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  billingAddress: string;
  status: ClientStatus;
  ownerId: string;
  notes: string;
};

const emptyForm: FormState = {
  name: '', type: 'company', industry: '', contactName: '', email: '', phone: '',
  address: '', billingAddress: '', status: 'active', ownerId: '', notes: '',
};

export function ClientFormDialog({
  open,
  onClose,
  client,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const { data: users } = useUsers();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  useEffect(() => {
    if (!open) return;
    setForm({
      name: client?.name ?? '',
      type: client?.type ?? 'company',
      industry: client?.industry ?? '',
      contactName: client?.contactName ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      address: client?.address ?? '',
      billingAddress: client?.billingAddress ?? '',
      status: client?.status ?? 'active',
      ownerId: String(client?.ownerId ?? ''),
      notes: client?.notes ?? '',
    });
  }, [open, client]);

  const submit = () => {
    if (!form.name.trim()) return;
    const payload: ClientInput = {
      name: form.name.trim(),
      type: form.type,
      industry: form.industry.trim() || null,
      contactName: form.contactName.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      billingAddress: form.billingAddress.trim() || null,
      status: form.status,
      ownerId: form.ownerId ? Number(form.ownerId) : null,
      notes: form.notes.trim() || null,
    };
    if (client) {
      updateClient.mutate({ id: client.id, data: payload }, { onSuccess: onClose });
    } else {
      createClient.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{client ? '编辑客户' : '新建客户'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label="客户名称 *" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth autoFocus />
          <FormControl fullWidth>
            <InputLabel id="client-type">类型</InputLabel>
            <Select labelId="client-type" label="类型" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ClientType })}>
              <MenuItem value="company">公司</MenuItem>
              <MenuItem value="individual">个人</MenuItem>
            </Select>
          </FormControl>
          <TextField label="行业" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} fullWidth />
          <TextField label="联系人" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} fullWidth />
          <TextField label="邮箱" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} fullWidth />
          <TextField label="电话" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} fullWidth />
          <TextField label="地址" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} fullWidth />
          <TextField label="账单地址" value={form.billingAddress} onChange={(event) => setForm({ ...form, billingAddress: event.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="client-status">状态</InputLabel>
            <Select labelId="client-status" label="状态" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })}>
              {(Object.keys(clientStatusMeta) as ClientStatus[]).map((key) => <MenuItem key={key} value={key}>{clientStatusMeta[key].label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="client-owner">负责人</InputLabel>
            <Select labelId="client-owner" label="负责人" value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}>
              <MenuItem value="">未指派</MenuItem>
              {(users ?? []).map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <TextField label="备注" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} multiline minRows={2} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button variant="contained" onClick={submit} disabled={!form.name.trim() || createClient.isPending || updateClient.isPending}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ClientStatus | ''>('');
  const [type, setType] = useState<ClientType | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data: clients, isLoading, isError, error, refetch } = useClients();
  const { data: users } = useUsers();
  const deleteClient = useDeleteClient();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const rows = (clients ?? []).filter((client) => {
    if (status && client.status !== status) return false;
    if (type && client.type !== type) return false;
    if (search && !`${client.name}${client.contactName ?? ''}${client.email ?? ''}${client.industry ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Box>
      <PageHeader
        title="客户管理"
        subtitle={`共 ${rows.length} 位客户 · 公司及个人委托人`}
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>新建客户</Button>}
      />

      <Paper sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="搜索客户名称 / 联系人 / 邮箱"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          sx={{ width: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="client-filter-status">状态</InputLabel>
          <Select labelId="client-filter-status" label="状态" value={status} onChange={(event) => setStatus(event.target.value as ClientStatus | '')}>
            <MenuItem value="">全部状态</MenuItem>
            {(Object.keys(clientStatusMeta) as ClientStatus[]).map((key) => <MenuItem key={key} value={key}>{clientStatusMeta[key].label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="client-filter-type">类型</InputLabel>
          <Select labelId="client-filter-type" label="类型" value={type} onChange={(event) => setType(event.target.value as ClientType | '')}>
            <MenuItem value="">全部类型</MenuItem>
            <MenuItem value="company">公司</MenuItem>
            <MenuItem value="individual">个人</MenuItem>
          </Select>
        </FormControl>
        <Button size="small" onClick={() => { setSearch(''); setStatus(''); setType(''); }}>重置</Button>
      </Paper>

      {isError && <ErrorState message={error?.message ?? '客户加载失败'} onRetry={() => void refetch()} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>客户名称</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>行业</TableCell>
              <TableCell>联系人</TableCell>
              <TableCell>联系方式</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>负责人</TableCell>
              <TableCell>创建日期</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <LoadingRows columns={9} />}
            {rows.map((client) => (
              <TableRow key={client.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/clients/${client.id}`)}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 11, bgcolor: avatarColor(client.name) }}>{initials(client.name)}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{client.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{client.email ?? '—'}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{client.type === 'company' ? '公司' : '个人'}</TableCell>
                <TableCell>{client.industry ?? '—'}</TableCell>
                <TableCell>{client.contactName ?? '—'}</TableCell>
                <TableCell>{client.phone ?? '—'}</TableCell>
                <TableCell><Chip size="small" variant="outlined" color={clientStatusMeta[client.status]?.color} label={clientStatusMeta[client.status]?.label ?? client.status} /></TableCell>
                <TableCell>{users?.find((user) => user.id === client.ownerId)?.name ?? '—'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(client.createdAt)}</TableCell>
                <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                  <IconButton size="small" onClick={() => { setEditing(client); setFormOpen(true); }} aria-label="编辑客户"><EditOutlined fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setConfirmId(client.id)} aria-label="删除客户"><DeleteOutline fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && rows.length === 0 && <EmptyRow columns={9} text="没有符合条件的客户" />}
          </TableBody>
        </Table>
      </TableContainer>

      <ClientFormDialog open={formOpen} onClose={() => setFormOpen(false)} client={editing} />
      <ConfirmDialog
        open={confirmId !== null}
        title="删除客户"
        message="确定删除该客户吗？其关联案件与联系人不会被删除。"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteClient.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
    </Box>
  );
}

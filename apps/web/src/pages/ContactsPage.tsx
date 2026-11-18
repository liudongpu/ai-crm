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
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import { useClients, useContacts, useCreateContact, useDeleteContact, useUpdateContact } from '@/hooks/useCrm';
import { avatarColor, formatDate, initials } from '@/lib/format';
import type { Contact, ContactInput } from '@/types';

type FormState = {
  name: string;
  clientId: string;
  position: string;
  email: string;
  phone: string;
  mobile: string;
  isPrimary: boolean;
  notes: string;
};

const emptyForm: FormState = { name: '', clientId: '', position: '', email: '', phone: '', mobile: '', isPrimary: false, notes: '' };

export function ContactFormDialog({
  open,
  onClose,
  contact,
  defaultClientId,
}: {
  open: boolean;
  onClose: () => void;
  contact?: Contact | null;
  defaultClientId?: number;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const { data: clients } = useClients();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  useEffect(() => {
    if (!open) return;
    setForm({
      name: contact?.name ?? '',
      clientId: String(contact?.clientId ?? defaultClientId ?? ''),
      position: contact?.position ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      mobile: contact?.mobile ?? '',
      isPrimary: contact?.isPrimary ?? false,
      notes: contact?.notes ?? '',
    });
  }, [open, contact, defaultClientId]);

  const submit = () => {
    if (!form.name.trim()) return;
    const payload: ContactInput = {
      name: form.name.trim(),
      clientId: form.clientId ? Number(form.clientId) : null,
      position: form.position.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      mobile: form.mobile.trim() || null,
      isPrimary: form.isPrimary,
      notes: form.notes.trim() || null,
    };
    if (contact) {
      updateContact.mutate({ id: contact.id, data: payload }, { onSuccess: onClose });
    } else {
      createContact.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{contact ? '编辑联系人' : '新建联系人'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label="姓名 *" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth autoFocus />
          <TextField label="职位" value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="contact-client">所属客户</InputLabel>
            <Select labelId="contact-client" label="所属客户" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
              <MenuItem value="">不关联</MenuItem>
              {(clients ?? []).map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="邮箱" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} fullWidth />
          <TextField label="电话" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} fullWidth />
          <TextField label="手机" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} fullWidth />
        </Box>
        <FormControlLabel control={<Checkbox checked={form.isPrimary} onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })} />} label="主要联系人" />
        <TextField label="备注" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} multiline minRows={2} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button variant="contained" onClick={submit} disabled={!form.name.trim() || createContact.isPending || updateContact.isPending}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data: contacts, isLoading, isError, error, refetch } = useContacts();
  const { data: clients } = useClients();
  const deleteContact = useDeleteContact();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const rows = (contacts ?? []).filter((contact) => {
    if (clientId && contact.clientId !== clientId) return false;
    if (search && !`${contact.name}${contact.position ?? ''}${contact.email ?? ''}${contact.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Box>
      <PageHeader
        title="联系人"
        subtitle={`共 ${rows.length} 位联系人 · 客户方对接人`}
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>新建联系人</Button>}
      />

      <Paper sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="搜索姓名 / 职位 / 邮箱"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          sx={{ width: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="contact-filter-client">所属客户</InputLabel>
          <Select labelId="contact-filter-client" label="所属客户" value={clientId} onChange={(event) => setClientId(event.target.value as number | '')}>
            <MenuItem value="">全部客户</MenuItem>
            {(clients ?? []).map((client) => <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button size="small" onClick={() => { setSearch(''); setClientId(''); }}>重置</Button>
      </Paper>

      {isError && <ErrorState message={error?.message ?? '联系人加载失败'} onRetry={() => void refetch()} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>姓名</TableCell>
              <TableCell>所属客户</TableCell>
              <TableCell>职位</TableCell>
              <TableCell>邮箱</TableCell>
              <TableCell>电话 / 手机</TableCell>
              <TableCell>主要联系人</TableCell>
              <TableCell>创建日期</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <LoadingRows columns={8} />}
            {rows.map((contact) => (
              <TableRow key={contact.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/contacts/${contact.id}`)}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 11, bgcolor: avatarColor(contact.name) }}>{initials(contact.name)}</Avatar>
                    <Typography variant="body2" fontWeight={600}>{contact.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{clients?.find((client) => client.id === contact.clientId)?.name ?? contact.client?.name ?? '—'}</TableCell>
                <TableCell>{contact.position ?? '—'}</TableCell>
                <TableCell>{contact.email ?? '—'}</TableCell>
                <TableCell>{contact.mobile || contact.phone || '—'}</TableCell>
                <TableCell>{contact.isPrimary ? <Chip size="small" color="primary" variant="outlined" label="是" /> : '否'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(contact.createdAt)}</TableCell>
                <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                  <IconButton size="small" onClick={() => { setEditing(contact); setFormOpen(true); }} aria-label="编辑联系人"><EditOutlined fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setConfirmId(contact.id)} aria-label="删除联系人"><DeleteOutline fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && rows.length === 0 && <EmptyRow columns={8} text="没有符合条件的联系人" />}
          </TableBody>
        </Table>
      </TableContainer>

      <ContactFormDialog open={formOpen} onClose={() => setFormOpen(false)} contact={editing} />
      <ConfirmDialog
        open={confirmId !== null}
        title="删除联系人"
        message="确定删除该联系人吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteContact.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
    </Box>
  );
}

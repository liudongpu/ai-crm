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
import { useCompanies, useContacts, useCreateContact, useDeleteContact, useUpdateContact } from '@/hooks/useCrm';
import { avatarColor, formatDate, initials } from '@/lib/format';
import type { Contact, ContactInput } from '@/types';

const emptyForm: ContactInput = { name: '', email: '', phone: '', position: '', companyId: null, owner: '销售团队' };

export function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactInput>(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data: contacts, isLoading } = useContacts();
  const { data: companies } = useCompanies();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setForm({ ...emptyForm, companyId: searchParams.get('companyId') ? Number(searchParams.get('companyId')) : null });
      setFormOpen(true);
      searchParams.delete('new');
      searchParams.delete('companyId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (contacts ?? []).filter((contact) =>
      [contact.name, contact.email, contact.phone, contact.company?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword)),
    );
  }, [contacts, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditing(contact);
    setForm({
      name: contact.name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      position: contact.position ?? '',
      companyId: contact.companyId,
      owner: contact.owner,
    });
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.name?.trim()) return;
    const payload = { ...form, name: form.name.trim(), email: form.email || null, phone: form.phone || null, position: form.position || null };
    if (editing) {
      updateContact.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createContact.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <Box>
      <PageHeader
        title="联系人"
        subtitle={`共 ${contacts?.length ?? 0} 位联系人 · 维护客户沟通网络`}
        actions={
          <>
            <TextField size="small" placeholder="搜索姓名、邮箱、公司..." value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} sx={{ width: { xs: 160, sm: 260 } }} />
            <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>新建联系人</Button>
          </>
        }
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>联系人</TableCell>
              <TableCell>职位</TableCell>
              <TableCell>客户公司</TableCell>
              <TableCell>邮箱</TableCell>
              <TableCell>电话</TableCell>
              <TableCell>负责人</TableCell>
              <TableCell>添加时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index}><TableCell colSpan={8}><Skeleton height={32} /></TableCell></TableRow>
            ))}
            {filtered.map((contact) => (
              <TableRow key={contact.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/contacts/${contact.id}`)}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: avatarColor(contact.name) }}>{initials(contact.name)}</Avatar>
                    <Typography variant="body2" fontWeight={600}>{contact.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{contact.position ?? '—'}</TableCell>
                <TableCell>{contact.company ? <Chip size="small" variant="outlined" label={contact.company.name} /> : '—'}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{contact.email ?? '—'}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{contact.phone ?? '—'}</TableCell>
                <TableCell>{contact.owner}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{formatDate(contact.createdAt)}</TableCell>
                <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                  <IconButton size="small" onClick={() => openEdit(contact)} aria-label="编辑"><EditOutlined fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setConfirmId(contact.id)} aria-label="删除"><DeleteOutline fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>没有找到联系人</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑联系人' : '新建联系人'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="姓名 *" value={form.name ?? ''} onChange={(event) => setForm({ ...form, name: event.target.value })} autoFocus />
            <TextField label="职位" value={form.position ?? ''} onChange={(event) => setForm({ ...form, position: event.target.value })} />
            <TextField label="邮箱" type="email" value={form.email ?? ''} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <TextField label="电话" value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Box>
          <FormControl fullWidth>
            <InputLabel id="contact-company">客户公司</InputLabel>
            <Select labelId="contact-company" label="客户公司" value={form.companyId ? String(form.companyId) : ''} onChange={(event) => setForm({ ...form, companyId: event.target.value ? Number(event.target.value) : null })}>
              <MenuItem value="">未关联</MenuItem>
              {companies?.map((company) => <MenuItem key={company.id} value={String(company.id)}>{company.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="负责人" value={form.owner ?? ''} onChange={(event) => setForm({ ...form, owner: event.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name?.trim() || createContact.isPending || updateContact.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除联系人"
        message="确定删除该联系人吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteContact.mutate(confirmId, { onSuccess: () => setConfirmId(null) })}
      />
    </Box>
  );
}

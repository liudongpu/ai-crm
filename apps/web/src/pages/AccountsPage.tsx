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
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
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
import { useCompanies, useContacts, useCreateCompany, useDeleteCompany, useDeals, useUpdateCompany } from '@/hooks/useCrm';
import { avatarColor, formatCurrency, formatDate, initials } from '@/lib/format';
import type { Company, CompanyInput } from '@/types';

const emptyForm: CompanyInput = { name: '', industry: '', website: '', phone: '', address: '' };

export function AccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyInput>(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data: companies, isLoading } = useCompanies();
  const { data: contacts } = useContacts();
  const { data: deals } = useDeals();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setForm(emptyForm);
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const stats = useMemo(() => {
    const map = new Map<number, { contacts: number; deals: number; value: number }>();
    for (const company of companies ?? []) map.set(company.id, { contacts: 0, deals: 0, value: 0 });
    for (const contact of contacts ?? []) {
      if (contact.companyId && map.has(contact.companyId)) map.get(contact.companyId)!.contacts += 1;
    }
    for (const deal of deals ?? []) {
      if (deal.companyId && map.has(deal.companyId)) {
        const stat = map.get(deal.companyId)!;
        stat.deals += 1;
        stat.value += deal.value;
      }
    }
    return map;
  }, [companies, contacts, deals]);

  const filtered = (companies ?? []).filter((company) =>
    [company.name, company.industry, company.phone, company.website]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search.trim().toLowerCase())),
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditing(company);
    setForm({
      name: company.name,
      industry: company.industry ?? '',
      website: company.website ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
    });
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.name?.trim()) return;
    const payload = { ...form, name: form.name.trim() };
    if (editing) {
      updateCompany.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createCompany.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <Box>
      <PageHeader
        title="客户"
        subtitle={`共 ${companies?.length ?? 0} 家客户公司 · 管理客户档案与商机关系`}
        actions={
          <>
            <TextField
              size="small"
              placeholder="搜索客户、行业..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ width: { xs: 160, sm: 240 } }}
            />
            <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>新建客户</Button>
          </>
        }
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>客户名称</TableCell>
              <TableCell>行业</TableCell>
              <TableCell align="center">联系人</TableCell>
              <TableCell align="center">商机</TableCell>
              <TableCell>商机金额</TableCell>
              <TableCell>电话</TableCell>
              <TableCell>网站</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index}><TableCell colSpan={9}><Skeleton height={32} /></TableCell></TableRow>
            ))}
            {filtered.map((company) => {
              const stat = stats.get(company.id);
              return (
                <TableRow key={company.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/accounts/${company.id}`)}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: avatarColor(company.name) }}>{initials(company.name)}</Avatar>
                      <Typography variant="body2" fontWeight={600}>{company.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{company.industry ? <Chip size="small" variant="outlined" label={company.industry} /> : '—'}</TableCell>
                  <TableCell align="center">{stat?.contacts ?? 0}</TableCell>
                  <TableCell align="center">{stat?.deals ?? 0}</TableCell>
                  <TableCell>{stat?.value ? formatCurrency(stat.value, true) : '—'}</TableCell>
                  <TableCell>{company.phone ?? '—'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{company.website ?? '—'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{formatDate(company.createdAt)}</TableCell>
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    <IconButton size="small" onClick={() => openEdit(company)} aria-label="编辑"><EditOutlined fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirmId(company.id)} aria-label="删除"><DeleteOutline fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>没有找到客户，点击「新建客户」添加一家吧。</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑客户' : '新建客户'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="客户名称 *" value={form.name ?? ''} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth autoFocus />
          <TextField label="行业" value={form.industry ?? ''} onChange={(event) => setForm({ ...form, industry: event.target.value })} fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="电话" value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} fullWidth />
            <TextField label="网站" value={form.website ?? ''} onChange={(event) => setForm({ ...form, website: event.target.value })} fullWidth />
          </Box>
          <TextField label="地址" value={form.address ?? ''} onChange={(event) => setForm({ ...form, address: event.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name?.trim() || createCompany.isPending || updateCompany.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除客户"
        message="删除客户后，关联的联系人与商机将解除关联。确定继续吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteCompany.mutate(confirmId, { onSuccess: () => setConfirmId(null) })}
      />
    </Box>
  );
}

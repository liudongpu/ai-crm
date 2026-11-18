import { useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { ActivitiesPanel } from '@/components/common/ActivitiesPanel';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Field } from '@/components/common/Field';
import { NotesPanel } from '@/components/common/NotesPanel';
import { RecordLayout } from '@/components/common/RecordLayout';
import { useCompanies, useContact, useDeals, useDeleteContact, useUpdateContact } from '@/hooks/useCrm';
import { useTrackVisit } from '@/hooks/useRecent';
import { avatarColor, formatCurrency, formatDate, initials } from '@/lib/format';
import type { ContactInput } from '@/types';

export function ContactDetailPage() {
  const { id = '' } = useParams();
  const contactId = Number(id);
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(contactId);
  const { data: companies } = useCompanies();
  const { data: deals } = useDeals();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const [tab, setTab] = useState('details');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState<ContactInput>({ name: '' });

  useTrackVisit('contact', contactId, contact?.name ?? '');
  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        position: contact.position ?? '',
        companyId: contact.companyId,
        owner: contact.owner,
      });
    }
  }, [contact]);

  if (isLoading || !contact) return <Skeleton variant="rounded" height={400} />;

  const relatedDeals = (deals ?? []).filter((deal) => deal.contactId === contactId);
  const totalValue = relatedDeals.reduce((sum, deal) => sum + deal.value, 0);

  const submit = () => {
    if (!form.name?.trim()) return;
    updateContact.mutate({ id: contactId, data: form }, { onSuccess: () => setEditOpen(false) });
  };

  return (
    <Box>
      <RecordLayout
        crumbs={[{ label: '首页', to: '/' }, { label: '联系人', to: '/contacts' }, { label: contact.name }]}
        title={contact.name}
        subtitle={`${contact.position ?? '联系人'} · ${contact.company?.name ?? '未关联客户'}`}
        icon={<PeopleOutline />}
        chips={<Chip size="small" variant="outlined" color="primary" label={`负责人 ${contact.owner}`} />}
        actions={
          <>
            <Button size="small" variant="outlined" startIcon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
            <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmOpen(true)}>删除</Button>
          </>
        }
        tabs={[
          { label: '详情', value: 'details' },
          { label: `商机 (${relatedDeals.length})`, value: 'opportunities' },
          { label: '活动', value: 'activities' },
          { label: '备注', value: 'notes' },
        ]}
        tab={tab}
        onTabChange={setTab}
      >
        {tab === 'details' && (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 56, height: 56, fontSize: 18, bgcolor: avatarColor(contact.name) }}>{initials(contact.name)}</Avatar>
                <Box>
                  <Typography variant="h6">{contact.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{contact.position ?? '联系人'} · {contact.company?.name ?? '未关联客户'}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                <Field label="邮箱">{contact.email}</Field>
                <Field label="电话">{contact.phone}</Field>
                <Field label="客户公司">{contact.company?.name}</Field>
                <Field label="负责人">{contact.owner}</Field>
                <Field label="添加时间">{formatDate(contact.createdAt)}</Field>
                <Field label="最后更新">{formatDate(contact.updatedAt)}</Field>
              </Box>
            </Paper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>快速操作</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {contact.email && <Button size="small" variant="outlined" startIcon={<MailOutline />} href={`mailto:${contact.email}`}>发送邮件</Button>}
                {contact.phone && <Button size="small" variant="outlined" startIcon={<PhoneOutlined />} href={`tel:${contact.phone}`}>拨打电话</Button>}
                <Button size="small" variant="outlined" startIcon={<AddOutlined />} component={RouterLink} to={`/opportunities?new=1&contactId=${contactId}`}>创建商机</Button>
                <Button size="small" variant="outlined" startIcon={<AddOutlined />} component={RouterLink} to={`/activities?new=1&contactId=${contactId}`}>安排活动</Button>
                {contact.companyId && <Button size="small" variant="text" startIcon={<PlaceOutlined />} component={RouterLink} to={`/accounts/${contact.companyId}`}>查看客户公司</Button>}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>关联商机金额：{formatCurrency(totalValue, true)}</Typography>
              </Box>
            </Paper>
          </Box>
        )}

        {tab === 'opportunities' && (
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}><Typography variant="h6">相关商机</Typography></Box>
            <Table size="small">
              <TableHead><TableRow><TableCell>商机</TableCell><TableCell>阶段</TableCell><TableCell align="right">金额</TableCell><TableCell>预计成交</TableCell></TableRow></TableHead>
              <TableBody>
                {relatedDeals.map((deal) => (
                  <TableRow key={deal.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/opportunities/${deal.id}`)}>
                    <TableCell sx={{ fontWeight: 600 }}>{deal.title}</TableCell>
                    <TableCell><Chip size="small" variant="outlined" label={deal.stage.name} /></TableCell>
                    <TableCell align="right">{formatCurrency(deal.value)}</TableCell>
                    <TableCell>{formatDate(deal.expectedCloseDate)}</TableCell>
                  </TableRow>
                ))}
                {relatedDeals.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>暂无商机</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>
        )}

        {tab === 'activities' && <ActivitiesPanel contactId={contactId} />}
        {tab === 'notes' && <NotesPanel targetType="contact" targetId={contactId} />}
      </RecordLayout>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑联系人</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="姓名 *" value={form.name ?? ''} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <TextField label="职位" value={form.position ?? ''} onChange={(event) => setForm({ ...form, position: event.target.value })} />
            <TextField label="邮箱" value={form.email ?? ''} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <TextField label="电话" value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Box>
          <FormControl fullWidth>
            <InputLabel id="detail-company">客户公司</InputLabel>
            <Select labelId="detail-company" label="客户公司" value={form.companyId ? String(form.companyId) : ''} onChange={(event) => setForm({ ...form, companyId: event.target.value ? Number(event.target.value) : null })}>
              <MenuItem value="">未关联</MenuItem>
              {companies?.map((company) => <MenuItem key={company.id} value={String(company.id)}>{company.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="负责人" value={form.owner ?? ''} onChange={(event) => setForm({ ...form, owner: event.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name?.trim()}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="删除联系人"
        message={`确定删除联系人「${contact.name}」吗？`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteContact.mutate(contactId, { onSuccess: () => { setConfirmOpen(false); navigate('/contacts'); } })}
      />
    </Box>
  );
}

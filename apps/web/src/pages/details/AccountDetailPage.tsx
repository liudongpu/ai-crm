import { useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import WorkOutline from '@mui/icons-material/WorkOutline';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
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
import { useCompany, useContacts, useDeals, useDeleteCompany, useUpdateCompany } from '@/hooks/useCrm';
import { useTrackVisit } from '@/hooks/useRecent';
import { avatarColor, formatCurrency, formatDate, initials } from '@/lib/format';

export function AccountDetailPage() {
  const { id = '' } = useParams();
  const accountId = Number(id);
  const navigate = useNavigate();
  const { data: company, isLoading } = useCompany(accountId);
  const { data: contacts } = useContacts();
  const { data: deals } = useDeals();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const [tab, setTab] = useState('details');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', website: '', phone: '', address: '' });

  useTrackVisit('account', accountId, company?.name ?? '');
  useEffect(() => {
    if (company) setForm({ name: company.name, industry: company.industry ?? '', website: company.website ?? '', phone: company.phone ?? '', address: company.address ?? '' });
  }, [company]);

  if (isLoading || !company) {
    return <Skeleton variant="rounded" height={400} />;
  }

  const relatedContacts = (contacts ?? []).filter((item) => item.companyId === accountId);
  const relatedDeals = (deals ?? []).filter((item) => item.companyId === accountId);
  const totalValue = relatedDeals.reduce((sum, deal) => sum + deal.value, 0);

  const submit = () => {
    if (!form.name.trim()) return;
    updateCompany.mutate({ id: accountId, data: form }, { onSuccess: () => setEditOpen(false) });
  };

  const tabs = [
    { label: '详情', value: 'details' },
    { label: `联系人 (${relatedContacts.length})`, value: 'contacts' },
    { label: `商机 (${relatedDeals.length})`, value: 'opportunities' },
    { label: '活动', value: 'activities' },
    { label: '备注', value: 'notes' },
  ];

  return (
    <Box>
      <RecordLayout
        crumbs={[{ label: '首页', to: '/' }, { label: '客户', to: '/accounts' }, { label: company.name }]}
        title={company.name}
        subtitle={`${company.industry ?? '未填写行业'} · 创建于 ${formatDate(company.createdAt)}`}
        icon={<WorkOutline />}
        chips={<Chip size="small" color="primary" variant="outlined" label={`商机金额 ${formatCurrency(totalValue, true)}`} />}
        actions={
          <>
            <Button size="small" variant="outlined" startIcon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
            <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmOpen(true)}>删除</Button>
          </>
        }
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
      >
        {tab === 'details' && (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2.5 }}>客户信息</Typography>
              <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                <Field label="客户名称">{company.name}</Field>
                <Field label="行业">{company.industry}</Field>
                <Field label="电话">{company.phone}</Field>
                <Field label="网站">{company.website}</Field>
                <Field label="地址" span={2}>{company.address}</Field>
                <Field label="创建时间">{formatDate(company.createdAt)}</Field>
                <Field label="最后更新">{formatDate(company.updatedAt)}</Field>
              </Box>
            </Paper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2.5 }}>业务概览</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">联系人</Typography><Typography variant="h5">{relatedContacts.length}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">商机数量</Typography><Typography variant="h5">{relatedDeals.length}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">商机总金额</Typography><Typography variant="h5" color="primary.main">{formatCurrency(totalValue, true)}</Typography></Box>
                <Button variant="outlined" size="small" startIcon={<AddOutlined />} component={RouterLink} to={`/opportunities?new=1&companyId=${accountId}`}>为该客户创建商机</Button>
              </Box>
            </Paper>
          </Box>
        )}

        {tab === 'contacts' && (
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">相关联系人</Typography>
              <Button size="small" variant="outlined" startIcon={<AddOutlined />} component={RouterLink} to={`/contacts?new=1&companyId=${accountId}`}>新建联系人</Button>
            </Box>
            <Table size="small">
              <TableHead><TableRow><TableCell>姓名</TableCell><TableCell>职位</TableCell><TableCell>邮箱</TableCell><TableCell>电话</TableCell><TableCell>负责人</TableCell></TableRow></TableHead>
              <TableBody>
                {relatedContacts.map((contact) => (
                  <TableRow key={contact.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/contacts/${contact.id}`)}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: avatarColor(contact.name) }}>{initials(contact.name)}</Avatar>
                        {contact.name}
                      </Box>
                    </TableCell>
                    <TableCell>{contact.position ?? '—'}</TableCell>
                    <TableCell>{contact.email ?? '—'}</TableCell>
                    <TableCell>{contact.phone ?? '—'}</TableCell>
                    <TableCell>{contact.owner}</TableCell>
                  </TableRow>
                ))}
                {relatedContacts.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>暂无联系人</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>
        )}

        {tab === 'opportunities' && (
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}><Typography variant="h6">相关商机</Typography></Box>
            <Table size="small">
              <TableHead><TableRow><TableCell>商机</TableCell><TableCell>阶段</TableCell><TableCell align="right">金额</TableCell><TableCell>预计成交</TableCell><TableCell>优先级</TableCell></TableRow></TableHead>
              <TableBody>
                {relatedDeals.map((deal) => (
                  <TableRow key={deal.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/opportunities/${deal.id}`)}>
                    <TableCell sx={{ fontWeight: 600 }}>{deal.title}</TableCell>
                    <TableCell><Chip size="small" variant="outlined" label={deal.stage.name} /></TableCell>
                    <TableCell align="right">{formatCurrency(deal.value)}</TableCell>
                    <TableCell>{formatDate(deal.expectedCloseDate)}</TableCell>
                    <TableCell>{deal.priority === 'high' ? '高' : deal.priority === 'medium' ? '中' : '低'}</TableCell>
                  </TableRow>
                ))}
                {relatedDeals.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>暂无商机</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>
        )}

        {tab === 'activities' && <ActivitiesPanel accountId={accountId} />}
        {tab === 'notes' && <NotesPanel targetType="account" targetId={accountId} />}
      </RecordLayout>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑客户</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          {(['name', 'industry', 'phone', 'website', 'address'] as const).map((key) => (
            <TextField key={key} label={key === 'name' ? '客户名称 *' : key === 'industry' ? '行业' : key === 'phone' ? '电话' : key === 'website' ? '网站' : '地址'} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} fullWidth />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name.trim()}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="删除客户"
        message={`确定删除客户「${company.name}」吗？`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteCompany.mutate(accountId, { onSuccess: () => { setConfirmOpen(false); navigate('/accounts'); } })}
      />
    </Box>
  );
}

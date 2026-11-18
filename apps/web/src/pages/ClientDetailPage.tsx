import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { InvoicesPanel } from '@/components/common/BillingPanels';
import { Field, FieldGrid } from '@/components/common/Field';
import { NotesPanel } from '@/components/common/NotesPanel';
import { RecordLayout } from '@/components/common/RecordLayout';
import { EmptyState, ErrorState } from '@/components/common/States';
import { useClient, useContacts, useMatters, useTrustTransactions, useUsers } from '@/hooks/useCrm';
import { useTrackVisit } from '@/hooks/useRecent';
import { avatarColor, formatCurrency, formatDate, initials } from '@/lib/format';
import { clientStatusMeta, trustCategoryMeta, trustTypeMeta } from '@/lib/meta';
import { ClientFormDialog } from './ClientsPage';

const tabs = [
  { label: '概览', value: 'overview' },
  { label: '相关案件', value: 'matters' },
  { label: '联系人', value: 'contacts' },
  { label: '账单', value: 'invoices' },
  { label: '信托交易', value: 'trust' },
  { label: '备注', value: 'notes' },
];

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const { data: client, isLoading, isError, error, refetch } = useClient(clientId);
  const { data: allMatters } = useMatters();
  const { data: allContacts } = useContacts();
  const { data: trusts } = useTrustTransactions({ clientId });
  const { data: users } = useUsers();
  useTrackVisit('client', clientId, client?.name);

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={240} height={36} />
        <Skeleton variant="rounded" height={160} sx={{ mt: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ mt: 2 }} />
      </Box>
    );
  }
  if (isError || !client) {
    return <ErrorState message={error?.message ?? '客户不存在或加载失败'} onRetry={() => void refetch()} />;
  }

  const matters = (allMatters ?? []).filter((matter) => matter.clientId === clientId);
  const contacts = (allContacts ?? []).filter((contact) => contact.clientId === clientId);
  const balance = (trusts ?? []).reduce((sum, item) => {
    if (item.type === 'deposit' || item.type === 'transfer_in') return sum + item.amount;
    if (item.type === 'withdrawal' || item.type === 'transfer_out' || item.type === 'refund') return sum - item.amount;
    return sum;
  }, 0);

  return (
    <Box>
      <RecordLayout
        crumbs={[{ label: '客户管理', to: '/clients' }, { label: client.name }]}
        title={client.name}
        subtitle={`${client.type === 'company' ? '公司客户' : '个人客户'} · ${client.industry || '未填写行业'}`}
        icon={<AccountBalanceOutlined />}
        chips={<Chip size="small" variant="outlined" color={clientStatusMeta[client.status]?.color} label={clientStatusMeta[client.status]?.label ?? client.status} />}
        actions={<Button size="small" variant="outlined" startIcon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑客户</Button>}
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
      >
        {tab === 'overview' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>客户档案</Typography>
                <FieldGrid columns={3}>
                  <Field label="客户类型">{client.type === 'company' ? '公司' : '个人'}</Field>
                  <Field label="行业">{client.industry}</Field>
                  <Field label="主要联系人">{client.contactName}</Field>
                  <Field label="邮箱">{client.email}</Field>
                  <Field label="电话">{client.phone}</Field>
                  <Field label="负责人">{users?.find((user) => user.id === client.ownerId)?.name}</Field>
                  <Field label="地址" span={2}>{client.address}</Field>
                  <Field label="账单地址">{client.billingAddress}</Field>
                  <Field label="备注" span={3}>{client.notes}</Field>
                </FieldGrid>
              </CardContent>
            </Card>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Card><CardContent><Typography variant="body2" color="text.secondary">案件数量</Typography><Typography variant="h5" fontWeight={700}>{matters.length}</Typography></CardContent></Card>
              <Card><CardContent><Typography variant="body2" color="text.secondary">标的金额</Typography><Typography variant="h5" fontWeight={700}>{formatCurrency(matters.reduce((sum, item) => sum + Number(item.value || 0), 0), true)}</Typography></CardContent></Card>
              <Card><CardContent><Typography variant="body2" color="text.secondary">信托余额</Typography><Typography variant="h5" fontWeight={700}>{formatCurrency(balance, true)}</Typography></CardContent></Card>
            </Box>
          </Box>
        )}

        {tab === 'matters' && (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>案件</TableCell><TableCell>阶段</TableCell><TableCell>执业领域</TableCell><TableCell>状态</TableCell><TableCell align="right">标的金额</TableCell></TableRow></TableHead>
              <TableBody>
                {matters.map((matter) => (
                  <TableRow key={matter.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/matters/${matter.id}`)}>
                    <TableCell sx={{ fontWeight: 600 }}>{matter.title}</TableCell>
                    <TableCell>{matter.stage?.name ?? `#${matter.stageId}`}</TableCell>
                    <TableCell>{matter.practiceArea}</TableCell>
                    <TableCell>{matter.status}</TableCell>
                    <TableCell align="right">{formatCurrency(matter.value, true)}</TableCell>
                  </TableRow>
                ))}
                {matters.length === 0 && <TableRow><TableCell colSpan={5}><EmptyState title="暂无相关案件" /></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 'contacts' && (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>姓名</TableCell><TableCell>职位</TableCell><TableCell>邮箱</TableCell><TableCell>电话</TableCell><TableCell>主要联系人</TableCell></TableRow></TableHead>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/contacts/${contact.id}`)}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 10, bgcolor: avatarColor(contact.name) }}>{initials(contact.name)}</Avatar>
                        <Typography variant="body2" fontWeight={600}>{contact.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{contact.position ?? '—'}</TableCell>
                    <TableCell>{contact.email ?? '—'}</TableCell>
                    <TableCell>{contact.mobile ?? contact.phone ?? '—'}</TableCell>
                    <TableCell>{contact.isPrimary ? <Chip size="small" color="primary" variant="outlined" label="主要" /> : '—'}</TableCell>
                  </TableRow>
                ))}
                {contacts.length === 0 && <TableRow><TableCell colSpan={5}><EmptyState title="暂无联系人" action={<Button size="small" onClick={() => navigate('/contacts?new=1')}>添加联系人</Button>} /></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 'invoices' && <InvoicesPanel clientId={clientId} />}

        {tab === 'trust' && (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>日期</TableCell><TableCell>类型</TableCell><TableCell>类别</TableCell><TableCell>说明</TableCell><TableCell align="right">金额</TableCell><TableCell>对账</TableCell></TableRow></TableHead>
              <TableBody>
                {(trusts ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell><Chip size="small" variant="outlined" color={trustTypeMeta[item.type]?.color} label={trustTypeMeta[item.type]?.label ?? item.type} /></TableCell>
                    <TableCell>{trustCategoryMeta[item.category] ?? item.category}</TableCell>
                    <TableCell>{item.description ?? '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</TableCell>
                    <TableCell><Chip size="small" label={item.reconciled ? '已对账' : '未对账'} color={item.reconciled ? 'success' : 'default'} variant="outlined" /></TableCell>
                  </TableRow>
                ))}
                {(trusts ?? []).length === 0 && <TableRow><TableCell colSpan={6}><EmptyState title="暂无信托交易" /></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 'notes' && <NotesPanel targetType="client" targetId={clientId} />}
      </RecordLayout>

      <ClientFormDialog open={editOpen} onClose={() => setEditOpen(false)} client={client} />
    </Box>
  );
}

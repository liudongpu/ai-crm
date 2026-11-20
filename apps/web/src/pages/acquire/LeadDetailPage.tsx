import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EditOutlined from '@mui/icons-material/EditOutlined';
import GavelOutlined from '@mui/icons-material/Gavel';
import TransformOutlined from '@mui/icons-material/Transform';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Field, FieldGrid } from '@/components/common/Field';
import { NotesPanel } from '@/components/common/NotesPanel';
import { RecordLayout } from '@/components/common/RecordLayout';
import { ErrorState } from '@/components/common/States';
import { useConvertLead, useLead, useUsers } from '@/hooks/useCrm';
import { useTrackVisit } from '@/hooks/useRecent';
import { avatarColor, formatDate, initials } from '@/lib/format';
import { leadRatingMeta, leadStatusMeta } from '@/lib/meta';
import type { LeadConvertResult } from '@/types';
import { ConflictCheckDialog, LeadFormDialog } from './LeadsPage';

const tabs = [
  { label: '概览', value: 'overview' },
  { label: '备注', value: 'notes' },
];

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const leadId = Number(id);
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertResult, setConvertResult] = useState<LeadConvertResult | null>(null);
  const [convertForm, setConvertForm] = useState({ clientName: '', practiceArea: '', value: '0', title: '' });
  const { data: lead, isLoading, isError, error, refetch } = useLead(leadId);
  const { data: users } = useUsers();
  const convertLead = useConvertLead();
  useTrackVisit('lead', leadId, lead?.name);

  const openConvert = () => {
    setConvertResult(null);
    setConvertForm({
      clientName: lead?.company || lead?.name || '',
      practiceArea: lead?.practiceArea ?? '',
      value: '0',
      title: lead?.name ? `${lead.name} 咨询案件` : '',
    });
    setConvertOpen(true);
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={240} height={36} />
        <Skeleton variant="rounded" height={160} sx={{ mt: 2 }} />
        <Skeleton variant="rounded" height={280} sx={{ mt: 2 }} />
      </Box>
    );
  }
  if (isError || !lead) {
    return <ErrorState message={error?.message ?? '咨询线索不存在或加载失败'} onRetry={() => void refetch()} />;
  }

  const converted = lead.status === 'converted';

  return (
    <Box>
      <RecordLayout
        crumbs={[{ label: '咨询线索', to: '/leads' }, { label: lead.name }]}
        title={lead.name}
        subtitle={`${lead.company ?? '个人咨询'} · ${lead.source ?? '来源未记录'}`}
        icon={
          <Avatar sx={{ width: 40, height: 40, fontSize: 13, bgcolor: avatarColor(lead.name) }}>
            {initials(lead.name)}
          </Avatar>
        }
        chips={
          <>
            <Chip size="small" variant="outlined" color={leadStatusMeta[lead.status]?.color} label={leadStatusMeta[lead.status]?.label ?? lead.status} />
            <Chip size="small" variant="outlined" sx={{ color: leadRatingMeta[lead.rating]?.color }} label={leadRatingMeta[lead.rating]?.label ?? lead.rating} />
            {lead.conflictChecked && (
              <Chip size="small" variant="outlined" color={lead.conflictResult === 'clear' ? 'success' : 'error'}
                label={lead.conflictResult === 'clear' ? '冲突检查通过' : '存在冲突'} />
            )}
          </>
        }
        actions={
          <>
            <Button size="small" variant="outlined" startIcon={<GavelOutlined />} onClick={() => setConflictOpen(true)}>冲突检查</Button>
            <Button size="small" variant="outlined" startIcon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
            <Button size="small" variant="contained" startIcon={<TransformOutlined />} onClick={openConvert} disabled={converted}>
              {converted ? '已转换' : '一键转换'}
            </Button>
          </>
        }
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
      >
        {tab === 'overview' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>咨询信息</Typography>
                <FieldGrid columns={3}>
                  <Field label="咨询人">{lead.name}</Field>
                  <Field label="公司">{lead.company}</Field>
                  <Field label="邮箱">{lead.email}</Field>
                  <Field label="电话">{lead.phone}</Field>
                  <Field label="来源">{lead.source}</Field>
                  <Field label="意向执业领域">{lead.practiceArea}</Field>
                  <Field label="状态">{leadStatusMeta[lead.status]?.label ?? lead.status}</Field>
                  <Field label="意向评级">{leadRatingMeta[lead.rating]?.label ?? lead.rating}</Field>
                  <Field label="负责人">{users?.find((user) => user.id === lead.ownerId)?.name}</Field>
                  <Field label="冲突检查">{lead.conflictChecked ? (lead.conflictResult === 'clear' ? '无冲突' : '存在冲突') : '未检查'}</Field>
                  <Field label="创建时间">{formatDate(lead.createdAt)}</Field>
                  <Field label="转换时间">{formatDate(lead.convertedAt)}</Field>
                  <Field label="咨询描述" span={3}>{lead.description}</Field>
                </FieldGrid>
              </CardContent>
            </Card>

            {converted && (
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>转换结果</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined" onClick={() => navigate(`/clients/${lead.convertedClientId}`)} disabled={!lead.convertedClientId}>客户 #{lead.convertedClientId}</Button>
                    <Button size="small" variant="outlined" onClick={() => navigate(`/contacts/${lead.convertedContactId}`)} disabled={!lead.convertedContactId}>联系人 #{lead.convertedContactId}</Button>
                    <Button size="small" variant="outlined" onClick={() => navigate(`/matters/${lead.convertedMatterId}`)} disabled={!lead.convertedMatterId}>案件 #{lead.convertedMatterId}</Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
        {tab === 'notes' && <NotesPanel targetType="lead" targetId={leadId} />}
      </RecordLayout>

      <LeadFormDialog open={editOpen} onClose={() => setEditOpen(false)} lead={lead} />
      <ConflictCheckDialog open={conflictOpen} onClose={() => setConflictOpen(false)} initialName={lead.name} />

      <Dialog open={convertOpen} onClose={() => setConvertOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>转换为客户 / 联系人 / 案件</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          {convertResult ? (
            <Box>
              <Typography variant="subtitle1" color="success.main" sx={{ mb: 1.5 }}>转换成功，已创建以下记录：</Typography>
              {[
                { label: '客户', id: convertResult.client.id, path: `/clients/${convertResult.client.id}`, name: convertResult.client.name },
                { label: '联系人', id: convertResult.contact.id, path: `/contacts/${convertResult.contact.id}`, name: convertResult.contact.name },
                { label: '案件', id: convertResult.matter.id, path: `/matters/${convertResult.matter.id}`, name: convertResult.matter.title },
              ].map((item) => (
                <Button key={item.label} fullWidth sx={{ justifyContent: 'flex-start', mb: 1 }} variant="outlined"
                  onClick={() => { setConvertOpen(false); navigate(item.path); }}>
                  {item.label}：{item.name}
                </Button>
              ))}
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                系统将创建客户、联系人与案件记录，并把当前线索标记为已转换。
              </Typography>
              <TextField label="客户名称" value={convertForm.clientName} onChange={(event) => setConvertForm({ ...convertForm, clientName: event.target.value })} fullWidth />
              <TextField label="案件标题" value={convertForm.title} onChange={(event) => setConvertForm({ ...convertForm, title: event.target.value })} fullWidth />
              <TextField label="执业领域" value={convertForm.practiceArea} onChange={(event) => setConvertForm({ ...convertForm, practiceArea: event.target.value })} fullWidth />
              <TextField label="标的金额" type="number" value={convertForm.value} onChange={(event) => setConvertForm({ ...convertForm, value: event.target.value })} fullWidth />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertOpen(false)} color="inherit">{convertResult ? '关闭' : '取消'}</Button>
          {!convertResult && (
            <Button variant="contained" disabled={convertLead.isPending} onClick={() => convertLead.mutate({
              id: leadId,
              data: {
                clientName: convertForm.clientName.trim() || undefined,
                practiceArea: convertForm.practiceArea.trim() || undefined,
                value: Number(convertForm.value) || undefined,
                title: convertForm.title.trim() || undefined,
              },
            }, { onSuccess: (data) => setConvertResult(data) })}>确认转换</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

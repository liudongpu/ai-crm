import { useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import PersonOutline from '@mui/icons-material/PersonOutline';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
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
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { ActivitiesPanel } from '@/components/common/ActivitiesPanel';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Field } from '@/components/common/Field';
import { NotesPanel } from '@/components/common/NotesPanel';
import { RecordLayout } from '@/components/common/RecordLayout';
import { useConvertLead, useDeleteLead, useLead, useUpdateLead } from '@/hooks/useCrm';
import { useTrackVisit } from '@/hooks/useRecent';
import { avatarColor, formatDate, initials } from '@/lib/format';
import { leadRatingMeta, leadStatusMeta } from '@/lib/meta';
import type { LeadInput, LeadStatus } from '@/types';

export function LeadDetailPage() {
  const { id = '' } = useParams();
  const leadId = Number(id);
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(leadId);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();
  const [tab, setTab] = useState('details');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState<LeadInput>({ name: '', company: '' });

  useTrackVisit('lead', leadId, lead?.name ?? '');
  useEffect(() => {
    if (lead) {
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
    }
  }, [lead]);

  if (isLoading || !lead) return <Skeleton variant="rounded" height={400} />;

  const submit = () => {
    if (!form.name?.trim() || !form.company?.trim()) return;
    updateLead.mutate({ id: leadId, data: form }, { onSuccess: () => setEditOpen(false) });
  };

  return (
    <Box>
      <RecordLayout
        crumbs={[{ label: '首页', to: '/' }, { label: '潜在客户', to: '/leads' }, { label: lead.name }]}
        title={lead.name}
        subtitle={`${lead.company}${lead.title ? ` · ${lead.title}` : ''} · 创建于 ${formatDate(lead.createdAt)}`}
        icon={<PersonOutline />}
        chips={
          <>
            <Chip size="small" color={leadStatusMeta[lead.status].color} variant="outlined" label={leadStatusMeta[lead.status].label} />
            <Chip size="small" variant="outlined" label={leadRatingMeta[lead.rating].label} sx={{ color: leadRatingMeta[lead.rating].color }} />
          </>
        }
        actions={
          <>
            {lead.status !== 'converted' && (
              <Button size="small" variant="contained" startIcon={<AutoAwesomeOutlined />} onClick={() => convertLead.mutate(leadId)} disabled={convertLead.isPending}>转换为客户</Button>
            )}
            <Button size="small" variant="outlined" startIcon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
            <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmOpen(true)}>删除</Button>
          </>
        }
        tabs={[
          { label: '详情', value: 'details' },
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
                <Avatar sx={{ width: 56, height: 56, fontSize: 18, bgcolor: avatarColor(lead.name) }}>{initials(lead.name)}</Avatar>
                <Box>
                  <Typography variant="h6">{lead.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{lead.company} · {lead.title ?? '联系人'}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                <Field label="公司">{lead.company}</Field>
                <Field label="职位">{lead.title}</Field>
                <Field label="邮箱">{lead.email}</Field>
                <Field label="电话">{lead.phone}</Field>
                <Field label="来源">{lead.source}</Field>
                <Field label="负责人">{lead.owner}</Field>
                <Field label="意向程度">{leadRatingMeta[lead.rating].label}</Field>
                <Field label="状态">{leadStatusMeta[lead.status].label}</Field>
                <Field label="描述" span={2}>{lead.description}</Field>
                <Field label="创建时间">{formatDate(lead.createdAt)}</Field>
                <Field label="最后更新">{formatDate(lead.updatedAt)}</Field>
              </Box>
            </Paper>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>快速操作</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {lead.email && <Button size="small" variant="outlined" startIcon={<MailOutline />} href={`mailto:${lead.email}`}>发送邮件</Button>}
                  {lead.phone && <Button size="small" variant="outlined" startIcon={<PhoneOutlined />} href={`tel:${lead.phone}`}>拨打电话</Button>}
                  <Button size="small" variant="outlined" startIcon={<AddOutlined />} component={RouterLink} to={`/activities?new=1&leadId=${leadId}`}>安排跟进活动</Button>
                </Box>
              </Paper>
              {lead.status === 'converted' ? (
                <Paper sx={{ p: 3, borderColor: 'success.main' }}>
                  <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>已转换</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>转换时间 {formatDate(lead.convertedAt)}</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {lead.convertedContactId && <Link component={RouterLink} to={`/contacts/${lead.convertedContactId}`} variant="body2">查看生成的联系人 →</Link>}
                    {lead.convertedDealId && <Link component={RouterLink} to={`/opportunities/${lead.convertedDealId}`} variant="body2">查看生成的商机 →</Link>}
                  </Box>
                </Paper>
              ) : (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>转化线索</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    转换后将自动创建客户公司、联系人以及一个初始商机。
                  </Typography>
                  <Button fullWidth variant="contained" startIcon={<AutoAwesomeOutlined />} onClick={() => convertLead.mutate(leadId)} disabled={convertLead.isPending}>转换为客户与商机</Button>
                </Paper>
              )}
            </Box>
          </Box>
        )}

        {tab === 'activities' && <ActivitiesPanel contactId={lead.convertedContactId ?? undefined} />}
        {tab === 'notes' && <NotesPanel targetType="lead" targetId={leadId} />}
      </RecordLayout>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑潜在客户</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="姓名 *" value={form.name ?? ''} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <TextField label="公司 *" value={form.company ?? ''} onChange={(event) => setForm({ ...form, company: event.target.value })} />
            <TextField label="职位" value={form.title ?? ''} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <TextField label="电话" value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <TextField label="邮箱" value={form.email ?? ''} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <TextField label="来源" value={form.source ?? ''} onChange={(event) => setForm({ ...form, source: event.target.value })} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="lead-detail-status">状态</InputLabel>
              <Select labelId="lead-detail-status" label="状态" value={form.status ?? 'new'} onChange={(event) => setForm({ ...form, status: event.target.value as LeadStatus })}>
                {(Object.keys(leadStatusMeta) as LeadStatus[]).map((key) => <MenuItem key={key} value={key}>{leadStatusMeta[key].label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="lead-detail-rating">意向程度</InputLabel>
              <Select labelId="lead-detail-rating" label="意向程度" value={form.rating ?? 'warm'} onChange={(event) => setForm({ ...form, rating: event.target.value as LeadInput['rating'] })}>
                {(Object.keys(leadRatingMeta) as Array<keyof typeof leadRatingMeta>).map((key) => <MenuItem key={key} value={key}>{leadRatingMeta[key].label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="描述" value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={2} />
          <TextField label="负责人" value={form.owner ?? ''} onChange={(event) => setForm({ ...form, owner: event.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name?.trim() || !form.company?.trim()}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="删除潜在客户"
        message={`确定删除潜在客户「${lead.name}」吗？`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteLead.mutate(leadId, { onSuccess: () => { setConfirmOpen(false); navigate('/leads'); } })}
      />
    </Box>
  );
}

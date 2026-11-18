import { useEffect, useState } from 'react';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import HighlightOff from '@mui/icons-material/HighlightOff';
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined';
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
import LinearProgress from '@mui/material/LinearProgress';
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
import { useCompanies, useContacts, useDeal, useDeleteDeal, useMoveDeal, usePipelines, useUpdateDeal } from '@/hooks/useCrm';
import { useTrackVisit } from '@/hooks/useRecent';
import { avatarColor, formatCurrency, formatDate, initials } from '@/lib/format';
import { dealStatusMeta, priorityMeta } from '@/lib/meta';
import type { DealInput, DealStatus } from '@/types';

export function OpportunityDetailPage() {
  const { id = '' } = useParams();
  const dealId = Number(id);
  const navigate = useNavigate();
  const { data: deal, isLoading } = useDeal(dealId);
  const { data: pipelines } = usePipelines();
  const { data: companies } = useCompanies();
  const { data: contacts } = useContacts();
  const updateDeal = useUpdateDeal();
  const moveDeal = useMoveDeal();
  const deleteDeal = useDeleteDeal();
  const [tab, setTab] = useState('details');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState<DealInput>({ title: '', value: 0 });

  useTrackVisit('opportunity', dealId, deal?.title ?? '');
  useEffect(() => {
    if (deal) {
      setForm({
        title: deal.title,
        value: deal.value,
        stageId: deal.stageId,
        companyId: deal.companyId,
        contactId: deal.contactId,
        priority: deal.priority,
        status: deal.status,
        expectedCloseDate: deal.expectedCloseDate ?? '',
        source: deal.source ?? '',
      });
    }
  }, [deal]);

  if (isLoading || !deal) return <Skeleton variant="rounded" height={400} />;

  const stages = pipelines?.find((item) => item.id === deal.pipelineId)?.stages ?? pipelines?.[0]?.stages ?? [];
  const submit = () => {
    if (!form.title?.trim()) return;
    updateDeal.mutate({ id: dealId, data: form }, { onSuccess: () => setEditOpen(false) });
  };
  const setStatus = (status: DealStatus) => updateDeal.mutate({ id: dealId, data: { status } });

  return (
    <Box>
      <RecordLayout
        crumbs={[{ label: '首页', to: '/' }, { label: '商机', to: '/opportunities' }, { label: deal.title }]}
        title={deal.title}
        subtitle={`${deal.company?.name ?? '未关联客户'} · 创建于 ${formatDate(deal.createdAt)}`}
        icon={<ViewKanbanOutlined />}
        chips={
          <>
            <Chip size="small" color={dealStatusMeta[deal.status].color} variant="outlined" label={dealStatusMeta[deal.status].label} />
            <Chip size="small" variant="outlined" label={deal.stage.name} />
            <Chip size="small" color={priorityMeta[deal.priority].color} variant="outlined" label={`优先级：${priorityMeta[deal.priority].label}`} />
          </>
        }
        actions={
          <>
            {deal.status === 'open' && (
              <>
                <Button size="small" variant="outlined" color="success" startIcon={<CheckCircleOutline />} onClick={() => setStatus('won')}>标记赢单</Button>
                <Button size="small" variant="outlined" color="error" startIcon={<HighlightOff />} onClick={() => setStatus('lost')}>标记输单</Button>
              </>
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
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                <Typography variant="h6">商机信息</Typography>
                <Typography variant="h5" color="primary.main" fontWeight={700}>{formatCurrency(deal.value)}</Typography>
              </Box>
              <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                <Field label="商机名称">{deal.title}</Field>
                <Field label="所属流程">{deal.pipeline?.name}</Field>
                <Field label="预计成交日">{formatDate(deal.expectedCloseDate)}</Field>
                <Field label="来源">{deal.source}</Field>
                <Field label="客户公司">
                  {deal.companyId ? <Link component={RouterLink} to={`/accounts/${deal.companyId}`}>{deal.company?.name}</Link> : null}
                </Field>
                <Field label="联系人">
                  {deal.contactId ? <Link component={RouterLink} to={`/contacts/${deal.contactId}`}>{deal.contact?.name}</Link> : null}
                </Field>
                <Field label="创建时间">{formatDate(deal.createdAt)}</Field>
                <Field label="最后更新">{formatDate(deal.updatedAt)}</Field>
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>阶段与赢单概率</Typography>
                <FormControl fullWidth size="small">
                  <InputLabel id="deal-detail-stage">当前阶段</InputLabel>
                  <Select
                    labelId="deal-detail-stage"
                    label="当前阶段"
                    value={String(deal.stageId)}
                    onChange={(event) => moveDeal.mutate({ id: dealId, stageId: Number(event.target.value) })}
                  >
                    {stages.map((stage) => <MenuItem key={stage.id} value={String(stage.id)}>{stage.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">赢单概率</Typography>
                  <Typography variant="caption" fontWeight={700}>{deal.stage.probability}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={deal.stage.probability} sx={{ height: 8, borderRadius: 4 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>加权金额 {formatCurrency(deal.value * deal.stage.probability / 100, true)}</Typography>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>关联记录</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 11, bgcolor: avatarColor(deal.company?.name ?? '-') }}>{initials(deal.company?.name ?? '-')}</Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">客户公司</Typography>
                      {deal.companyId ? <Link component={RouterLink} to={`/accounts/${deal.companyId}`} variant="body2">{deal.company?.name}</Link> : <Typography variant="body2">未关联</Typography>}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 11, bgcolor: avatarColor(deal.contact?.name ?? '-') }}>{initials(deal.contact?.name ?? '-')}</Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">关键联系人</Typography>
                      {deal.contactId ? <Link component={RouterLink} to={`/contacts/${deal.contactId}`} variant="body2">{deal.contact?.name}</Link> : <Typography variant="body2">未关联</Typography>}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}

        {tab === 'activities' && <ActivitiesPanel dealId={dealId} />}
        {tab === 'notes' && <NotesPanel targetType="opportunity" targetId={dealId} />}
      </RecordLayout>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑商机</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="商机名称 *" value={form.title ?? ''} onChange={(event) => setForm({ ...form, title: event.target.value })} fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="金额 (元)" type="number" value={form.value ?? ''} onChange={(event) => setForm({ ...form, value: Number(event.target.value) })} />
            <FormControl fullWidth>
              <InputLabel id="edit-deal-stage">阶段</InputLabel>
              <Select labelId="edit-deal-stage" label="阶段" value={String(form.stageId ?? '')} onChange={(event) => setForm({ ...form, stageId: Number(event.target.value) })}>
                {stages.map((stage) => <MenuItem key={stage.id} value={String(stage.id)}>{stage.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="edit-deal-company">客户公司</InputLabel>
              <Select labelId="edit-deal-company" label="客户公司" value={form.companyId ? String(form.companyId) : ''} onChange={(event) => setForm({ ...form, companyId: event.target.value ? Number(event.target.value) : null })}>
                <MenuItem value="">未关联</MenuItem>
                {companies?.map((company) => <MenuItem key={company.id} value={String(company.id)}>{company.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="edit-deal-contact">联系人</InputLabel>
              <Select labelId="edit-deal-contact" label="联系人" value={form.contactId ? String(form.contactId) : ''} onChange={(event) => setForm({ ...form, contactId: event.target.value ? Number(event.target.value) : null })}>
                <MenuItem value="">未关联</MenuItem>
                {contacts?.map((contact) => <MenuItem key={contact.id} value={String(contact.id)}>{contact.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="edit-deal-priority">优先级</InputLabel>
              <Select labelId="edit-deal-priority" label="优先级" value={form.priority ?? 'medium'} onChange={(event) => setForm({ ...form, priority: event.target.value as DealInput['priority'] })}>
                <MenuItem value="high">高</MenuItem><MenuItem value="medium">中</MenuItem><MenuItem value="low">低</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="edit-deal-status">状态</InputLabel>
              <Select labelId="edit-deal-status" label="状态" value={form.status ?? 'open'} onChange={(event) => setForm({ ...form, status: event.target.value as DealStatus })}>
                {(Object.keys(dealStatusMeta) as DealStatus[]).map((key) => <MenuItem key={key} value={key}>{dealStatusMeta[key].label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="预计成交日" type="date" value={form.expectedCloseDate ?? ''} onChange={(event) => setForm({ ...form, expectedCloseDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="来源" value={form.source ?? ''} onChange={(event) => setForm({ ...form, source: event.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.title?.trim()}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="删除商机"
        message={`确定删除商机「${deal.title}」吗？`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteDeal.mutate(dealId, { onSuccess: () => { setConfirmOpen(false); navigate('/opportunities'); } })}
      />
    </Box>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import EditOutlined from '@mui/icons-material/EditOutlined';
import GavelOutlined from '@mui/icons-material/Gavel';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { CommunicationsPanel } from '@/components/common/CommunicationsPanel';
import { DocumentsPanel } from '@/components/common/DocumentsPanel';
import { Field, FieldGrid } from '@/components/common/Field';
import { MatterPeoplePanel } from '@/components/common/MatterPeoplePanel';
import { MatterStageStepper } from '@/components/common/MatterStageStepper';
import { NotesPanel } from '@/components/common/NotesPanel';
import { RecordLayout } from '@/components/common/RecordLayout';
import { ToolCalculationsPanel } from '@/components/common/ToolCalculationsPanel';
import { ErrorState } from '@/components/common/States';
import { TasksPanel } from '@/components/common/TasksPanel';
import { ExpensesPanel, InvoicesPanel, TimeEntriesPanel } from '@/components/common/BillingPanels';
import { useClients, useMatter, useMatterStages, useUsers } from '@/hooks/useCrm';
import { useTrackVisit } from '@/hooks/useRecent';
import { formatCurrency, formatDate } from '@/lib/format';
import { matterStatusMeta, priorityMeta } from '@/lib/meta';
import { MatterFormDialog } from './MattersPage';

const tabs = [
  { label: '概览', value: 'overview' },
  { label: '当事人与团队', value: 'people' },
  { label: '任务', value: 'tasks' },
  { label: '文档', value: 'documents' },
  { label: '时间与费用', value: 'time' },
  { label: '账单', value: 'invoices' },
  { label: '备注', value: 'notes' },
  { label: '律师工具', value: 'tools' },
  { label: '沟通记录', value: 'communications' },
];

export function MatterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const matterId = Number(id);
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const { data: matter, isLoading, isError, error, refetch } = useMatter(matterId);
  const { data: stages } = useMatterStages();
  const { data: clients } = useClients();
  const { data: users } = useUsers();
  useTrackVisit('matter', matterId, matter?.title);

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={260} height={36} />
        <Skeleton variant="rounded" height={160} sx={{ mt: 2 }} />
        <Skeleton variant="rounded" height={320} sx={{ mt: 2 }} />
      </Box>
    );
  }
  if (isError || !matter) {
    return <ErrorState message={error?.message ?? '案件不存在或加载失败'} onRetry={() => void refetch()} />;
  }

  const stageName = matter.stage?.name ?? stages?.find((stage) => stage.id === matter.stageId)?.name ?? `阶段 #${matter.stageId}`;
  const clientName = matter.client?.name ?? clients?.find((client) => client.id === matter.clientId)?.name ?? `客户 #${matter.clientId}`;
  const ownerName = matter.owner?.name ?? users?.find((user) => user.id === matter.ownerId)?.name ?? '未指派';

  return (
    <Box>
      <RecordLayout
        crumbs={[{ label: '案件管理', to: '/matters' }, { label: matter.title }]}
        title={matter.title}
        subtitle={`${matter.caseNumber || '未编号'} · ${matter.practiceArea} · ${clientName}`}
        icon={<GavelOutlined />}
        chips={
          <>
            <Chip size="small" variant="outlined" label={stageName} />
            <Chip size="small" variant="outlined" color={matterStatusMeta[matter.status]?.color} label={matterStatusMeta[matter.status]?.label ?? matter.status} />
            <Chip size="small" variant="outlined" color={priorityMeta[matter.priority]?.color} label={`优先级：${priorityMeta[matter.priority]?.label ?? matter.priority}`} />
          </>
        }
        actions={<Button size="small" variant="outlined" startIcon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑案件</Button>}
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
      >
        {tab === 'overview' && (
          <>
            <MatterStageStepper matter={matter} stages={stages ?? []} />
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>案件信息</Typography>
                <FieldGrid columns={3}>
                  <Field label="案号">{matter.caseNumber}</Field>
                  <Field label="客户">{clientName}</Field>
                  <Field label="案件阶段">{stageName}</Field>
                  <Field label="案件类型">{matter.practiceArea}</Field>
                  <Field label="状态">{matterStatusMeta[matter.status]?.label ?? matter.status}</Field>
                  <Field label="优先级">{priorityMeta[matter.priority]?.label ?? matter.priority}</Field>
                  <Field label="负责人">{ownerName}</Field>
                  <Field label="标的金额">{formatCurrency(matter.value)}</Field>
                  <Field label="立案日期">{formatDate(matter.openDate)}</Field>
                  <Field label="结案日期">{formatDate(matter.closeDate)}</Field>
                  <Field label="创建时间">{formatDate(matter.createdAt)}</Field>
                  <Field label="看板排序">{matter.position}</Field>
                  <Field label="案件描述" span={3}>{matter.description}</Field>
                </FieldGrid>
              </CardContent>
            </Card>
          </>
        )}
        {tab === 'people' && <MatterPeoplePanel matterId={matterId} />}
        {tab === 'tasks' && <TasksPanel matterId={matterId} />}
        {tab === 'documents' && <DocumentsPanel matterId={matterId} />}
        {tab === 'time' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card><CardContent sx={{ p: 2 }}><Typography variant="h6" sx={{ mb: 1.5 }}>时间记录</Typography><TimeEntriesPanel matterId={matterId} /></CardContent></Card>
            <Card><CardContent sx={{ p: 2 }}><Typography variant="h6" sx={{ mb: 1.5 }}>费用记录</Typography><ExpensesPanel matterId={matterId} /></CardContent></Card>
          </Box>
        )}
        {tab === 'invoices' && <InvoicesPanel matterId={matterId} />}
        {tab === 'notes' && <NotesPanel targetType="matter" targetId={matterId} />}
        {tab === 'tools' && <ToolCalculationsPanel matterId={matterId} />}
        {tab === 'communications' && <CommunicationsPanel matterId={matterId} />}
      </RecordLayout>

      <MatterFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        matter={matter}
        stages={stages ?? []}
      />
    </Box>
  );
}

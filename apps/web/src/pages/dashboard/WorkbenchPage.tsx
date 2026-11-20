import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/States';
import { useMatters, useMatterStages, useMoveMatter, useUsers } from '@/hooks/useCrm';
import { avatarColor, formatCurrency, formatShortDate, initials } from '@/lib/format';
import { priorityMeta } from '@/lib/meta';
import type { Matter, MatterStage } from '@/types';

type Scope = 'mine' | 'all';

const PRIORITY_ORDER: Record<Matter['priority'], number> = { high: 0, medium: 1, low: 2 };
/** 「已归档」泳道最多展示的案件条数。 */
const ARCHIVE_LIMIT = 10;

/** 拖拽卡片：点击打开案件详情，拖动到其他泳道即可更新阶段。 */
function DraggableCaseCard({ matter, onOpen }: { matter: Matter; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: matter.id,
    data: { stageId: matter.stageId },
  });
  const priority = priorityMeta[matter.priority];
  return (
    <Paper
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      sx={{
        position: 'relative',
        p: 1.25,
        mb: 1,
        cursor: 'grab',
        opacity: isDragging ? 0.35 : 1,
        transform: CSS.Translate.toString(transform),
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
        '&:active': { cursor: 'grabbing' },
        '&:hover': { borderColor: 'primary.light', boxShadow: '0 3px 10px rgba(27,54,93,0.10)' },
      }}
    >
      <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, bgcolor: matter.stage?.color ?? 'primary.main' }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 0.5 }}>
        <Typography variant="body2" fontWeight={700} noWrap sx={{ lineHeight: 1.4 }}>{matter.title}</Typography>
        <Chip
          size="small"
          variant="outlined"
          label={priority?.label ?? matter.priority}
          color={priority?.color}
          sx={{ height: 18, flexShrink: 0, '& .MuiChip-label': { px: 0.5, fontSize: 10 } }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mt: 0.25 }}>
        {matter.caseNumber || '未编号'} · {matter.practiceArea}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
        <Avatar sx={{ width: 20, height: 20, fontSize: 9, bgcolor: avatarColor(matter.client?.name) }}>
          {initials(matter.client?.name ?? matter.title)}
        </Avatar>
        <Typography variant="caption" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>{matter.client?.name ?? `客户 #${matter.clientId}`}</Typography>
        <Typography variant="caption" fontWeight={800} sx={{ color: 'primary.main' }}>{formatCurrency(matter.value, true)}</Typography>
      </Stack>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.75 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>立案 {formatShortDate(matter.openDate)}</Typography>
        {matter.owner && (
          <Avatar title={`负责人 ${matter.owner.name}`} sx={{ width: 18, height: 18, fontSize: 9, bgcolor: avatarColor(matter.owner.name) }}>
            {initials(matter.owner.name)}
          </Avatar>
        )}
      </Box>
    </Paper>
  );
}

/** 阶段泳道：整列作为放置目标，拖入即更新案件阶段。 */
function Swimlane({
  stage,
  matters,
  onOpen,
  isArchive,
  hiddenCount,
}: {
  stage: MatterStage;
  matters: Matter[];
  onOpen: (id: number) => void;
  isArchive: boolean;
  hiddenCount: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}`, data: { stageId: stage.id } });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        minWidth: 244,
        flex: '1 0 244px',
        maxWidth: 300,
        bgcolor: isOver ? '#eef2f7' : '#f8fafc',
        border: '1px solid',
        borderColor: isOver ? 'primary.main' : 'divider',
        borderRadius: 1.5,
        p: 1,
        minHeight: 240,
        transition: 'background-color .15s, border-color .15s',
      }}
    >
      <Box sx={{ px: 0.5, pt: 0.25, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: stage.color, flexShrink: 0 }} />
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flexGrow: 1 }}>{stage.name}</Typography>
          <Chip size="small" label={matters.length} sx={{ height: 20, '& .MuiChip-label': { px: 0.6, fontSize: 10 } }} />
        </Box>
        <LinearProgress
          variant="determinate"
          value={stage.probability ?? 0}
          sx={{ height: 4, borderRadius: 2, bgcolor: '#e9edf2', mt: 0.75, '& .MuiLinearProgress-bar': { bgcolor: stage.color, borderRadius: 2 } }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
          成交概率 {stage.probability ?? 0}%
          {isArchive ? ' · 仅最近 10 条' : ''}
        </Typography>
      </Box>

      {matters.map((matter) => <DraggableCaseCard key={matter.id} matter={matter} onOpen={() => onOpen(matter.id)} />)}

      {matters.length === 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', py: 4 }}>
          拖拽案件到此泳道
        </Typography>
      )}

      {hiddenCount > 0 && (
        <Alert severity="info" icon={false} sx={{ mt: 0.5, py: 0, '& .MuiAlert-message': { py: 0.5, fontSize: 11 } }}>
          另有 {hiddenCount} 条已归档案件未显示
        </Alert>
      )}
    </Box>
  );
}

export function WorkbenchPage() {
  const navigate = useNavigate();
  const { data: matters = [], isLoading, isError, error, refetch } = useMatters();
  const { data: stages = [] } = useMatterStages();
  const { data: users = [] } = useUsers();
  const moveMatter = useMoveMatter();
  const [scope, setScope] = useState<Scope>('mine');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const currentUser = users[0];

  const scopedMatters = useMemo(
    () => (scope === 'mine' ? matters.filter((matter) => matter.ownerId === currentUser?.id) : matters),
    [matters, scope, currentUser?.id],
  );

  const lanes = useMemo(() => {
    return stages.map((stage) => {
      const items = scopedMatters.filter((matter) => matter.stageId === stage.id);
      const isArchive = stage.isFinal || stage.name === '已归档';
      let visible = items;
      let hiddenCount = 0;
      if (isArchive) {
        // 「最近」以结案日期为准，未结案的回退到立案日期。
        const sorted = items.slice().sort((a, b) => {
          const timeOf = (matter: Matter) => new Date(matter.closeDate ?? matter.openDate).getTime() || 0;
          return timeOf(b) - timeOf(a);
        });
        visible = sorted.slice(0, ARCHIVE_LIMIT);
        hiddenCount = Math.max(0, sorted.length - visible.length);
      } else {
        visible = items.slice().sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || Number(b.value || 0) - Number(a.value || 0));
      }
      return { stage, matters: visible, isArchive, hiddenCount };
    });
  }, [stages, scopedMatters]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as { stageId?: number } | undefined;
    const overData = over.data.current as { stageId?: number } | undefined;
    const targetStageId = overData?.stageId ?? Number(String(over.id).replace('stage-', ''));
    const matterId = Number(active.id);
    if (!targetStageId || !matterId || activeData?.stageId === targetStageId) return;
    moveMatter.mutate({ id: matterId, stageId: targetStageId });
  };

  return (
    <Box>
      <PageHeader
        title="案件看板"
        subtitle={`${scopedMatters.length} 件案件 · 按阶段泳道展示，拖拽卡片可更新阶段`}
        actions={
          <>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={scope}
              onChange={(_, value: Scope | null) => value && setScope(value)}
            >
              <ToggleButton value="mine" sx={{ px: 1.25 }}>我负责的</ToggleButton>
              <ToggleButton value="all" sx={{ px: 1.25 }}>全部案件</ToggleButton>
            </ToggleButtonGroup>
            <Button size="small" startIcon={<RefreshOutlined />} onClick={() => void refetch()}>刷新</Button>
          </>
        }
      />

      {isError && <ErrorState message={error?.message ?? '案件加载失败'} onRetry={() => void refetch()} />}

      {isLoading ? (
        <Box sx={{ display: 'flex', gap: 1.5, overflow: 'hidden' }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Box key={index} sx={{ minWidth: 244, flex: '1 0 244px' }}>
              <Skeleton variant="rounded" height={240} />
            </Box>
          ))}
        </Box>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <Box sx={{ overflowX: 'auto', pb: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              {lanes.map(({ stage, matters, isArchive, hiddenCount }) => (
                <Swimlane
                  key={stage.id}
                  stage={stage}
                  matters={matters}
                  isArchive={isArchive}
                  hiddenCount={hiddenCount}
                  onOpen={(id) => navigate(`/matters/${id}`)}
                />
              ))}
            </Stack>
          </Box>
        </DndContext>
      )}

      {!isLoading && lanes.every((lane) => lane.matters.length === 0) && (
        <Alert severity="info" sx={{ mt: 1 }}>
          当前范围内暂无案件。可切换到「全部案件」或在案件中心新建。
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, color: 'text.secondary' }}>
        <ViewKanbanOutlined sx={{ fontSize: 16 }} />
        <Typography variant="caption">拖动案件卡片到其他泳道即可更新案件阶段；「已归档」泳道仅展示最近 {ARCHIVE_LIMIT} 条。</Typography>
      </Box>
    </Box>
  );
}

import { useState } from 'react';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedOutlined from '@mui/icons-material/RadioButtonUncheckedOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useMoveMatter, useTasks } from '@/hooks/useCrm';
import { formatDate } from '@/lib/format';
import type { Matter, MatterStage } from '@/types';

/** 案件详情阶段进度：横向卡片面板，点击下一阶段卡片检查任务并确认推进。 */
export function MatterStageStepper({ matter, stages }: { matter: Matter; stages: MatterStage[] }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [force, setForce] = useState(false);
  const moveMatter = useMoveMatter('案件阶段已推进');
  const { data: tasks = [] } = useTasks({ matterId: matter.id });

  const currentIndex = stages.findIndex((stage) => stage.id === matter.stageId);
  const currentStage = currentIndex >= 0 ? stages[currentIndex] : undefined;
  const nextStage = currentIndex >= 0 && currentIndex < stages.length - 1 ? stages[currentIndex + 1] : undefined;
  const pendingTasks = tasks.filter((task) => !task.done);

  const openConfirm = () => {
    setForce(false);
    setConfirmOpen(true);
  };

  const confirm = () => {
    if (!nextStage || (pendingTasks.length > 0 && !force)) return;
    moveMatter.mutate({ id: matter.id, stageId: nextStage.id }, { onSuccess: () => setConfirmOpen(false) });
  };

  const stageState = (index: number) => {
    if (currentIndex < 0) return 'unknown' as const;
    if (index < currentIndex) return 'done' as const;
    if (index === currentIndex) return 'current' as const;
    if (index === currentIndex + 1) return 'next' as const;
    return 'future' as const;
  };

  const cardSx = (state: ReturnType<typeof stageState>) => ({
    minWidth: 132,
    maxWidth: 160,
    flex: '1 1 132px',
    border: '1px solid',
    borderColor:
      state === 'current' ? 'primary.main' : state === 'next' ? 'primary.light' : state === 'done' ? 'success.light' : 'divider',
    bgcolor: state === 'current' ? 'primary.main' : state === 'done' ? 'action.hover' : 'background.paper',
    color: state === 'current' ? 'primary.contrastText' : state === 'future' ? 'text.disabled' : 'text.primary',
  });

  const stageCard = (stage: MatterStage, index: number) => {
    const state = stageState(index);
    const content = (
      <Box sx={{ p: 1.5, textAlign: 'left' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid currentColor',
            }}
          >
            {state === 'done' ? <CheckCircleOutline fontSize="small" color="success" /> : index + 1}
          </Box>
          {state === 'done' && <Chip size="small" variant="outlined" color="success" label="已完成" />}
          {state === 'current' && <Chip size="small" label="当前阶段" sx={{ bgcolor: 'common.white', color: 'primary.main' }} />}
          {state === 'next' && <Chip size="small" variant="outlined" color="primary" label="待推进" />}
        </Box>
        <Typography variant="subtitle2" fontWeight={700} noWrap title={stage.name}>
          {stage.name}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.75 }}>
          {state === 'next' ? '点击检查任务并推进' : state === 'current' ? '进行中' : stage.isFinal ? '最终阶段' : `第 ${index + 1} 阶段`}
        </Typography>
      </Box>
    );

    return state === 'next' ? (
      <Card key={stage.id} sx={cardSx(state)} variant="outlined">
        <CardActionArea onClick={openConfirm} sx={{ height: '100%' }}>
          {content}
        </CardActionArea>
      </Card>
    ) : (
      <Card key={stage.id} sx={cardSx(state)} variant="outlined">
        {content}
      </Card>
    );
  };

  return (
    <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>案件阶段</Typography>
        {nextStage ? (
          <Button size="small" variant="contained" onClick={openConfirm}>
            推进到「{nextStage.name}」
          </Button>
        ) : (
          <Chip size="small" variant="outlined" label={currentStage?.isFinal ? '已到最终阶段' : '阶段信息待同步'} />
        )}
      </Box>
      {stages.length === 0 ? (
        <Typography variant="body2" color="text.secondary">暂无阶段配置</Typography>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0.5, overflowX: 'auto', pb: 0.5 }}>
          {stages.map((stage, index) => (
            <Box key={stage.id} sx={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
              {stageCard(stage, index)}
              {index < stages.length - 1 && <ArrowForwardRounded fontSize="small" color="disabled" sx={{ mx: 0.5 }} />}
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>推进到「{nextStage?.name ?? ''}」</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Alert severity={pendingTasks.length > 0 ? 'warning' : 'success'}>
            {pendingTasks.length > 0
              ? `当前阶段「${currentStage?.name ?? '—'}」还有 ${pendingTasks.length} 项任务未完成，需勾选强制推进后才能继续。`
              : `当前阶段「${currentStage?.name ?? '—'}」任务已全部完成，可以推进。`}
          </Alert>
          <Typography variant="subtitle2" fontWeight={700}>当前阶段任务</Typography>
          {tasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">该案件暂无任务</Typography>
          ) : (
            <List dense disablePadding>
              {tasks.map((task) => (
                <ListItem key={task.id} disableGutters divider>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {task.done
                      ? <CheckCircleOutline fontSize="small" color="success" />
                      : <RadioButtonUncheckedOutlined fontSize="small" color="disabled" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={task.title}
                    secondary={task.dueDate ? `截止 ${formatDate(task.dueDate)}` : '无截止日期'}
                  />
                  <Chip size="small" variant="outlined" color={task.done ? 'success' : 'warning'} label={task.done ? '已完成' : '未完成'} />
                </ListItem>
              ))}
            </List>
          )}
          {pendingTasks.length > 0 && (
            <FormControlLabel
              control={<Checkbox checked={force} onChange={(event) => setForce(event.target.checked)} />}
              label="强制推进（忽略未完成任务）"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">取消</Button>
          <Button
            variant="contained"
            disabled={!nextStage || (pendingTasks.length > 0 && !force) || moveMatter.isPending}
            onClick={confirm}
          >
            确认推进
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

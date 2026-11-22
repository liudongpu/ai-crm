import { useState } from 'react';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedOutlined from '@mui/icons-material/RadioButtonUncheckedOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import { useMoveMatter, useTasks } from '@/hooks/useCrm';
import { formatDate } from '@/lib/format';
import type { Matter, MatterStage } from '@/types';

/** 案件详情阶段进度条：推进前检查当前案件任务，未完成需显式勾选强制推进。 */
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
        <Stepper activeStep={Math.max(0, currentIndex)} alternativeLabel>
          {stages.map((stage, index) => (
            <Step key={stage.id} completed={currentIndex >= 0 && index < currentIndex}>
              {index === currentIndex + 1 ? (
                <StepButton onClick={openConfirm} optional={<Typography variant="caption">点击推进</Typography>}>
                  {stage.name}
                </StepButton>
              ) : (
                <StepLabel>{stage.name}</StepLabel>
              )}
            </Step>
          ))}
        </Stepper>
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

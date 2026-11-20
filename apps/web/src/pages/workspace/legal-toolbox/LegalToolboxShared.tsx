import type { ReactNode } from 'react';
import BuildOutlined from '@mui/icons-material/BuildOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useToast } from '@/components/common/ToastProvider';
import { useSaveToolCalculation } from '@/hooks/useCrm';
import type { Matter } from '@/types';

/** 律师工具箱统一强调色。 */
export const TOOLBOX_COLOR = '#0f766e';

/** 工具箱统一声明：本地规则生成，必须人工核对；演示能力单独标注。 */
export function ToolboxBanner({ meta, demo }: { meta?: { disclaimer?: string }; demo?: boolean }) {
  return (
    <Alert
      severity={demo ? 'warning' : 'info'}
      icon={<BuildOutlined fontSize="small" />}
      sx={{ mb: 2, alignItems: 'flex-start' }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {demo ? '本地演示数据 · 非实时查询 / 未真实识别' : '本地规则测算 · 需人工核对'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {meta?.disclaimer ??
          (demo
            ? '本项能力使用内置演示数据或处理状态占位，不连接外部数据源、不上传文件；正式使用须接入合规服务并人工复核。'
            : '测算依据本地规则与公开标准，仅供辅助参考；请以最新官方标准与案件证据人工核对后使用。')}
      </Typography>
    </Alert>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper sx={{ p: 2.5, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );
}

export function MatterPicker({
  matterId,
  setMatterId,
  matters,
}: {
  matterId: string;
  setMatterId: (value: string) => void;
  matters?: Matter[];
}) {
  return (
    <FormControl fullWidth size="small">
      <InputLabel>当前案件（用于保存结果）</InputLabel>
      <Select value={matterId} label="当前案件（用于保存结果）" onChange={(e) => setMatterId(String(e.target.value))}>
        <MenuItem value="">不选择案件</MenuItem>
        {(matters ?? []).map((m) => (
          <MenuItem key={m.id} value={m.id}>
            {m.caseNumber ? `${m.caseNumber} · ` : ''}
            {m.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

/**
 * 一键保存：把结构化输入与结果快照写入 tool_calculations，
 * 并关联当前案件，可在案件详情「律师工具」页签追溯。
 */
export function SaveToMatterButton({
  matterId,
  toolCode,
  toolName,
  title,
  input,
  result,
  summary,
  disabled,
}: {
  matterId: string;
  toolCode: string;
  toolName: string;
  title: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  summary?: string;
  disabled?: boolean;
}) {
  const toast = useToast();
  const save = useSaveToolCalculation();

  const handleSave = () => {
    if (!matterId) {
      toast.warning('请先在上方选择当前案件');
      return;
    }
    save.mutate(
      {
        matterId: Number(matterId),
        toolCode,
        toolName,
        title,
        input,
        result,
        summary: summary ?? '本地规则测算结果，已人工核对范围与输入参数',
      },
      { onSuccess: () => toast.success('结果已保存到当前案件的「律师工具」记录') },
    );
  };

  return (
    <Button
      variant="contained"
      startIcon={<SaveOutlined />}
      onClick={handleSave}
      disabled={disabled || save.isPending}
    >
      {save.isPending ? '保存中…' : '一键保存到当前案件'}
    </Button>
  );
}

export function ResultPlaceholder({ text }: { text: string }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
      <BuildOutlined sx={{ fontSize: 40, opacity: 0.4 }} />
      <Typography variant="body2" sx={{ mt: 1 }}>
        {text}
      </Typography>
    </Box>
  );
}

export function Money({ value }: { value: number | null | undefined }) {
  const amount = value ?? 0;
  return (
    <Box component="span" sx={{ fontWeight: 700, color: TOOLBOX_COLOR }}>
      {amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元
    </Box>
  );
}

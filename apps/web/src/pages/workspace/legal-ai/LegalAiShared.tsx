import type { ReactNode } from 'react';
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { LegalAiMeta, StatuteCitation } from '@/types';

/** 该模块统一强调色。 */
export const LEGAL_AI_COLOR = '#7c3aed';

/** 所有法律 AI 页面统一声明：本地规则 + 真实数据 + 人工核对。 */
export function LocalRulesBanner({ meta }: { meta?: LegalAiMeta }) {
  return (
    <Alert
      severity="info"
      icon={<SmartToyOutlined fontSize="small" />}
      sx={{ mb: 2, alignItems: 'flex-start' }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        本地规则生成 · 需人工核对
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {meta?.disclaimer ??
          '基于本所真实案件、文档与备注数据，由本地规则生成草稿；不调用外部模型，不自动发送或提交。'}
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

/** 法条引用卡：强制展示原文、有效状态与来源，杜绝幻觉式引用。 */
export function CitationCards({ citations }: { citations: StatuteCitation[] }) {
  if (!citations.length) {
    return (
      <Alert severity="warning" icon={<WarningAmberOutlined fontSize="small" />}>
        本地权威库中未检索到可核验的条文，本次不生成法条引用。
      </Alert>
    );
  }
  return (
    <Stack spacing={1.5}>
      {citations.map((c) => (
        <Box
          key={c.code}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.75, bgcolor: 'background.default' }}
        >
          <Stack direction="row" justifyContent="space-between" gap={1} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {c.title} {c.article}
            </Typography>
            <Stack direction="row" spacing={0.75}>
              <Chip
                size="small"
                icon={<VerifiedOutlined />}
                color={c.statusValid ? 'success' : 'warning'}
                label={c.status}
                variant={c.statusValid ? 'filled' : 'outlined'}
              />
              <Chip size="small" variant="outlined" label={c.effectiveFrom} />
            </Stack>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.9 }}>
            {c.text}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {c.statusNote} · 来源：{c.source}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

export function ResultPlaceholder({ text }: { text: string }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
      <SmartToyOutlined sx={{ fontSize: 40, opacity: 0.4 }} />
      <Typography variant="body2" sx={{ mt: 1 }}>
        {text}
      </Typography>
    </Box>
  );
}

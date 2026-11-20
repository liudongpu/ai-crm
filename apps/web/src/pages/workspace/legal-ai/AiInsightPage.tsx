import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useToast } from '@/components/common/ToastProvider';
import { FieldGrid } from '@/components/common/Field';
import { PageHeader } from '@/components/common/PageHeader';
import { useAiInsights, useCreateWorkspaceItem, useMatters } from '@/hooks/useCrm';
import type { InsightResult, InsightRisk } from '@/types';
import { LEGAL_AI_COLOR, LocalRulesBanner, Panel, ResultPlaceholder } from './LegalAiShared';

const LEVEL_COLOR: Record<InsightRisk['level'], 'error' | 'warning' | 'info'> = {
  high: 'error',
  medium: 'warning',
  low: 'info',
};
const LEVEL_LABEL: Record<InsightRisk['level'], string> = { high: '高风险', medium: '预警', low: '提示' };

function formatMetric(value: number, unit: string) {
  const text = unit === '元'
    ? value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  return `${text} ${unit}`;
}

export function AiInsightPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { data: matters } = useMatters();
  const insights = useAiInsights();
  const save = useCreateWorkspaceItem();
  const [matterId, setMatterId] = useState('');
  const [periodDays, setPeriodDays] = useState(30);
  const [result, setResult] = useState<InsightResult | null>(null);

  const generate = () => {
    insights.mutate(
      { periodDays, matterId: matterId ? Number(matterId) : undefined },
      {
        onSuccess: (data) => {
          if (data.error) {
            toast.error(data.error);
            return;
          }
          setResult(data);
          toast.success(`已生成近 ${data.period.days} 天洞察：${data.trends.length} 项趋势、${data.risks.length} 项风险提示`);
        },
      },
    );
  };

  const saveInsight = () => {
    if (!result) return;
    const highRisks = result.risks.filter((r) => r.level === 'high').length;
    const detail = [
      `【洞察摘要】\n${result.summary}`,
      `【经营趋势对比】\n${result.trends.map((t) => `${t.label}：本期 ${formatMetric(t.current, t.unit)} / 上期 ${formatMetric(t.previous, t.unit)} / 环比 ${t.changePct}%`).join('\n')}`,
      `【待办优先级】\n${result.priorities.map((p, i) => `${i + 1}. ${p.title}（${p.matterTitle ?? '—'}，到期 ${p.dueDate ?? '未设置'}，得分 ${p.score}）`).join('\n') || '无'}`,
      `【风险提示】\n${result.risks.map((r) => `[${LEVEL_LABEL[r.level]}] ${r.label}：${r.detail}`).join('\n') || '无'}`,
      `【客户活跃度】\n${result.clientActivity.map((c) => `${c.name}：${c.lastContactDate ?? '暂无记录'}（${c.status}）${c.suggestion ? ` · ${c.suggestion}` : ''}`).join('\n') || '无'}`,
      `【排序规则】\n${result.rankingRule}`,
    ].join('\n\n');
    save.mutate(
      {
        featureCode: 'report_ai_insight',
        title: `AI洞察 · 近 ${result.period.days} 天${result.period.from} 至 ${result.period.to}`,
        summary: result.summary,
        status: '待查看',
        data: {
          topic: `经营趋势与风险（${result.period.days} 天）`,
          detail,
          level: highRisks ? '风险' : result.risks.length ? '预警' : '提示',
          status: '待查看',
        },
      },
      { onSuccess: () => toast.success('洞察已保存到「AI洞察」台账，待人工复核确认') },
    );
  };

  return (
    <>
      <PageHeader
        title="AI洞察"
        subtitle="基于本所真实案件、工时、账单、沟通与客户数据，本地规则生成经营趋势、待办优先级、风险提示与客户活跃度。"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<SaveOutlined />} onClick={saveInsight} disabled={!result || save.isPending}>
              {save.isPending ? '保存中…' : '保存洞察台账'}
            </Button>
            <Button variant="contained" startIcon={<AutoAwesomeOutlined />} onClick={generate} disabled={insights.isPending}>
              {insights.isPending ? '生成中…' : '生成洞察'}
            </Button>
          </Stack>
        }
      />
      <LocalRulesBanner meta={result ?? undefined} />

      <Panel title="生成条件" subtitle="趋势按本期与上一等长周期对比；选择案件后仅汇总该案件相关数据（客户维度为全所口径）。">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>统计周期</InputLabel>
            <Select value={periodDays} label="统计周期" onChange={(e) => setPeriodDays(Number(e.target.value))}>
              {[7, 30, 90].map((d) => (
                <MenuItem key={d} value={d}>近 {d} 天</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>案件（可选）</InputLabel>
            <Select value={matterId} label="案件（可选）" onChange={(e) => setMatterId(String(e.target.value))}>
              <MenuItem value="">— 全所口径 —</MenuItem>
              {(matters ?? []).map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.caseNumber ? `${m.caseNumber} · ` : ''}{m.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Panel>

      {!result && <Panel title="洞察概览"><ResultPlaceholder text="选择统计周期后点击「生成洞察」。" /></Panel>}

      {result && (
        <>
          <Panel
            title="洞察概览"
            subtitle={`统计区间：${result.period.from} 至 ${result.period.to} · 全文字段为草稿，需人工复核`}
          >
            <TextField
              fullWidth
              multiline
              minRows={5}
              value={result.summary}
              InputProps={{ readOnly: true }}
              inputProps={{ style: { fontFamily: 'inherit', lineHeight: 1.9 } }}
            />
            <FieldGrid columns={4}>
              <Box><Typography variant="caption" color="text.secondary">案件档案</Typography><Typography variant="body2">{result.sourceCounts.matters} 件</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">工时记录</Typography><Typography variant="body2">{result.sourceCounts.timeEntries} 条</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">账单</Typography><Typography variant="body2">{result.sourceCounts.invoices} 张</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">对外沟通</Typography><Typography variant="body2">{result.sourceCounts.communications} 条</Typography></Box>
            </FieldGrid>
          </Panel>

          <Panel title="经营趋势对比" subtitle="本期与上一等长周期对比；环比按上一周期数值计算，上一周期为 0 时按 100% 展示。">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>指标</TableCell>
                  <TableCell align="right">本期</TableCell>
                  <TableCell align="right">上期</TableCell>
                  <TableCell align="right">环比</TableCell>
                  <TableCell>说明</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.trends.map((t) => (
                  <TableRow key={t.key}>
                    <TableCell sx={{ fontWeight: 600 }}>{t.label}</TableCell>
                    <TableCell align="right">{formatMetric(t.current, t.unit)}</TableCell>
                    <TableCell align="right">{formatMetric(t.previous, t.unit)}</TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        icon={t.direction === 'up' ? <TrendingUpOutlined /> : t.direction === 'down' ? <TrendingDownOutlined /> : undefined}
                        color={t.direction === 'up' ? 'success' : t.direction === 'down' ? 'warning' : 'default'}
                        variant="outlined"
                        label={`${t.changePct > 0 ? '+' : ''}${t.changePct}%`}
                      />
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{t.detail}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <Panel title="待办智能排序" subtitle={result.rankingRule}>
            {result.priorities.length === 0 ? (
              <Typography variant="body2" color="text.secondary">当前范围内没有未完成待办。</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="right">#</TableCell>
                    <TableCell>事项</TableCell>
                    <TableCell>所属案件</TableCell>
                    <TableCell>到期日</TableCell>
                    <TableCell align="right">得分</TableCell>
                    <TableCell>排序依据</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.priorities.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell align="right">{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.title}</TableCell>
                      <TableCell>{p.matterTitle ?? '—'}</TableCell>
                      <TableCell>{p.dueDate ?? '未设置'}</TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={p.score} sx={{ color: '#fff', bgcolor: LEGAL_AI_COLOR }} />
                      </TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{p.reason}</Typography></TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => navigate(p.route)}>查看</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>

          <Panel title="风险提示" subtitle="与工作台同类规则：超过 24 小时未回复、需跟进、逾期账单、临期期限、沉默客户与未开票工时。">
            {result.risks.length === 0 ? (
              <Alert severity="success">当前范围内未发现风险提示，仍需人工复核业务数据。</Alert>
            ) : (
              <Stack spacing={1.25}>
                {result.risks.map((r, i) => (
                  <Alert
                    key={i}
                    severity={LEVEL_COLOR[r.level]}
                    action={
                      <Button color="inherit" size="small" onClick={() => navigate(r.route)}>
                        查看
                      </Button>
                    }
                  >
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={LEVEL_LABEL[r.level]} color={LEVEL_COLOR[r.level]} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.label}</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {r.detail}
                    </Typography>
                  </Alert>
                ))}
              </Stack>
            )}
          </Panel>

          <Panel title="客户活跃度" subtitle="按最近一次对外沟通时间排序，已严格排除内部备注；长期未联系仅为跟进建议。">
            {result.clientActivity.length === 0 ? (
              <Typography variant="body2" color="text.secondary">暂无活跃客户数据。</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>客户</TableCell>
                    <TableCell>最近对外沟通</TableCell>
                    <TableCell align="right">距今</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>建议</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.clientActivity.map((c) => (
                    <TableRow key={c.clientId}>
                      <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                      <TableCell>{c.lastContactDate ?? '暂无记录'}</TableCell>
                      <TableCell align="right">{c.daysSince >= 999 ? '—' : `${c.daysSince} 天`}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={c.status === '活跃' ? 'success' : c.status === '需关注' ? 'warning' : 'error'}
                          label={c.status}
                        />
                      </TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{c.suggestion}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>
        </>
      )}
    </>
  );
}

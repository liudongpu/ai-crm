import { useState } from 'react';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
import AddCircleOutlineOutlined from '@mui/icons-material/AddCircleOutlineOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
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
import { Field, FieldGrid } from '@/components/common/Field';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/common/ToastProvider';
import { useInterest, useMatters, useToolboxMeta } from '@/hooks/useCrm';
import type { InterestResult } from '@/types';
import {
  MatterPicker,
  Money,
  Panel,
  ResultPlaceholder,
  SaveToMatterButton,
  ToolboxBanner,
} from './LegalToolboxShared';

const today = new Date().toISOString().slice(0, 10);

export function InterestPage() {
  const toast = useToast();
  const { data: matters } = useMatters();
  const { data: meta } = useToolboxMeta();
  const calc = useInterest();
  const [matterId, setMatterId] = useState('');
  const [principal, setPrincipal] = useState('1000000');
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate, setEndDate] = useState(today);
  const [compound, setCompound] = useState<'single' | 'yearly' | 'monthly'>('single');
  const [rateSource, setRateSource] = useState<'1y' | '5y' | 'manual' | 'segments'>('1y');
  const [manualRate, setManualRate] = useState('3.45');
  const [paidAmount, setPaidAmount] = useState('0');
  const [doubleDelay, setDoubleDelay] = useState(false);
  const [delayStartDate, setDelayStartDate] = useState('');
  const [segments, setSegments] = useState<Array<{ from: string; rate: string }>>([]);
  const [result, setResult] = useState<InterestResult | null>(null);

  const useCustom = rateSource === 'segments';
  // 计算输入与归档快照使用同一对象，确保台账记录与本次运行参数完全一致。
  const toolInput = {
    principal: Number(principal) || 0,
    startDate,
    endDate,
    compound,
    rateSource: useCustom ? 'manual' : rateSource,
    manualRate: rateSource === 'manual' ? Number(manualRate) || 0 : undefined,
    segments: useCustom
      ? segments.filter((s) => s.from).map((s) => ({ from: s.from, rate: Number(s.rate) || 0 }))
      : undefined,
    paidAmount: Number(paidAmount) || 0,
    doubleDelay,
    delayStartDate: delayStartDate || undefined,
  };
  const inputSnapshot = toolInput;

  const submit = () => {
    calc.mutate(toolInput, {
      onSuccess: (data) => {
        if (data.result.error) {
          setResult(null);
          toast.error(data.result.error);
          return;
        }
        setResult(data.result);
      },
    });
  };

  return (
    <>
      <PageHeader
        title="利息测算器"
        subtitle="迟延履行期间加倍部分债务利息，以及 LPR 分段计息与按年/按月复利测算。"
        actions={
          <Button variant="contained" startIcon={<CalculateOutlined />} onClick={submit} disabled={calc.isPending}>
            {calc.isPending ? '计算中…' : '计算利息'}
          </Button>
        }
      />
      <ToolboxBanner meta={result ?? undefined} />

      <Panel title="计息条件" subtitle="按实际天数/365 计息；LPR 历史值为本地演示参考库。">
        <Stack spacing={2}>
          <MatterPicker matterId={matterId} setMatterId={setMatterId} matters={matters} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" fullWidth label="本金（元）" type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            <TextField size="small" fullWidth label="已付金额（元）" type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" fullWidth type="date" label="起算日期" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <TextField size="small" fullWidth type="date" label="截止日期" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>计息方式</InputLabel>
              <Select value={compound} label="计息方式" onChange={(e) => setCompound(e.target.value as typeof compound)}>
                <MenuItem value="single">单利</MenuItem>
                <MenuItem value="yearly">按年复利</MenuItem>
                <MenuItem value="monthly">按月复利</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>利率来源</InputLabel>
              <Select value={rateSource} label="利率来源" onChange={(e) => setRateSource(e.target.value as typeof rateSource)}>
                <MenuItem value="1y">LPR 1 年期（分段）</MenuItem>
                <MenuItem value="5y">LPR 5 年期以上（分段）</MenuItem>
                <MenuItem value="manual">手动固定利率</MenuItem>
                <MenuItem value="segments">自定义分段利率</MenuItem>
              </Select>
            </FormControl>
            {rateSource === 'manual' && (
              <TextField size="small" fullWidth label="年利率（%）" type="number" value={manualRate} onChange={(e) => setManualRate(e.target.value)} />
            )}
          </Stack>

          {rateSource === 'segments' && (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">自定义分段利率（起始日 + 年利率 %）</Typography>
                <Button size="small" startIcon={<AddCircleOutlineOutlined />} onClick={() => setSegments((prev) => [...prev, { from: startDate, rate: '3.45' }])}>
                  添加分段
                </Button>
              </Stack>
              {segments.map((seg, i) => (
                <Stack key={i} direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                  <TextField size="small" type="date" label="生效日" InputLabelProps={{ shrink: true }} value={seg.from} onChange={(e) => setSegments((prev) => prev.map((s, idx) => (idx === i ? { ...s, from: e.target.value } : s)))} />
                  <TextField size="small" type="number" label="年利率（%）" value={seg.rate} onChange={(e) => setSegments((prev) => prev.map((s, idx) => (idx === i ? { ...s, rate: e.target.value } : s)))} />
                  <IconButton size="small" onClick={() => setSegments((prev) => prev.filter((_, idx) => idx !== i))}>
                    <DeleteOutlineOutlined fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Box>
          )}

          <FormControlLabel
            control={<Checkbox size="small" checked={doubleDelay} onChange={(e) => setDoubleDelay(e.target.checked)} />}
            label={<Typography variant="body2">计入迟延履行期间加倍部分债务利息（日万分之一点七五）</Typography>}
          />
          {doubleDelay && (
            <TextField size="small" type="date" label="迟延起算日（默认同起算日期）" InputLabelProps={{ shrink: true }} value={delayStartDate} onChange={(e) => setDelayStartDate(e.target.value)} />
          )}
        </Stack>
      </Panel>

      {!result && <Panel title="计算结果"><ResultPlaceholder text="填写本金与起止日期后点击「计算利息」。" /></Panel>}

      {result && (
        <>
          <Panel title="利息汇总">
            <FieldGrid columns={4}>
              <Field label="计息本金（扣除已付）"><Money value={result.principal - result.paidAmount} /></Field>
              <Field label="期内利息"><Money value={result.totalInterest} /></Field>
              <Field label="迟延履行加倍利息"><Money value={result.delayInterest} /></Field>
              <Field label="本息合计"><Money value={result.total} /></Field>
              <Field label="计息方式">{result.compound === 'single' ? '单利' : result.compound === 'yearly' ? '按年复利' : '按月复利'}</Field>
              <Field label="利率来源">{result.rateSource === 'manual' ? '手动固定利率' : result.rateSource === '5y' ? 'LPR 5 年期' : 'LPR 1 年期'}</Field>
              <Field label="迟延天数">{result.delayDays} 天</Field>
              <Field label="已付金额"><Money value={result.paidAmount} /></Field>
            </FieldGrid>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              {result.disclaimer}
            </Typography>
          </Panel>

          <Panel title="分段计息明细" subtitle="LPR 调整时自动分段，复利按分段本金滚动计算。">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>起始日</TableCell>
                  <TableCell>截止日</TableCell>
                  <TableCell align="right">天数</TableCell>
                  <TableCell align="right">年利率</TableCell>
                  <TableCell align="right">本段利息（元）</TableCell>
                  <TableCell align="right">期末本金（元）</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.segments.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.from}</TableCell>
                    <TableCell>{row.to}</TableCell>
                    <TableCell align="right">{row.days}</TableCell>
                    <TableCell align="right">{row.rate}%</TableCell>
                    <TableCell align="right">{row.interest.toLocaleString('zh-CN')}</TableCell>
                    <TableCell align="right">{row.principalAfter.toLocaleString('zh-CN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <Stack direction="row" spacing={1}>
            <SaveToMatterButton
              matterId={matterId}
              toolCode="tool_interest"
              toolName="利息测算器"
              title={`利息测算 · 本金 ${result.principal.toLocaleString('zh-CN')} 元`}
              input={inputSnapshot}
              result={{ ...result }}
              summary={`期内利息 ${result.totalInterest} 元，迟延加倍利息 ${result.delayInterest} 元，本息合计 ${result.total} 元`}
            />
          </Stack>
        </>
      )}

      <Panel title="本地 LPR 参考表" subtitle="演示数据，正式主张请核对全国银行间同业拆借中心公告。">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>生效日</TableCell>
              <TableCell align="right">1 年期 LPR（%）</TableCell>
              <TableCell align="right">5 年期以上 LPR（%）</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(meta?.lprHistory ?? []).slice().reverse().map((row) => (
              <TableRow key={row.from}>
                <TableCell>{row.from}</TableCell>
                <TableCell align="right">{row.oneYear}</TableCell>
                <TableCell align="right">{row.fiveYear}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}

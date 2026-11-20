import { useState } from 'react';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
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
import { Field, FieldGrid } from '@/components/common/Field';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/common/ToastProvider';
import { useLitigationFee, useMatters, useToolboxMeta } from '@/hooks/useCrm';
import type { LitigationFeeResult } from '@/types';
import {
  MatterPicker,
  Money,
  Panel,
  ResultPlaceholder,
  SaveToMatterButton,
  ToolboxBanner,
} from './LegalToolboxShared';

const CASE_TYPES = [
  { code: 'property', label: '财产案件' },
  { code: 'divorce', label: '离婚案件' },
  { code: 'labor', label: '劳动争议案件' },
  { code: 'ip', label: '商标/专利/著作权纠纷' },
  { code: 'admin', label: '行政案件' },
  { code: 'other', label: '其他非财产案件' },
];

export function LitigationFeePage() {
  const toast = useToast();
  const { data: matters } = useMatters();
  const { data: meta } = useToolboxMeta();
  const calc = useLitigationFee();
  const [matterId, setMatterId] = useState('');
  const [caseType, setCaseType] = useState('property');
  const [amount, setAmount] = useState('1000000');
  const [jurisdiction, setJurisdiction] = useState('national');
  const [reduction, setReduction] = useState<'none' | 'half'>('none');
  const [result, setResult] = useState<LitigationFeeResult | null>(null);

  const submit = () => {
    calc.mutate(
      { caseType, amount: Number(amount) || 0, jurisdiction, reduction },
      {
        onSuccess: (data) => {
          if (data.error) {
            toast.error(data.error);
            return;
          }
          setResult(data.result);
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title="诉讼执行计算器"
        subtitle="诉讼费、保全费、仲裁费分段计算，支持各地标准与减半规则；结果可一键保存到当前案件。"
        actions={
          <Button variant="contained" startIcon={<CalculateOutlined />} onClick={submit} disabled={calc.isPending}>
            {calc.isPending ? '计算中…' : '开始计算'}
          </Button>
        }
      />
      <ToolboxBanner meta={result ?? undefined} />

      <Panel title="计算条件" subtitle="财产案件按诉讼金额分段累计；非财产案件按件收取。">
        <Stack spacing={2}>
          <MatterPicker matterId={matterId} setMatterId={setMatterId} matters={matters} />
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              案件类型
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(meta?.feeCaseTypes ?? CASE_TYPES).map((item) => (
                <Chip
                  key={item.code}
                  label={item.label}
                  clickable
                  color={caseType === item.code ? 'primary' : 'default'}
                  variant={caseType === item.code ? 'filled' : 'outlined'}
                  onClick={() => setCaseType(item.code)}
                />
              ))}
            </Stack>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              size="small"
              fullWidth
              label="诉讼/保全金额（元）"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={caseType !== 'property'}
            />
            <FormControl fullWidth size="small">
              <InputLabel>地区标准</InputLabel>
              <Select value={jurisdiction} label="地区标准" onChange={(e) => setJurisdiction(e.target.value)}>
                {(meta?.jurisdictions ?? [{ code: 'national', label: '全国标准' }]).map((j) => (
                  <MenuItem key={j.code} value={j.code}>
                    {j.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>减免规则</InputLabel>
              <Select
                value={reduction}
                label="减免规则"
                onChange={(e) => setReduction(e.target.value as 'none' | 'half')}
              >
                <MenuItem value="none">无减免</MenuItem>
                <MenuItem value="half">减半（简易程序/调解/撤诉）</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Panel>

      {!result && <Panel title="计算结果"><ResultPlaceholder text="填写条件后点击「开始计算」。" /></Panel>}

      {result && (
        <>
          <Panel
            title="费用汇总"
            subtitle={`${result.caseTypeLabel} · ${result.jurisdictionLabel} · 标的额 ${result.amount.toLocaleString('zh-CN')} 元`}
          >
            <FieldGrid columns={4}>
              <Field label="应收诉讼费（减免后）"><Money value={result.finalFee} /></Field>
              <Field label="财产保全费（上限 5000 元）"><Money value={result.preservationFee} /></Field>
              <Field label={`仲裁费 · ${result.arbitration.table}`}><Money value={result.arbitration.fee} /></Field>
              <Field label="预估合计（含地方杂费）"><Money value={result.totalEstimate} /></Field>
              <Field label="标准诉讼费">{result.baseFee.toLocaleString('zh-CN')} 元</Field>
              <Field label="减免规则">{result.reduction}</Field>
              <Field label="地方公告费">{result.localFees.announcement} 元</Field>
              <Field label="担保服务费（演示）">{result.localFees.guaranteeService} 元</Field>
            </FieldGrid>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              {result.disclaimer}
            </Typography>
          </Panel>

          {result.detail && result.detail.length > 0 && (
            <Panel title="诉讼费分段明细" subtitle="按《诉讼费用交纳办法》财产案件分段累计交纳标准。">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>费率区间</TableCell>
                    <TableCell align="right">本段金额（元）</TableCell>
                    <TableCell align="right">费率</TableCell>
                    <TableCell align="right">本段费用（元）</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.detail.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell align="right">{row.base.toLocaleString('zh-CN')}</TableCell>
                      <TableCell align="right">{(row.rate * 100).toFixed(2)}%</TableCell>
                      <TableCell align="right">{row.fee.toLocaleString('zh-CN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          )}

          <Stack direction="row" spacing={1}>
            <SaveToMatterButton
              matterId={matterId}
              toolCode="tool_fee"
              toolName="诉讼执行计算器"
              title={`${result.caseTypeLabel}费用测算 · ${result.amount.toLocaleString('zh-CN')} 元`}
              input={{ caseType, amount: Number(amount) || 0, jurisdiction, reduction }}
              result={{ ...result }}
              summary={`诉讼费 ${result.finalFee} 元，保全费 ${result.preservationFee} 元，预估合计 ${result.totalEstimate} 元`}
            />
          </Stack>
        </>
      )}
    </>
  );
}

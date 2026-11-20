import { useState } from 'react';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
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
import { useCompensation, useMatters, useToolboxMeta } from '@/hooks/useCrm';
import type { CompensationInput, CompensationResult } from '@/types';
import {
  MatterPicker,
  Money,
  Panel,
  ResultPlaceholder,
  SaveToMatterButton,
  ToolboxBanner,
} from './LegalToolboxShared';

const TYPES: Array<{ code: CompensationInput['type']; label: string }> = [
  { code: 'personal', label: '人身损害赔偿' },
  { code: 'work_injury', label: '工伤赔偿' },
  { code: 'work_death', label: '工亡赔偿' },
  { code: 'economic', label: '劳动经济补偿金' },
];

export function CompensationPage() {
  const toast = useToast();
  const { data: matters } = useMatters();
  const { data: meta } = useToolboxMeta();
  const calc = useCompensation();
  const [matterId, setMatterId] = useState('');
  const [type, setType] = useState<CompensationInput['type']>('personal');
  const [region, setRegion] = useState('national');
  const [monthlyWage, setMonthlyWage] = useState('8000');
  const [medicalCost, setMedicalCost] = useState('50000');
  const [lostWageMonths, setLostWageMonths] = useState('6');
  const [careMonths, setCareMonths] = useState('3');
  const [disabilityGrade, setDisabilityGrade] = useState('10');
  const [otherCost, setOtherCost] = useState('5000');
  const [yearsWorked, setYearsWorked] = useState('5');
  const [compensationMode, setCompensationMode] = useState<'N' | 'N1' | '2N'>('N');
  const [applyTripleCap, setApplyTripleCap] = useState(false);
  const [localAverageWage, setLocalAverageWage] = useState('');
  const [result, setResult] = useState<CompensationResult | null>(null);

  const buildInput = (): CompensationInput => ({
    type,
    region,
    monthlyWage: Number(monthlyWage) || 0,
    medicalCost: Number(medicalCost) || 0,
    lostWageMonths: Number(lostWageMonths) || 0,
    careMonths: Number(careMonths) || 0,
    disabilityGrade: Number(disabilityGrade) || 10,
    otherCost: Number(otherCost) || 0,
    yearsWorked: Number(yearsWorked) || 0,
    compensationMode,
    applyTripleCap,
    localAverageWage: localAverageWage ? Number(localAverageWage) : undefined,
  });

  const submit = () => {
    calc.mutate(buildInput(), {
      onSuccess: (data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        setResult(data.result);
      },
    });
  };

  return (
    <>
      <PageHeader
        title="赔偿测算器"
        subtitle="人身损害、工伤（含工亡）与劳动经济补偿金 N / N+1 / 2N 测算，逐项列明计算口径。"
        actions={
          <Button variant="contained" startIcon={<CalculateOutlined />} onClick={submit} disabled={calc.isPending}>
            {calc.isPending ? '测算中…' : '开始测算'}
          </Button>
        }
      />
      <ToolboxBanner meta={result ?? undefined} />

      <Panel title="测算条件" subtitle="地区统计指标与部分补助标准为本地演示参考值，须按受诉地最新公布数据调整。">
        <Stack spacing={2}>
          <MatterPicker matterId={matterId} setMatterId={setMatterId} matters={matters} />
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>赔偿类型</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {TYPES.map((item) => (
                <Chip
                  key={item.code}
                  label={item.label}
                  clickable
                  color={type === item.code ? 'primary' : 'default'}
                  variant={type === item.code ? 'filled' : 'outlined'}
                  onClick={() => setType(item.code)}
                />
              ))}
            </Stack>
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel>适用地区统计标准</InputLabel>
            <Select value={region} label="适用地区统计标准" onChange={(e) => setRegion(e.target.value)}>
              {Object.entries(meta?.compensationStats ?? {}).map(([code, stat]) => (
                <MenuItem key={code} value={code}>{stat.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {type !== 'economic' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField size="small" fullWidth label="月工资 / 本人工资（元）" type="number" value={monthlyWage} onChange={(e) => setMonthlyWage(e.target.value)} />
              <TextField size="small" fullWidth label="医疗费（元）" type="number" value={medicalCost} onChange={(e) => setMedicalCost(e.target.value)} />
              <TextField size="small" fullWidth label="误工/停工留薪月数" type="number" value={lostWageMonths} onChange={(e) => setLostWageMonths(e.target.value)} />
            </Stack>
          )}
          {(type === 'personal' || type === 'work_injury') && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField size="small" fullWidth label="护理月数" type="number" value={careMonths} onChange={(e) => setCareMonths(e.target.value)} />
              <TextField size="small" fullWidth label="伤残等级（1-10 级）" type="number" value={disabilityGrade} onChange={(e) => setDisabilityGrade(e.target.value)} />
              <TextField size="small" fullWidth label="其他费用（元）" type="number" value={otherCost} onChange={(e) => setOtherCost(e.target.value)} />
            </Stack>
          )}
          {(type === 'work_injury' || type === 'work_death') && (
            <TextField size="small" fullWidth label="统筹地区月平均工资（留空用本地演示值）" type="number" value={localAverageWage} onChange={(e) => setLocalAverageWage(e.target.value)} />
          )}
          {type === 'economic' && (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField size="small" fullWidth label="离职前 12 个月平均工资（元）" type="number" value={monthlyWage} onChange={(e) => setMonthlyWage(e.target.value)} />
                <TextField size="small" fullWidth label="工作年限（年）" type="number" value={yearsWorked} onChange={(e) => setYearsWorked(e.target.value)} />
                <FormControl fullWidth size="small">
                  <InputLabel>补偿模式</InputLabel>
                  <Select value={compensationMode} label="补偿模式" onChange={(e) => setCompensationMode(e.target.value as typeof compensationMode)}>
                    <MenuItem value="N">N（经济补偿）</MenuItem>
                    <MenuItem value="N1">N+1（代通知金）</MenuItem>
                    <MenuItem value="2N">2N（违法解除赔偿金）</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <FormControlLabel
                control={<Checkbox size="small" checked={applyTripleCap} onChange={(e) => setApplyTripleCap(e.target.checked)} />}
                label={<Typography variant="body2">适用三倍封顶（月工资高于当地平均工资 3 倍，年限最多 12 年）</Typography>}
              />
            </>
          )}
        </Stack>
      </Panel>

      {!result && <Panel title="测算结果"><ResultPlaceholder text="填写条件后点击「开始测算」。" /></Panel>}

      {result && (
        <>
          <Panel title="赔偿项目汇总" subtitle={`适用标准：${result.region}`}>
            <FieldGrid columns={3}>
              <Field label="赔偿项目数">{result.items.length} 项</Field>
              <Field label="测算合计"><Money value={result.total} /></Field>
              <Field label="测算类型">{TYPES.find((t) => t.code === result.type)?.label ?? result.type}</Field>
            </FieldGrid>
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>赔偿项目</TableCell>
                  <TableCell>计算依据</TableCell>
                  <TableCell align="right">金额（元）</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{item.basis}</Typography></TableCell>
                    <TableCell align="right">{item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              {result.disclaimer}
            </Typography>
          </Panel>

          <Stack direction="row" spacing={1}>
            <SaveToMatterButton
              matterId={matterId}
              toolCode="tool_compensation"
              toolName="赔偿测算器"
              title={`${TYPES.find((t) => t.code === result.type)?.label ?? '赔偿'}测算`}
              input={buildInput()}
              result={{ ...result }}
              summary={`${result.items.length} 项赔偿，测算合计 ${result.total} 元`}
            />
          </Stack>
        </>
      )}
    </>
  );
}

import { useState } from 'react';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/common/ToastProvider';
import { useMatters, useToolDeadline, useToolboxMeta } from '@/hooks/useCrm';
import type { DeadlineToolInput, DeadlineToolResult } from '@/types';
import { DeadlineChainPanel } from './DeadlineChainPanel';
import {
  MatterPicker,
  Panel,
  ResultPlaceholder,
  SaveToMatterButton,
  ToolboxBanner,
} from './LegalToolboxShared';

const today = new Date().toISOString().slice(0, 10);

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weekday(iso: string) {
  const d = new Date(iso);
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()] ?? '';
}

export function DeadlinePage() {
  const { data: matters } = useMatters();
  const { data: meta } = useToolboxMeta();
  const calc = useToolDeadline();
  const [tab, setTab] = useState(0);
  const [matterId, setMatterId] = useState('');
  const [type, setType] = useState<DeadlineToolInput['type']>('appeal');
  const [triggerDate, setTriggerDate] = useState(today);
  const [days, setDays] = useState('15');
  const [label, setLabel] = useState('');
  const [businessDaysOnly, setBusinessDaysOnly] = useState(true);
  const [result, setResult] = useState<DeadlineToolResult | null>(null);
  const toast = useToast();

  const presets = meta?.deadlinePresets ?? {};
  const input: DeadlineToolInput = {
    type,
    triggerDate,
    days: type === 'custom' ? Number(days) || undefined : undefined,
    label: label.trim() || undefined,
    businessDaysOnly,
  };

  const submit = () => {
    calc.mutate(input, {
      onSuccess: (data) => {
        if (data.error) {
          setResult(null);
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
        title="诉讼期限推算器"
        subtitle="快速推算上诉期、举证期、答辩期与申请执行期；或按法院规则维护完整期限链、节假日并重算生成日程。"
        actions={tab === 0 ? (
          <Button variant="contained" startIcon={<EventAvailableOutlined />} onClick={submit} disabled={calc.isPending}>
            {calc.isPending ? '推算中…' : '推算截止日'}
          </Button>
        ) : null}
      />
      <Tabs
        value={tab}
        onChange={(_, next: number) => setTab(next)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="快速推算" />
        <Tab label="期限链管理（法院规则 / 节假日）" />
      </Tabs>

      {tab === 0 && (
        <>
          <ToolboxBanner meta={result ?? undefined} />

          <Panel title="推算条件" subtitle="触发日通常为判决/裁定送达日、立案日或法律文书生效日。">
            <Stack spacing={2}>
              <MatterPicker matterId={matterId} setMatterId={setMatterId} matters={matters} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>期限类型</InputLabel>
                  <Select value={type} label="期限类型" onChange={(e) => setType(e.target.value as DeadlineToolInput['type'])}>
                    {Object.entries(presets).map(([code, preset]) => (
                      <MenuItem key={code} value={code}>{preset.label}（{preset.days} 日）</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField size="small" fullWidth type="date" label="触发日" InputLabelProps={{ shrink: true }} value={triggerDate} onChange={(e) => setTriggerDate(e.target.value)} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {type === 'custom' && (
                  <TextField size="small" fullWidth label="自定义天数" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
                )}
                <TextField size="small" fullWidth label="自定义名称（可选）" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="留空则使用预设名称" />
              </Stack>
              <FormControlLabel
                control={<Checkbox size="small" checked={businessDaysOnly} onChange={(e) => setBusinessDaysOnly(e.target.checked)} />}
                label={<Typography variant="body2">末日为周末或法定节假日时顺延至下一工作日（民事诉讼期间通用规则）</Typography>}
              />
              {type !== 'custom' && presets[type] && (
                <Typography variant="caption" color="text.secondary">
                  法律依据（本地标注）：{presets[type].basis}。请核对最新法律文本与法院通知。
                </Typography>
              )}
            </Stack>
          </Panel>

          {!result && <Panel title="推算结果"><ResultPlaceholder text="选择期限类型与触发日后点击「推算截止日」。" /></Panel>}

          {result && (
            <>
              <Panel
                title="期限推算结果"
                subtitle={`${result.label} · ${result.basis} · 已加载 ${result.holidayCount} 条法院节假日`}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>期限项目</TableCell>
                      <TableCell>法定天数</TableCell>
                      <TableCell>原始到期日</TableCell>
                      <TableCell>顺延后截止日</TableCell>
                      <TableCell align="right">状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.items.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell>{item.offsetDays} 日</TableCell>
                        <TableCell>{formatDate(item.rawDate)} {weekday(item.rawDate)}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatDate(item.dueDate)} {weekday(item.dueDate)}</TableCell>
                        <TableCell align="right">
                          {item.holidayAdjusted ? '节假日顺延' : item.adjusted ? '周末顺延' : '未顺延'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  截止日按当天 23:59 计；法定期间不包括在途时间，届满前邮寄的诉讼文书按相关规定处理。
                </Typography>
              </Panel>

              <Box sx={{ mt: 2 }}>
                <SaveToMatterButton
                  matterId={matterId}
                  toolCode="tool_deadline"
                  toolName="诉讼期限推算器"
                  title={`${result.label} · 截止 ${result.items[0] ? formatDate(result.items[0].dueDate) : '—'}`}
                  input={input as unknown as Record<string, unknown>}
                  result={{ ...result }}
                  summary={`${result.label} ${result.days} 日，截止 ${result.items[0] ? formatDate(result.items[0].dueDate) : '—'}`}
                />
              </Box>
            </>
          )}

          <Panel title="节假日维护" subtitle="节假日台账现由本页「期限链管理」页签维护，推算时自动跳过周末与这些日期。">
            <Box>
              <Typography variant="body2" color="text.secondary">
                可在「期限链管理」页签的「节假日管理」中新增或删除法院假期，并维护法院规则、生成与重算期限链。
              </Typography>
            </Box>
          </Panel>
        </>
      )}

      {tab === 1 && <DeadlineChainPanel />}
    </>
  );
}

import { useState } from 'react';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/common/PageHeader';
import {
  useAdminAssistant,
  useCreateCalendarEvent,
  useCreateNote,
  useDocuments,
  useExtractDates,
  useMatters,
  useUpdateDraft,
} from '@/hooks/useCrm';
import { useToast } from '@/components/common/ToastProvider';
import type { AdminAssistantResult, CalendarDraftEvent } from '@/types';
import { LocalRulesBanner, Panel, ResultPlaceholder } from './LegalAiShared';

export function AdminAssistantPage() {
  const toast = useToast();
  const { data: matters } = useMatters();
  const { data: documents } = useDocuments();
  const assistant = useAdminAssistant();
  const extract = useExtractDates();
  const updateDraft = useUpdateDraft();
  const createEvent = useCreateCalendarEvent();
  const saveNote = useCreateNote();
  const [matterId, setMatterId] = useState('');
  const [periodDays, setPeriodDays] = useState(7);
  const [result, setResult] = useState<AdminAssistantResult | null>(null);
  const [ownerId, setOwnerId] = useState('');
  const [weeklyReport, setWeeklyReport] = useState('');
  const [selectedReminders, setSelectedReminders] = useState<number[]>([]);
  const [documentId, setDocumentId] = useState('');
  const [drafts, setDrafts] = useState<CalendarDraftEvent[]>([]);

  const generate = () => {
    assistant.mutate(
      { matterId: matterId ? Number(matterId) : undefined, periodDays },
      {
        onSuccess: (data) => {
          setResult(data);
          setWeeklyReport(data.weeklyReport);
          setOwnerId(data.ownerOptions[0] ? String(data.ownerOptions[0].id) : '');
          setSelectedReminders([]);
          toast.success(`已生成近 ${data.periodDays} 天客户周报，并识别 ${data.reminders.length} 项到期提醒`);
        },
      },
    );
  };

  const saveReport = () => {
    if (!result || !weeklyReport.trim()) return;
    if (!matterId) {
      toast.warning('请先选择案件，再将周报草稿保存为该案件的内部备注');
      return;
    }
    const selected = matters?.find((m) => m.id === Number(matterId));
    const owner = result.ownerOptions.find((o) => o.id === Number(ownerId));
    saveNote.mutate(
      {
        title: `客户案件周报草稿 · 近 ${result.periodDays} 天 · 汇报人：${owner?.name ?? '待指定'}（${new Date().toISOString().slice(0, 10)}）`,
        content: `${weeklyReport.trim()}\n\n汇报人：${owner?.name ?? '待指定'}`,
        targetType: 'matter',
        targetId: Number(matterId),
      },
      {
        onSuccess: () =>
          toast.success(`周报草稿已保存为「${selected?.title ?? '案件'}」的内部备注，仅案件团队可见，不会对外发送`),
      },
    );
  };

  const extractFromDocument = () => {
    const doc = documents?.find((d) => d.id === Number(documentId));
    if (!doc) {
      toast.warning('请选择要识别到期日的文书');
      return;
    }
    extract.mutate(
      {
        documentId: doc.id,
        sourceName: doc.title,
        matterId: matterId ? Number(matterId) : doc.matterId ?? null,
      },
      {
        onSuccess: (items) => {
          setDrafts(items);
          toast.success(items.length ? `从文书识别到 ${items.length} 个候选日期，请人工确认` : '未识别到日期');
        },
      },
    );
  };

  const confirmDraft = (draft: CalendarDraftEvent) => {
    updateDraft.mutate(
      {
        id: draft.id,
        data: {
          status: 'confirmed',
          title: draft.title,
          dueDate: draft.extractedDate,
        },
      },
      {
        onSuccess: () => {
          setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, status: 'confirmed' } : d)));
          toast.success('已确认并加入日历提醒');
        },
      },
    );
  };

  const confirmReminders = () => {
    if (!result) return;
    let count = 0;
    selectedReminders.forEach((idx) => {
      const reminder = result.reminders[idx];
      createEvent.mutate({
        title: reminder.label,
        type: (reminder.type === 'hearing' ? 'hearing' : 'reminder') as 'hearing' | 'reminder',
        dueDate: new Date(`${reminder.date}T09:00:00`).toISOString(),
        priority: 'high',
        matterId: matterId ? Number(matterId) : null,
        sourceType: 'ai-reminder',
        sourceDetail: `${reminder.source} · 本地规则识别，人工确认后添加`,
      });
      count += 1;
    });
    toast.success(`已添加 ${count} 项日历提醒`);
    setSelectedReminders([]);
  };

  return (
    <>
      <PageHeader
        title="行政事务 AI 助手"
        subtitle="将繁杂的办案日志润色为通俗的《客户案件周报》，并从文书内容识别到期日、建议添加日历提醒。"
        actions={
          <Button variant="contained" startIcon={<AutoAwesomeOutlined />} onClick={generate} disabled={assistant.isPending}>
            {assistant.isPending ? '生成中…' : '生成客户周报'}
          </Button>
        }
      />
      <LocalRulesBanner meta={result ?? undefined} />

      <Panel title="生成条件" subtitle="周报按所选周期汇总真实工时、已办任务与对外沟通记录。">
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel>案件（可选）</InputLabel>
            <Select value={matterId} label="案件（可选）" onChange={(e) => setMatterId(String(e.target.value))}>
              <MenuItem value="">— 全部案件 —</MenuItem>
              {(matters ?? []).map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.caseNumber ? `${m.caseNumber} · ` : ''}{m.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>统计周期</InputLabel>
            <Select value={periodDays} label="统计周期" onChange={(e) => setPeriodDays(Number(e.target.value))}>
              {[7, 14, 30].map((d) => <MenuItem key={d} value={d}>近 {d} 天</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Panel>

      {!result && <Panel title="客户案件周报"><ResultPlaceholder text="设置统计周期后点击「生成客户周报」，并可继续识别文书到期日。" /></Panel>}

      {result && (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>{result.privacyNote}</Alert>
          <Panel
            title="客户案件周报（可编辑，发送前需人工确认）"
            subtitle={`数据来源：工时 ${result.sourceCounts.timeEntries} 条 · 已办任务 ${result.sourceCounts.completedTasks} 项 · 对外沟通 ${result.sourceCounts.outbound} 条`}
            action={
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>汇报负责人</InputLabel>
                  <Select value={ownerId} label="汇报负责人" onChange={(e) => setOwnerId(String(e.target.value))}>
                    {result.ownerOptions.map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SaveOutlined />}
                  onClick={saveReport}
                  disabled={saveNote.isPending}
                >
                  {saveNote.isPending ? '保存中…' : '保存周报草稿'}
                </Button>
              </Stack>
            }
          >
            <TextField
              fullWidth
              multiline
              minRows={14}
              value={weeklyReport}
              onChange={(e) => setWeeklyReport(e.target.value)}
              inputProps={{ style: { fontFamily: 'inherit', lineHeight: 1.9 } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              周报为草稿，系统不会自动发送；可保存为所选案件的内部备注（仅案件团队可见），核对后通过沟通中心人工发送。
            </Typography>
          </Panel>

          <Panel
            title="到期日识别与日历提醒建议"
            subtitle={result.reminderNote}
            action={
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckOutlined />}
                onClick={confirmReminders}
                disabled={!selectedReminders.length}
              >
                添加所选 {selectedReminders.length || ''} 项提醒
              </Button>
            }
          >
            {result.reminders.length === 0 ? (
              <Typography variant="body2" color="text.secondary">未来 45 天内未发现到期节点。</Typography>
            ) : (
              <Stack spacing={1}>
                {result.reminders.map((r, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Checkbox
                      size="small"
                      checked={selectedReminders.includes(i)}
                      onChange={(e) =>
                        setSelectedReminders((prev) =>
                          e.target.checked ? [...prev, i] : prev.filter((x) => x !== i),
                        )
                      }
                    />
                    <Chip size="small" label={r.date} />
                    <Typography variant="body2" sx={{ flex: 1 }}>{r.label}</Typography>
                    <Chip size="small" variant="outlined" label={r.source} />
                  </Box>
                ))}
              </Stack>
            )}
          </Panel>
        </>
      )}

      <Panel title="从文书内容识别到期日" subtitle="选择文档后按本地规则提取日期，生成草稿提醒；需逐条人工确认后加入日历。">
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>选择文书</InputLabel>
              <Select value={documentId} label="选择文书" onChange={(e) => setDocumentId(String(e.target.value))}>
                <MenuItem value="">— 请选择 —</MenuItem>
                {(documents ?? []).map((d) => <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>)}
              </Select>
            </FormControl>
            <Button size="small" variant="outlined" startIcon={<DescriptionOutlined />} onClick={extractFromDocument} disabled={extract.isPending}>
              识别到期日
            </Button>
          </Stack>
          {drafts.length > 0 && (
            <Stack spacing={1}>
              {drafts.map((d) => (
                <Box key={d.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip size="small" label={d.extractedDate} />
                  <Typography variant="body2" sx={{ flex: 1, minWidth: 180 }}>
                    {d.title} · {d.sourceSnippet}
                  </Typography>
                  <Chip size="small" variant="outlined" label={d.status === 'confirmed' ? '已确认' : '待确认'} color={d.status === 'confirmed' ? 'success' : 'warning'} />
                  {d.status !== 'confirmed' && (
                    <Button size="small" startIcon={<CalendarMonthOutlined />} onClick={() => confirmDraft(d)} disabled={updateDraft.isPending}>
                      确认添加
                    </Button>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Panel>
    </>
  );
}

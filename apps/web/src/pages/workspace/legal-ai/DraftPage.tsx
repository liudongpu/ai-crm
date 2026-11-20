import { useState } from 'react';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/common/PageHeader';
import { useCreateWorkspaceItem, useDraftDocument, useMatters } from '@/hooks/useCrm';
import { useToast } from '@/components/common/ToastProvider';
import type { DraftResult, DraftSection } from '@/types';
import { CitationCards, LEGAL_AI_COLOR, LocalRulesBanner, Panel, ResultPlaceholder } from './LegalAiShared';

const DOC_TYPES: Array<{ value: NonNullable<DraftResult['docType']>; label: string }> = [
  { value: 'complaint', label: '起诉状' },
  { value: 'letter', label: '律师函' },
  { value: 'answer', label: '答辩状' },
  { value: 'opinion', label: '法律意见书' },
];

export function DraftPage() {
  const toast = useToast();
  const { data: matters } = useMatters();
  const draft = useDraftDocument();
  const save = useCreateWorkspaceItem();
  const [matterId, setMatterId] = useState('');
  const [docType, setDocType] = useState<DraftResult['docType']>('complaint');
  const [stance, setStance] = useState('');
  const [result, setResult] = useState<DraftResult | null>(null);
  const [genError, setGenError] = useState('');
  const [sections, setSections] = useState<DraftSection[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);

  const submit = () => {
    if (!matterId) {
      toast.warning('请先选择案件');
      return;
    }
    setGenError('');
    draft.mutate(
      { matterId: Number(matterId), docType: docType as NonNullable<DraftResult['docType']>, stance: stance.trim() || undefined },
      {
        onSuccess: (data) => {
          if (data.error) {
            setResult(null);
            setGenError(data.error);
            toast.error(data.error);
            return;
          }
          setResult(data);
          setSections(data.sections.map((s) => ({ ...s })));
          setChecked(data.reviewChecklist.map(() => false));
          toast.success('初稿已生成，请逐项核对并人工修改');
        },
      },
    );
  };

  const fullText = sections.map((s) => `${s.heading}\n${s.content}`).join('\n\n');
  const allChecked = checked.length > 0 && checked.every(Boolean);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      toast.success('已复制全文，发送前请再次人工确认');
    } catch {
      toast.error('复制失败，请手动选择文本复制');
    }
  };

  const saveDraft = () => {
    if (!result || !allChecked) return;
    save.mutate(
      {
        featureCode: 'work_drafting',
        title: result.title,
        summary: `本地规则初稿，来源文档 ${result.sourceCounts.documents} 份 / 备注 ${result.sourceCounts.notes} 条，已人工核对`,
        status: '草稿',
        data: {
          name: result.title,
          type: DOC_TYPES.find((d) => d.value === result.docType)?.label ?? '法律文书',
          version: 'v0.1（本地规则初稿）',
          note: `人工核对项已全部确认；参考范本：${result.references.map((r) => r.title).join('、')}`,
          content: fullText,
        },
      },
      { onSuccess: () => toast.success('草稿已保存到「文书起草」台账') },
    );
  };

  return (
    <>
      <PageHeader
        title="智能文书起草与审查"
        subtitle="结合当前案件事实与本所历史优秀范本，一键生成起诉状、律师函、答辩状或法律意见书初稿。"
        actions={
          <Button variant="contained" startIcon={<AutoAwesomeOutlined />} onClick={submit} disabled={draft.isPending}>
            {draft.isPending ? '生成中…' : '一键生成初稿'}
          </Button>
        }
      />
      <LocalRulesBanner meta={result ?? undefined} />

      <Panel title="起草条件" subtitle="文书内容来自所选案件的真实材料；生成结果仅为初稿，不得直接对外发送。">
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>案件</InputLabel>
            <Select value={matterId} label="案件" onChange={(e) => setMatterId(String(e.target.value))}>
              {(matters ?? []).map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.caseNumber ? `${m.caseNumber} · ` : ''}{m.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>文书类型</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {DOC_TYPES.map((d) => (
                <Chip
                  key={d.value}
                  label={d.label}
                  clickable
                  color={docType === d.value ? 'primary' : 'default'}
                  variant={docType === d.value ? 'filled' : 'outlined'}
                  onClick={() => setDocType(d.value)}
                />
              ))}
            </Stack>
          </Box>
          <TextField
            size="small"
            fullWidth
            label="我方立场 / 特别要求（可选）"
            value={stance}
            onChange={(e) => setStance(e.target.value)}
            placeholder="例如：原告代理人、语气强硬、强调时效中断"
          />
        </Stack>
      </Panel>

      {genError && <Alert severity="error" sx={{ mb: 2 }}>{genError}</Alert>}

      {!result && <Panel title="文书初稿"><ResultPlaceholder text="选择案件与文书类型后点击「一键生成初稿」。" /></Panel>}

      {result && !result.error && (
        <>
          <Panel
            title="初稿预览（可直接编辑修改）"
            subtitle={`参考范本：${result.references.map((r) => `${r.title} ${r.version}`).join('、')}`}
            action={<Chip size="small" variant="outlined" label={`来源：文档 ${result.sourceCounts.documents} · 备注 ${result.sourceCounts.notes} · 当事人 ${result.sourceCounts.parties}`} />}
          >
            <Paper variant="outlined" sx={{ p: 3, bgcolor: '#fffdf8' }}>
              <Typography variant="h6" align="center" sx={{ mb: 3, letterSpacing: 2 }}>
                {result.title}
              </Typography>
              <Stack spacing={2}>
                {sections.map((section, i) => (
                  <Box key={i}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: LEGAL_AI_COLOR, mb: 0.5 }}>
                      {section.heading}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={Math.max(2, section.content.split('\n').length)}
                      value={section.content}
                      onChange={(e) =>
                        setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, content: e.target.value } : s)))
                      }
                      inputProps={{ style: { fontFamily: 'inherit', lineHeight: 1.9 } }}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Panel>

          <Panel title="引用法条（附原文与有效状态）" subtitle="初稿中的法律引用均来自本地校验库，需再次核对官方文本。">
            <CitationCards citations={result.citations} />
          </Panel>

          <Panel title="人工确认清单" subtitle="全部确认后才可保存或复制草稿；本系统不会自动发送文书。">
            <Stack spacing={0.5}>
              {result.reviewChecklist.map((item, i) => (
                <FormControlLabel
                  key={i}
                  control={
                    <Checkbox
                      size="small"
                      checked={checked[i] ?? false}
                      onChange={(e) => setChecked((prev) => prev.map((v, idx) => (idx === i ? e.target.checked : v)))}
                    />
                  }
                  label={<Typography variant="body2">{item}</Typography>}
                />
              ))}
            </Stack>
            {!allChecked && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                请先勾选全部核对项，确认内容与法条引用无误。
              </Alert>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button size="small" variant="outlined" startIcon={<ContentCopyOutlined />} onClick={copyText} disabled={!allChecked}>
                复制全文
              </Button>
              <Button size="small" variant="contained" startIcon={<SaveOutlined />} onClick={saveDraft} disabled={!allChecked || save.isPending}>
                保存草稿到台账
              </Button>
            </Stack>
          </Panel>
        </>
      )}
    </>
  );
}

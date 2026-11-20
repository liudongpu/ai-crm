import { useState } from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/common/PageHeader';
import { useCreateWorkspaceItem, useLegalResearch, useMatters } from '@/hooks/useCrm';
import { useToast } from '@/components/common/ToastProvider';
import type { ResearchResult } from '@/types';
import { CitationCards, LEGAL_AI_COLOR, LocalRulesBanner, Panel, ResultPlaceholder } from './LegalAiShared';

const QUICK_QUESTIONS = [
  '诉讼时效是多久，什么时候中断？',
  '买卖合同逾期付款的违约责任如何主张？',
  '格式条款中的责任限制是否有效？',
  '竞业限制补偿金未支付有什么后果？',
  '当事人对自己主张的举证责任如何分配？',
];

export function LegalResearchPage() {
  const toast = useToast();
  const { data: matters } = useMatters();
  const research = useLegalResearch();
  const save = useCreateWorkspaceItem();
  const [question, setQuestion] = useState('');
  const [matterId, setMatterId] = useState('');
  const [result, setResult] = useState<ResearchResult | null>(null);

  const submit = (q?: string) => {
    const query = (q ?? question).trim();
    if (!query) {
      toast.warning('请输入自然语言问题');
      return;
    }
    setQuestion(query);
    research.mutate(
      { question: query, matterId: matterId ? Number(matterId) : undefined },
      {
        onSuccess: (data) => {
          setResult(data);
          toast.success(data.validCitations.length ? `检索到 ${data.validCitations.length} 条现行有效条文` : '未检索到可核验条文');
        },
      },
    );
  };

  const saveRecord = () => {
    if (!result) return;
    const full = [
      `【检索结论】\n${result.conclusion}`,
      `【法条原文与有效状态】\n${result.citations.map((c) => `${c.title}${c.article}（${c.status}${c.statusValid ? '，现行有效' : '，已排除'}）\n原文：${c.text}\n施行日期：${c.effectiveFrom || '—'} · 来源：${c.source || '本地校验库'}`).join('\n\n') || '无'}`,
      `【排除的非现行条文】\n${result.invalidCitations.map((c) => `${c.title}${c.article}（${c.status}）`).join('、') || '无'}`,
      `【类案裁判要旨（线索）】\n${result.caseBriefs.map((c) => `${c.title}（${c.court} · ${c.year} · ${c.cause}）\n${c.holding}`).join('\n\n') || '无'}`,
      `【关联案件期限】\n${result.trackedStatutes.map((s) => `${s.dueDate ?? '—'} ${s.title}（${s.status}）`).join('\n') || '无'}`,
    ].join('\n\n');
    save.mutate(
      {
        featureCode: 'work_legal_research',
        title: result.question.slice(0, 40),
        summary: result.conclusion,
        status: '已完成',
        data: {
          topic: result.question.slice(0, 60),
          keywords: question.trim(),
          source: result.citations.map((c) => `${c.title}${c.article}`).join('；') || '本地校验法规库',
          result: full,
        },
      },
      { onSuccess: () => toast.success('检索结果已保存到「法律检索」台账') },
    );
  };

  return (
    <>
      <PageHeader
        title="法规与类案检索助手"
        subtitle="自然语言提问，结论强制附带精确法条原文与有效状态校验；库外内容不生成，杜绝模型幻觉。"
        actions={
          <Button variant="contained" startIcon={<SearchOutlined />} onClick={() => submit()} disabled={research.isPending}>
            {research.isPending ? '检索中…' : '开始检索'}
          </Button>
        }
      />
      <LocalRulesBanner meta={result ?? undefined} />

      <Alert severity="success" sx={{ mb: 2 }}>
        反幻觉机制：结论仅引用本地校验库中的条文原文；条文不存在或状态非「现行有效」时，明确拒绝作为结论依据，不编造法条。
      </Alert>

      <Panel title="提出问题" subtitle="可直接点击常见问题，或用自然语言描述你的法律问题。">
        <Stack spacing={2}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="自然语言问题"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="例如：买卖合同货款逾期的违约责任如何主张？"
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {QUICK_QUESTIONS.map((q) => (
              <Chip key={q} label={q} variant="outlined" clickable onClick={() => submit(q)} />
            ))}
          </Stack>
          <FormControl fullWidth size="small" sx={{ maxWidth: 420 }}>
            <InputLabel>关联案件（可选，用于时效与期限提示）</InputLabel>
            <Select value={matterId} label="关联案件（可选，用于时效与期限提示）" onChange={(e) => setMatterId(String(e.target.value))}>
              <MenuItem value="">— 不关联 —</MenuItem>
              {(matters ?? []).map((m) => (
                <MenuItem key={m.id} value={m.id}>{m.caseNumber ? `${m.caseNumber} · ` : ''}{m.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Panel>

      {!result && <Panel title="检索结论"><ResultPlaceholder text="输入法律问题后点击「开始检索」，结论将附带法条原文与有效状态。" /></Panel>}

      {result && (
        <>
          <Panel
            title="检索结论"
            subtitle={`检索来源：${result.source}`}
            action={<Button size="small" variant="outlined" startIcon={<SaveOutlined />} onClick={saveRecord}>保存结果</Button>}
          >
            <Typography variant="body2" sx={{ lineHeight: 2, whiteSpace: 'pre-wrap' }}>
              {result.conclusion}
            </Typography>
            {result.invalidCitations.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                以下条文状态非现行有效，已排除在结论依据之外：
                {result.invalidCitations.map((c) => `${c.title}${c.article}（${c.status}）`).join('、')}
              </Alert>
            )}
          </Panel>

          <Panel title="法条原文与有效状态校验" subtitle="每条引用均标注原文、施行日期、状态与权威来源。">
            <CitationCards citations={result.citations} />
          </Panel>

          <Panel title="类案裁判要旨（线索）" subtitle="本地演示类案库，仅作检索线索，非裁判文书原文。">
            {result.caseBriefs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">未匹配到类案要旨。</Typography>
            ) : (
              <Stack spacing={1.5}>
                {result.caseBriefs.map((c) => (
                  <Box key={c.id} sx={{ borderLeft: `3px solid ${LEGAL_AI_COLOR}`, pl: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.court} · {c.year} · {c.cause}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{c.holding}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Panel>

          {result.trackedStatutes.length > 0 && (
            <Panel title="关联案件的时效/期限跟踪" subtitle="来自案件中心的真实期限记录。">
              <Stack spacing={1}>
                {result.trackedStatutes.map((s) => (
                  <Box key={s.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip size="small" label={s.dueDate ?? '—'} />
                    <Typography variant="body2">{s.title}</Typography>
                    <Chip size="small" variant="outlined" label={s.status} />
                  </Box>
                ))}
              </Stack>
            </Panel>
          )}
        </>
      )}
    </>
  );
}

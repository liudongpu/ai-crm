import { useState } from 'react';
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import GavelOutlined from '@mui/icons-material/GavelOutlined';
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
import { useContractReview, useCreateWorkspaceItem, useDocuments } from '@/hooks/useCrm';
import { useToast } from '@/components/common/ToastProvider';
import type { ContractReviewResult } from '@/types';
import { CitationCards, LEGAL_AI_COLOR, LocalRulesBanner, Panel, ResultPlaceholder } from './LegalAiShared';

const LEVEL_COLOR: Record<string, 'error' | 'warning' | 'info'> = { 高: 'error', 中: 'warning', 低: 'info' };
const STANCE_LABELS: Array<{ value: 'buyer' | 'seller' | 'neutral'; label: string }> = [
  { value: 'buyer', label: '买方' },
  { value: 'seller', label: '卖方' },
  { value: 'neutral', label: '中立' },
];

export function ContractReviewPage() {
  const toast = useToast();
  const { data: documents } = useDocuments();
  const review = useContractReview();
  const save = useCreateWorkspaceItem();
  const [documentId, setDocumentId] = useState('');
  const [text, setText] = useState('');
  const [stance, setStance] = useState<'buyer' | 'seller' | 'neutral'>('buyer');
  const [toughness, setToughness] = useState<'standard' | 'strong'>('standard');
  const [sourceText, setSourceText] = useState('');
  const [result, setResult] = useState<ContractReviewResult | null>(null);
  const [accepted, setAccepted] = useState<Record<number, string>>({});
  const [inserted, setInserted] = useState<number[]>([]);
  const [revised, setRevised] = useState('');

  const contractDocs = (documents ?? []).filter((d) => d.category === 'contract');

  const submit = () => {
    const selected = documents?.find((d) => d.id === Number(documentId));
    const body = selected?.content || selected?.description || text.trim();
    if (!documentId && !body) {
      toast.warning('请选择合同文档或粘贴合同条款文本');
      return;
    }
    setSourceText(body);
    review.mutate(
      { documentId: documentId ? Number(documentId) : undefined, text: documentId ? undefined : body, stance, toughness },
      {
        onSuccess: (data) => {
          setResult(data);
          setAccepted({});
          setInserted([]);
          setRevised('');
          toast.success(`审查完成：风险条款 ${data.risks.length} 项，缺失条款 ${data.missing.length} 项`);
        },
      },
    );
  };

  const accept = (index: number) => {
    if (!result) return;
    setAccepted((prev) => ({ ...prev, [index]: result.risks[index].replacement }));
    toast.success('已采用修订建议，可在下方修订稿中继续编辑');
  };

  const toggleInsert = (index: number) => {
    setInserted((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  const buildRevised = () => {
    if (!result) return;
    let out = sourceText;
    Object.entries(accepted).forEach(([key, replacement]) => {
      const original = result.risks[Number(key)]?.clause;
      if (original) out = out.split(original).join(replacement);
    });
    inserted.forEach((i) => {
      out = `${out}\n${result.missing[i].suggestion}`;
    });
    setRevised(out);
    toast.success('修订稿已生成，请人工比对原文后使用');
  };

  const saveRecord = () => {
    if (!result) return;
    save.mutate(
      {
        featureCode: 'work_doc_review',
        title: `${result.documentTitle} · 风控审查`,
        summary: result.summary,
        status: '已完成',
        data: {
          document: result.documentTitle,
          focus: `${result.stanceLabel} / ${result.toughness === 'strong' ? '强硬' : '标准'}立场，共 ${result.clauseCount} 条`,
          risk: `高风险 ${result.risks.filter((r) => r.level === '高').length} 项；${result.risks.map((r) => r.label).join('、') || '无'}`,
          reviewer: '本地规则生成（需承办律师复核）',
          revision: revised,
        },
      },
      { onSuccess: () => toast.success('审查记录已保存到「文档审阅」台账') },
    );
  };

  return (
    <>
      <PageHeader
        title="合同智能风控审查"
        subtitle="设定我方立场与谈判强度，自动标出风险条款、缺失条款，并给出可一键替换的修订建议。"
        actions={
          <Button variant="contained" startIcon={<GavelOutlined />} onClick={submit} disabled={review.isPending}>
            {review.isPending ? '审查中…' : '开始风控审查'}
          </Button>
        }
      />
      <LocalRulesBanner meta={result ?? undefined} />

      <Panel title="审查条件" subtitle="可选用文档库中的合同，或直接粘贴合同文本；未选文档时使用内置演示合同。">
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>合同文档</InputLabel>
            <Select value={documentId} label="合同文档" onChange={(e) => setDocumentId(String(e.target.value))}>
              <MenuItem value="">— 不使用文档，使用下方文本 —</MenuItem>
              {contractDocs.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="合同文本（粘贴条款）"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={Boolean(documentId)}
            placeholder="例如：第七条 责任限制：卖方对任何间接损失不承担任何责任…"
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>我方立场</InputLabel>
              <Select value={stance} label="我方立场" onChange={(e) => setStance(e.target.value as typeof stance)}>
                {STANCE_LABELS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>谈判强度</InputLabel>
              <Select value={toughness} label="谈判强度" onChange={(e) => setToughness(e.target.value as typeof toughness)}>
                <MenuItem value="standard">标准</MenuItem>
                <MenuItem value="strong">强硬</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Panel>

      {!result && <Panel title="审查结果"><ResultPlaceholder text="选择合同并设置我方立场后，点击「开始风控审查」。" /></Panel>}

      {result && (
        <>
          <Alert severity={result.risks.some((r) => r.level === '高') ? 'warning' : 'success'} sx={{ mb: 2 }}>
            {result.summary}
          </Alert>

          <Panel title="风险条款（按风险等级排序）" subtitle="每条均给出原文、审查意见、可一键替换文本与法条依据。">
            {result.risks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">未命中风险规则，仍需人工通读全文。</Typography>
            ) : (
              <Stack spacing={1.5}>
                {result.risks.map((risk, i) => (
                  <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip size="small" color={LEVEL_COLOR[risk.level]} label={`${risk.level}风险`} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{risk.label}</Typography>
                      <Chip size="small" variant="outlined" label={risk.category} />
                      {accepted[i] && <Chip size="small" color="success" variant="outlined" icon={<CheckCircleOutlineOutlined />} label="已采用修订" />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      原文：{risk.clause}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>{risk.advice}</Typography>
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" color={LEGAL_AI_COLOR} sx={{ fontWeight: 700 }}>建议替换文本</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{risk.replacement}</Typography>
                    </Box>
                    <Box sx={{ mt: 1.5 }}><CitationCards citations={[risk.statute]} /></Box>
                    <Button size="small" variant={accepted[i] ? 'outlined' : 'contained'} sx={{ mt: 1.5 }} onClick={() => accept(i)}>
                      {accepted[i] ? '重新采用修订建议' : '一键替换'}
                    </Button>
                  </Box>
                ))}
              </Stack>
            )}
          </Panel>

          <Panel title="缺失条款" subtitle="按标准合同要素检查，勾选后可插入修订稿。">
            {result.missing.length === 0 ? (
              <Typography variant="body2" color="text.secondary">未发现常见缺失条款。</Typography>
            ) : (
              <Stack spacing={1}>
                {result.missing.map((m, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Button size="small" variant={inserted.includes(i) ? 'contained' : 'outlined'} onClick={() => toggleInsert(i)}>
                      {inserted.includes(i) ? '已选插入' : '插入建议'}
                    </Button>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{m.label}</Typography>
                      <Typography variant="body2" color="text.secondary">{m.suggestion}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Panel>

          <Panel
            title="修订稿（人工确认）"
            subtitle="汇总已采用的替换条款与插入条款；所有变更必须由承办律师比对原文后确认。"
            action={
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={buildRevised}>生成修订稿</Button>
                <Button size="small" variant="contained" startIcon={<SaveOutlined />} onClick={saveRecord}>保存审查记录</Button>
              </Stack>
            }
          >
            <TextField
              fullWidth
              multiline
              minRows={8}
              label="修订稿文本（可人工编辑）"
              value={revised}
              onChange={(e) => setRevised(e.target.value)}
              placeholder="点击「生成修订稿」汇总已采用的修订建议"
              inputProps={{ style: { fontFamily: 'inherit', lineHeight: 1.9 } }}
            />
          </Panel>
        </>
      )}
    </>
  );
}

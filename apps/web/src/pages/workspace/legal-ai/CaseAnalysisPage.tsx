import { useRef, useState } from 'react';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import FolderOpenOutlined from '@mui/icons-material/FolderOpenOutlined';
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
import { useCaseAnalysis, useCreateWorkspaceItem, useMatters } from '@/hooks/useCrm';
import { useToast } from '@/components/common/ToastProvider';
import type { CaseAnalysisResult } from '@/types';
import { LEGAL_AI_COLOR, LocalRulesBanner, Panel, ResultPlaceholder } from './LegalAiShared';

const TIMELINE_COLOR: Record<string, string> = {
  hearing: '#b4443c',
  deadline: '#b8860b',
  filing: '#2c6b8f',
  task: '#2f7a55',
  fact: '#64748b',
};
const TIMELINE_LABEL: Record<string, string> = {
  hearing: '开庭',
  deadline: '期限',
  filing: '立案',
  task: '沟通',
  fact: '事实',
};

/** 轻量当事人关系图谱：SVG 绘制，不引入额外图形库。 */
function RelationGraph({ result }: { result: CaseAnalysisResult }) {
  const { nodes, links } = result.relations;
  const width = 640;
  const height = Math.max(240, 90 + nodes.length * 55);
  const nodeById = new Map(nodes.map((n, i) => [n.id, { ...n, x: 110 + (i % 2) * 420, y: 70 + i * 55 }]));
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <svg width={width} height={height} role="img" aria-label="当事人关系图谱">
        {links.map((link, i) => {
          const a = nodeById.get(link.from);
          const b = nodeById.get(link.to);
          if (!a || !b) return null;
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth={1.5} />
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 6} fontSize="11" fill="#64748b" textAnchor="middle">
                {link.relation}
              </text>
            </g>
          );
        })}
        {Array.from(nodeById.values()).map((n) => (
          <g key={n.id}>
            <rect x={n.x - 95} y={n.y - 20} width={190} height={40} rx={20} fill={n.kind === 'client' ? LEGAL_AI_COLOR : '#1b365d'} />
            <text x={n.x} y={n.y + 4} fontSize="12" fill="#fff" textAnchor="middle">
              {n.label}（{n.role}）
            </text>
          </g>
        ))}
      </svg>
    </Box>
  );
}

export function CaseAnalysisPage() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: matters } = useMatters();
  const analysis = useCaseAnalysis();
  const save = useCreateWorkspaceItem();
  const [matterId, setMatterId] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState<CaseAnalysisResult | null>(null);
  const [genError, setGenError] = useState('');

  const onPickFiles = (files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = String(reader.result ?? '').slice(0, 20000);
        setText((prev) => `${prev}${prev ? '\n\n' : ''}【${file.name}】\n${content}`);
      };
      reader.readAsText(file);
    });
    toast.info(`已本地读取 ${files.length} 份材料（不上传服务器）`);
  };

  const submit = () => {
    if (!matterId) {
      toast.warning('请先选择案件');
      return;
    }
    setGenError('');
    analysis.mutate(
      { matterId: Number(matterId), text: text.trim() || undefined },
      {
        onSuccess: (data) => {
          if (data.error) {
            setResult(null);
            setGenError(data.error);
            toast.error(data.error);
            return;
          }
          setResult(data);
          toast.success(`解析完成：时间线 ${data.timeline.length} 个，争点 ${data.disputes.length} 项`);
        },
      },
    );
  };

  const saveResult = () => {
    if (!result || result.error) return;
    const full = [
      `【初筛摘要】\n${result.summary}`,
      `【时间线】\n${result.timeline.map((t) => `${t.date} ${t.label}（${t.source}）`).join('\n') || '无'}`,
      `【当事人关系】\n${result.relations.nodes.map((n) => `${n.label}（${n.role}）`).join('、') || '无'}`,
      `【核心争点】\n${result.disputes.map((d, i) => `${i + 1}. ${d.label}：${d.support}（依据：${d.basis}）`).join('\n') || '无'}`,
      `【证据缺口】\n${result.gaps.join('、') || '无'}`,
    ].join('\n\n');
    save.mutate(
      {
        featureCode: 'work_case_analysis',
        title: `${result.matterTitle} · 卷宗智能解析`,
        summary: `本地规则解析：时间线 ${result.timeline.length} 个、争点 ${result.disputes.length} 项，证据缺口 ${result.gaps.length} 处（需人工复核）`,
        status: '已完成',
        data: {
          matter: result.matterTitle,
          focus: result.disputes.map((d) => d.label).join('、') || '卷宗要素梳理',
          finding: result.gaps.join('、') || result.summary.slice(0, 200),
          analysis: full,
        },
      },
      { onSuccess: () => toast.success('解析结果已保存到「卷宗智能解析」台账') },
    );
  };

  return (
    <>
      <PageHeader
        title="案情与卷宗智能解析"
        subtitle="批量归集起诉状、证据清单、合同扫描件文本，自动提取时间线、当事人关系与争议焦点，生成案件初筛摘要。"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<SaveOutlined />} onClick={saveResult} disabled={!result || !!result.error || save.isPending}>
              {save.isPending ? '保存中…' : '保存解析结果'}
            </Button>
            <Button variant="contained" startIcon={<AutoAwesomeOutlined />} onClick={submit} disabled={analysis.isPending}>
              {analysis.isPending ? '解析中…' : '开始解析'}
            </Button>
          </Stack>
        }
      />
      <LocalRulesBanner meta={result ?? undefined} />

      <Panel title="选择案件与卷宗材料" subtitle="文档库内容会自动纳入解析；可批量导入本地文本材料作为补充。">
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
          <TextField
            label="补充材料文本（起诉状 / 证据清单 / 合同扫描件识别文本）"
            multiline
            minRows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="可在此粘贴卷宗文本，或点击下方按钮批量导入 .txt / .md 文件"
            fullWidth
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <input ref={fileRef} type="file" multiple accept=".txt,.md,.csv" hidden onChange={(e) => onPickFiles(e.target.files)} />
            <Button size="small" variant="outlined" startIcon={<FolderOpenOutlined />} onClick={() => fileRef.current?.click()}>
              批量导入卷宗文本
            </Button>
            <Typography variant="caption" color="text.secondary">
              文件仅在浏览器本地读取，不上传到服务器
            </Typography>
          </Stack>
        </Stack>
      </Panel>

      {genError && <Alert severity="error" sx={{ mb: 2 }}>{genError}</Alert>}

      {!result && <Panel title="解析结果"><ResultPlaceholder text="选择案件并点击「开始解析」，即可查看时间线、关系图谱与争点分析。" /></Panel>}

      {result && !result.error && (
        <>
          <Panel title="案件初筛摘要" subtitle={`已归集 ${result.evidenceCount} 份材料 · ${result.documents.length} 份文档`}>
            <Typography component="pre" variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.9, m: 0 }}>
              {result.summary}
            </Typography>
            {result.gaps.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                证据缺口：{result.gaps.join('；')}
              </Alert>
            )}
          </Panel>

          <Panel title="案件时间线" subtitle={`按日期排序，共 ${result.timeline.length} 个节点；每条均标注来源材料与原文片段。`}>
            {result.timeline.length === 0 ? (
              <Typography variant="body2" color="text.secondary">未提取到时间节点，请补充含日期的卷宗材料。</Typography>
            ) : (
              <Stack spacing={1}>
                {result.timeline.map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Chip size="small" label={item.date} sx={{ minWidth: 108, fontWeight: 600 }} />
                    <Chip size="small" variant="outlined" label={TIMELINE_LABEL[item.type] ?? item.type} sx={{ color: TIMELINE_COLOR[item.type] ?? '#64748b', borderColor: TIMELINE_COLOR[item.type] ?? '#64748b' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.source} · {item.snippet}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Panel>

          <Panel title="当事人关系图谱" subtitle="节点来自案件当事人与委托客户；连线表示争议相对方或委托代理关系。">
            <RelationGraph result={result} />
          </Panel>

          <Panel title="核心争议焦点" subtitle="每项争点均标注依据与材料来源，未命中的按案由推断并明确标注待补证据。">
            {result.disputes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">暂未识别争点，请补充卷宗材料。</Typography>
            ) : (
              <Stack spacing={1.25}>
                {result.disputes.map((d, i) => (
                  <Box key={i} sx={{ borderLeft: `3px solid ${LEGAL_AI_COLOR}`, pl: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{i + 1}. {d.label}</Typography>
                    <Typography variant="caption" color="text.secondary">依据：{d.basis}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{d.support}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Panel>
        </>
      )}
    </>
  );
}

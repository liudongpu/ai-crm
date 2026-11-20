import { useState } from 'react';
import AddCircleOutlineOutlined from '@mui/icons-material/AddCircleOutlineOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
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
import { Field, FieldGrid } from '@/components/common/Field';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/common/ToastProvider';
import {
  useEvidenceCatalog,
  useMatters,
  useOcrBatch,
  useRedact,
} from '@/hooks/useCrm';
import type { EvidenceCatalogResult, OcrBatchResult, RedactInput, RedactResult } from '@/types';
import {
  MatterPicker,
  Panel,
  ResultPlaceholder,
  SaveToMatterButton,
  ToolboxBanner,
} from './LegalToolboxShared';

const KIND_LABEL: Record<string, string> = {
  idCard: '身份证号',
  bankCard: '银行卡号',
  phone: '手机号',
  email: '邮箱',
};

interface EvidenceItem {
  name: string;
  type: string;
  source: string;
  pages: string;
  note: string;
}

interface OcrFile {
  name: string;
  pages: string;
}

export function EvidencePage() {
  const toast = useToast();
  const { data: matters } = useMatters();
  const redactMutation = useRedact();
  const catalogMutation = useEvidenceCatalog();
  const ocrMutation = useOcrBatch();
  const [matterId, setMatterId] = useState('');
  const [tab, setTab] = useState(0);

  // 脱敏
  const [text, setText] = useState('张三，身份证号 310115199003074512，银行卡 6222021234567890123，手机 13812345678，邮箱 zhangsan@example.com。');
  const [only, setOnly] = useState<'all' | NonNullable<RedactInput['only']>>('all');
  const [redactResult, setRedactResult] = useState<RedactResult | null>(null);

  // 证据目录
  const [caseName, setCaseName] = useState('');
  const [submitter, setSubmitter] = useState('');
  const [items, setItems] = useState<EvidenceItem[]>([
    { name: '买卖合同原件', type: '书证', source: '原告持有', pages: '3', note: '含签章页' },
    { name: '银行转账流水', type: '书证', source: '银行调取', pages: '6', note: '' },
  ]);
  const [catalogResult, setCatalogResult] = useState<EvidenceCatalogResult | null>(null);

  // OCR 登记
  const [files, setFiles] = useState<OcrFile[]>([
    { name: '证据一-合同扫描.pdf', pages: '3' },
    { name: '证据二-交付单.jpg', pages: '1' },
  ]);
  const [ocrResult, setOcrResult] = useState<OcrBatchResult | null>(null);

  const runRedact = () => {
    redactMutation.mutate(
      { text, only: only === 'all' ? undefined : only },
      { onSuccess: (data) => setRedactResult(data.result) },
    );
  };

  const runCatalog = () => {
    catalogMutation.mutate(
      {
        caseName: caseName.trim() || '未命名案件证据目录',
        matterId: matterId ? Number(matterId) : undefined,
        submitter: submitter.trim() || undefined,
        items: items
          .filter((item) => item.name.trim())
          .map((item) => ({
            name: item.name.trim(),
            type: item.type.trim() || undefined,
            source: item.source.trim() || undefined,
            pages: Number(item.pages) || 1,
            note: item.note.trim() || undefined,
          })),
      },
      { onSuccess: (data) => setCatalogResult(data.result) },
    );
  };

  const runOcr = () => {
    ocrMutation.mutate(
      {
        files: files
          .filter((file) => file.name.trim())
          .map((file) => ({ name: file.name.trim(), pages: Number(file.pages) || 1 })),
      },
      { onSuccess: (data) => setOcrResult(data.result) },
    );
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败，请手动选择文本');
    }
  };

  return (
    <>
      <PageHeader
        title="证据与文档处理"
        subtitle="敏感信息一键脱敏、证据目录与页码自动编排；OCR 双层 PDF 为本地演示登记，明确标注未真实识别。"
      />
      <ToolboxBanner demo />

      <Panel title="当前案件" subtitle="各项处理结果均可一键结构化保存到所选案件。">
        <MatterPicker matterId={matterId} setMatterId={setMatterId} matters={matters} />
      </Panel>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="敏感信息脱敏" />
          <Tab label="证据目录编排" />
          <Tab label="OCR 双层 PDF（演示）" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <>
          <Panel title="脱敏设置" subtitle="本地正则识别身份证号、银行卡号、手机号与邮箱；原文不上传、不留存。">
            <Stack spacing={2}>
              <TextField size="small" fullWidth multiline minRows={4} label="待脱敏文本" value={text} onChange={(e) => setText(e.target.value)} />
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>识别范围</InputLabel>
                  <Select value={only} label="识别范围" onChange={(e) => setOnly(e.target.value as typeof only)}>
                    <MenuItem value="all">全部类型</MenuItem>
                    <MenuItem value="idCard">仅身份证号</MenuItem>
                    <MenuItem value="bankCard">仅银行卡号</MenuItem>
                    <MenuItem value="phone">仅手机号</MenuItem>
                    <MenuItem value="email">仅邮箱</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={runRedact} disabled={redactMutation.isPending}>
                  {redactMutation.isPending ? '处理中…' : '一键脱敏'}
                </Button>
              </Stack>
            </Stack>
          </Panel>

          {!redactResult && <Panel title="脱敏结果"><ResultPlaceholder text="输入文本后点击「一键脱敏」。" /></Panel>}
          {redactResult && (
            <>
              <Panel
                title="脱敏结果（可直接编辑后复制）"
                action={<Button size="small" startIcon={<ContentCopyOutlined />} onClick={() => copyText(redactResult.redactedText)}>复制结果</Button>}
              >
                <TextField size="small" fullWidth multiline minRows={5} value={redactResult.redactedText} onChange={(e) => setRedactResult({ ...redactResult, redactedText: e.target.value })} />
                <Box sx={{ mt: 2 }}>
                  <FieldGrid columns={4}>
                    <Field label="识别命中总数">{redactResult.hitCount} 处</Field>
                    <Field label="身份证号">{redactResult.byKind.idCard ?? 0} 处</Field>
                    <Field label="银行卡号">{redactResult.byKind.bankCard ?? 0} 处</Field>
                    <Field label="手机号 / 邮箱">{redactResult.byKind.phone ?? 0} / {redactResult.byKind.email ?? 0} 处</Field>
                  </FieldGrid>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>{redactResult.disclaimer}</Typography>
              </Panel>
              {redactResult.hits.length > 0 && (
                <Panel title="命中明细" subtitle="请逐项核对脱敏后的文本是否仍可识别个人信息。">
                  <Table size="small">
                    <TableHead><TableRow><TableCell>类型</TableCell><TableCell>原文</TableCell><TableCell>脱敏后</TableCell><TableCell align="right">位置</TableCell></TableRow></TableHead>
                    <TableBody>
                      {redactResult.hits.map((hit, i) => (
                        <TableRow key={i}>
                          <TableCell>{KIND_LABEL[hit.kind] ?? hit.kind}</TableCell>
                          <TableCell>{hit.raw}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{hit.masked}</TableCell>
                          <TableCell align="right">{hit.start}-{hit.end}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Panel>
              )}
              <Stack direction="row" spacing={1}>
                <SaveToMatterButton
                  matterId={matterId}
                  toolCode="tool_evidence"
                  toolName="证据文档处理 · 脱敏"
                  title="证据材料脱敏结果"
                  input={{ text, only }}
                  result={{ ...redactResult }}
                  summary={`识别并脱敏 ${redactResult.hitCount} 处敏感信息`}
                />
              </Stack>
            </>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <Panel title="证据清单" subtitle="录入每组证据及页数，自动编排连续页码并生成可复制的证据目录。">
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField size="small" fullWidth label="案件名称" value={caseName} onChange={(e) => setCaseName(e.target.value)} placeholder="例如：软件买卖合同货款纠纷" />
                <TextField size="small" fullWidth label="提交人（可选）" value={submitter} onChange={(e) => setSubmitter(e.target.value)} />
              </Stack>
              {items.map((item, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <TextField size="small" label="证据名称" value={item.name} onChange={(e) => setItems((prev) => prev.map((v, idx) => (idx === i ? { ...v, name: e.target.value } : v)))} sx={{ minWidth: 200, flex: 2 }} />
                  <TextField size="small" label="类型" value={item.type} onChange={(e) => setItems((prev) => prev.map((v, idx) => (idx === i ? { ...v, type: e.target.value } : v)))} sx={{ minWidth: 100, flex: 1 }} />
                  <TextField size="small" label="来源" value={item.source} onChange={(e) => setItems((prev) => prev.map((v, idx) => (idx === i ? { ...v, source: e.target.value } : v)))} sx={{ minWidth: 120, flex: 1 }} />
                  <TextField size="small" label="页数" type="number" value={item.pages} onChange={(e) => setItems((prev) => prev.map((v, idx) => (idx === i ? { ...v, pages: e.target.value } : v)))} sx={{ width: 90 }} />
                  <TextField size="small" label="备注" value={item.note} onChange={(e) => setItems((prev) => prev.map((v, idx) => (idx === i ? { ...v, note: e.target.value } : v)))} sx={{ minWidth: 120, flex: 1 }} />
                  <IconButton size="small" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}><DeleteOutlineOutlined fontSize="small" /></IconButton>
                </Stack>
              ))}
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<AddCircleOutlineOutlined />} onClick={() => setItems((prev) => [...prev, { name: '', type: '书证', source: '', pages: '1', note: '' }])}>添加证据</Button>
                <Button variant="contained" startIcon={<FactCheckOutlined />} onClick={runCatalog} disabled={catalogMutation.isPending}>
                  {catalogMutation.isPending ? '生成中…' : '生成证据目录'}
                </Button>
              </Stack>
            </Stack>
          </Panel>

          {!catalogResult && <Panel title="目录预览"><ResultPlaceholder text="录入证据清单后点击「生成证据目录」。" /></Panel>}
          {catalogResult && (
            <>
              <Panel
                title={`证据目录 · ${catalogResult.caseName}`}
                action={<Button size="small" startIcon={<ContentCopyOutlined />} onClick={() => copyText(catalogResult.text)}>复制目录</Button>}
              >
                <FieldGrid columns={3}>
                  <Field label="证据组数">{catalogResult.totalGroups} 组</Field>
                  <Field label="合计页数">{catalogResult.totalPages} 页</Field>
                  <Field label="提交人">{catalogResult.submitter ?? '—'}</Field>
                </FieldGrid>
                <Table size="small" sx={{ mt: 2 }}>
                  <TableHead><TableRow><TableCell>序号</TableCell><TableCell>证据名称</TableCell><TableCell>类型</TableCell><TableCell>来源</TableCell><TableCell>页码</TableCell><TableCell>备注</TableCell></TableRow></TableHead>
                  <TableBody>
                    {catalogResult.rows.map((row) => (
                      <TableRow key={row.index}>
                        <TableCell>{row.index}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.source}</TableCell>
                        <TableCell>{row.pageFrom}-{row.pageTo}</TableCell>
                        <TableCell>{row.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>{catalogResult.disclaimer}</Typography>
              </Panel>
              <Stack direction="row" spacing={1}>
                <SaveToMatterButton
                  matterId={matterId}
                  toolCode="tool_evidence"
                  toolName="证据文档处理 · 目录"
                  title={`证据目录 · ${catalogResult.caseName}`}
                  input={{ caseName, submitter, items }}
                  result={{ ...catalogResult }}
                  summary={`${catalogResult.totalGroups} 组证据，共 ${catalogResult.totalPages} 页`}
                />
              </Stack>
            </>
          )}
        </>
      )}

      {tab === 2 && (
        <>
          <Alert severity="warning" sx={{ mb: 2 }}>
            演示边界：本页不上传文件、不执行真实 OCR 识别。下方仅为批量登记与处理状态占位，输出的「双层 PDF」为占位产物名，不含识别文本。正式使用须接入合规 OCR 服务并人工校对。
          </Alert>
          <Panel title="批量登记" subtitle="登记待处理文件与页数（演示输入，不读取本地文件）。">
            <Stack spacing={2}>
              {files.map((file, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center">
                  <TextField size="small" fullWidth label="文件名" value={file.name} onChange={(e) => setFiles((prev) => prev.map((v, idx) => (idx === i ? { ...v, name: e.target.value } : v)))} />
                  <TextField size="small" label="页数" type="number" value={file.pages} onChange={(e) => setFiles((prev) => prev.map((v, idx) => (idx === i ? { ...v, pages: e.target.value } : v)))} sx={{ width: 100 }} />
                  <IconButton size="small" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}><DeleteOutlineOutlined fontSize="small" /></IconButton>
                </Stack>
              ))}
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<AddCircleOutlineOutlined />} onClick={() => setFiles((prev) => [...prev, { name: '', pages: '1' }])}>添加文件</Button>
                <Button variant="contained" onClick={runOcr} disabled={ocrMutation.isPending}>
                  {ocrMutation.isPending ? '登记中…' : '批量登记（模拟）'}
                </Button>
              </Stack>
            </Stack>
          </Panel>

          {!ocrResult && <Panel title="处理状态"><ResultPlaceholder text="登记文件后查看模拟处理状态。" /></Panel>}
          {ocrResult && (
            <>
              <Panel title="处理状态占位" subtitle={`共 ${ocrResult.total} 个文件，其中 ${ocrResult.supported} 个格式受支持（演示）`}>
                <Table size="small">
                  <TableHead><TableRow><TableCell>文件名</TableCell><TableCell>类型</TableCell><TableCell align="right">页数</TableCell><TableCell>状态</TableCell><TableCell>占位产物</TableCell></TableRow></TableHead>
                  <TableBody>
                    {ocrResult.jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{job.name}</TableCell>
                        <TableCell>{job.fileType}</TableCell>
                        <TableCell align="right">{job.pages}</TableCell>
                        <TableCell>{job.status}</TableCell>
                        <TableCell>{job.outputName ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>{ocrResult.disclaimer}</Typography>
              </Panel>
              <Stack direction="row" spacing={1}>
                <SaveToMatterButton
                  matterId={matterId}
                  toolCode="tool_evidence"
                  toolName="证据文档处理 · OCR登记"
                  title="OCR 双层 PDF 批量登记（演示）"
                  input={{ files }}
                  result={{ ...ocrResult }}
                  summary={`演示登记 ${ocrResult.total} 个文件，未执行真实 OCR 识别`}
                />
              </Stack>
            </>
          )}
        </>
      )}
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import { useToast } from '@/components/common/ToastProvider';
import {
  useAssistantDrafts,
  useDeleteDraft,
  useDocuments,
  useExtractDates,
  useMatters,
  useUpdateDraft,
} from '@/hooks/useCrm';
import { formatDateTime, toLocalInput } from '@/lib/format';
import type { CalendarDraftEvent, CalendarDraftStatus } from '@/types';

const statusMeta: Record<CalendarDraftStatus, { label: string; color: 'warning' | 'success' | 'default' }> = {
  draft: { label: '待确认', color: 'warning' },
  confirmed: { label: '已确认', color: 'success' },
  dismissed: { label: '已忽略', color: 'default' },
};

export function AssistantPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [documentId, setDocumentId] = useState('');
  const [text, setText] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [matterId, setMatterId] = useState('');
  const [status, setStatus] = useState('draft');
  const [confirmDraft, setConfirmDraft] = useState<CalendarDraftEvent | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDue, setConfirmDue] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: documents } = useDocuments();
  const { data: matters } = useMatters();
  const { data: drafts, isLoading, isError, error, refetch } = useAssistantDrafts({
    status: status === 'all' ? undefined : status,
  });
  const extract = useExtractDates();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();

  const selectedDocument = documents?.find((document) => document.id === Number(documentId));
  const documentText = selectedDocument
    ? (selectedDocument.content ?? selectedDocument.description ?? selectedDocument.title)
    : '';

  const chooseDocument = (value: string) => {
    setDocumentId(value);
    const document = documents?.find((item) => item.id === Number(value));
    if (document) {
      setSourceName(document.title);
      setMatterId(String(document.matterId ?? ''));
    }
  };

  const submitExtract = () => {
    if (!documentId && !text.trim()) {
      toast.warning('请选择文档或粘贴法院通知文本');
      return;
    }
    extract.mutate(
      {
        text: documentId ? undefined : text.trim(),
        documentId: documentId ? Number(documentId) : undefined,
        sourceName: sourceName.trim() || selectedDocument?.title || undefined,
        matterId: matterId ? Number(matterId) : null,
      },
      {
        onSuccess: (result) => {
          setStatus('draft');
          if (result.length > 0) toast.success(`识别到 ${result.length} 个候选日期，请确认后生成日程`);
          else toast.info('未从文本中识别到日期，请检查文本内容');
        },
      },
    );
  };

  const openConfirm = (draft: CalendarDraftEvent) => {
    setConfirmDraft(draft);
    setConfirmTitle(draft.title);
    setConfirmDue(toLocalInput(draft.extractedDate));
  };

  const submitConfirm = () => {
    if (!confirmDraft) return;
    updateDraft.mutate(
      {
        id: confirmDraft.id,
        data: {
          status: 'confirmed',
          title: confirmTitle.trim() || confirmDraft.title,
          dueDate: confirmDue ? new Date(confirmDue).toISOString() : confirmDraft.extractedDate,
        },
      },
      {
        onSuccess: () => {
          setConfirmDraft(null);
          toast.success('已确认并生成真实日程');
        },
      },
    );
  };

  return (
    <Box>
      <PageHeader
        title="AI 日历辅助"
        subtitle="从法院通知与文档文本中提取日期，生成待确认草稿并保留来源"
        actions={
          <Button variant="outlined" startIcon={<CalendarMonthOutlined />} onClick={() => navigate('/calendar')}>
            查看日历
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        按本地规则解析文本中的日期并保留来源，不调用外部 AI 服务。识别结果都需要人工确认后才会写入日程。
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <AutoAwesomeOutlined color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>日期识别</Typography>
            </Stack>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="assistant-document">已有文档</InputLabel>
                <Select labelId="assistant-document" label="已有文档" value={documentId} onChange={(event) => chooseDocument(event.target.value)}>
                  <MenuItem value="">不使用文档（手动粘贴）</MenuItem>
                  {(documents ?? []).map((document) => (
                    <MenuItem key={document.id} value={String(document.id)}>{document.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {documentId && (
                <TextField
                  label="文档正文（用于识别）"
                  value={documentText}
                  multiline
                  minRows={4}
                  maxRows={8}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  helperText={selectedDocument?.content ? '使用文档的正文内容' : '文档无正文时回退到说明或标题'}
                />
              )}
              {!documentId && (
                <TextField
                  label="法院通知 / 文档文本 *"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  multiline
                  minRows={7}
                  fullWidth
                  placeholder="例如：本院定于2026年11月20日开庭，请于2026/11/15前提交证据材料。"
                />
              )}
              <TextField size="small" label="来源名称" value={sourceName} onChange={(event) => setSourceName(event.target.value)} fullWidth />
              <FormControl fullWidth size="small">
                <InputLabel id="assistant-matter">关联案件</InputLabel>
                <Select labelId="assistant-matter" label="关联案件" value={matterId} onChange={(event) => setMatterId(event.target.value)}>
                  <MenuItem value="">不关联</MenuItem>
                  {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<AutoAwesomeOutlined />} onClick={submitExtract} disabled={extract.isPending}>
                识别日期
              </Button>
              <Typography variant="caption" color="text.secondary">
                支持 2026年11月20日、2026-11-20、2026/11/20、2026.11.20 等写法；按关键词区分开庭、截止与会议。
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle1" fontWeight={700}>识别草稿</Typography>
              <Chip size="small" label={drafts?.length ?? 0} />
              <Box sx={{ flexGrow: 1 }} />
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel id="draft-status-filter">状态</InputLabel>
                <Select labelId="draft-status-filter" label="状态" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <MenuItem value="draft">待确认</MenuItem>
                  <MenuItem value="confirmed">已确认</MenuItem>
                  <MenuItem value="dismissed">已忽略</MenuItem>
                  <MenuItem value="all">全部</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {isError && <ErrorState message={error?.message ?? '识别草稿加载失败'} onRetry={() => void refetch()} />}
            <Paper variant="outlined">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>识别日期</TableCell>
                      <TableCell>关键词</TableCell>
                      <TableCell>草稿标题</TableCell>
                      <TableCell>提取片段</TableCell>
                      <TableCell>来源</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading && <LoadingRows columns={7} />}
                    {!isLoading && (drafts ?? []).map((draft) => (
                      <TableRow key={draft.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(draft.extractedDate)}</TableCell>
                        <TableCell><Chip size="small" variant="outlined" label={draft.keyword} /></TableCell>
                        <TableCell sx={{ maxWidth: 200 }}><Typography variant="body2" noWrap>{draft.title}</Typography></TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography variant="caption" color="text.secondary" noWrap display="block" title={draft.sourceSnippet}>
                            {draft.sourceSnippet}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 140 }}>
                          <Typography variant="caption" noWrap display="block">{draft.sourceName}</Typography>
                          {draft.taskId && <Typography variant="caption" color="success.main">日程 #{draft.taskId}</Typography>}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" color={statusMeta[draft.status]?.color ?? 'default'} label={statusMeta[draft.status]?.label ?? draft.status} />
                        </TableCell>
                        <TableCell align="right">
                          {draft.status === 'draft' && (
                            <>
                              <Button size="small" startIcon={<CheckOutlined />} onClick={() => openConfirm(draft)}>确认</Button>
                              <Button
                                size="small"
                                color="inherit"
                                startIcon={<CloseOutlined />}
                                onClick={() => updateDraft.mutate({ id: draft.id, data: { status: 'dismissed' } })}
                              >
                                忽略
                              </Button>
                            </>
                          )}
                          <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={() => setDeleteId(draft.id)}>删除</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && !isError && (drafts ?? []).length === 0 && (
                      <EmptyRow columns={7} text="暂无符合条件的草稿，先在左侧识别日期" />
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={confirmDraft !== null} onClose={() => setConfirmDraft(null)} maxWidth="sm" fullWidth>
        <DialogTitle>确认生成日程</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Alert severity="info">确认后将创建真实日程，来源信息会保留在日程的 sourceType / sourceDetail 字段中。</Alert>
          <TextField size="small" label="日程标题" value={confirmTitle} onChange={(event) => setConfirmTitle(event.target.value)} fullWidth />
          <TextField
            size="small"
            label="截止时间"
            type="datetime-local"
            value={confirmDue}
            onChange={(event) => setConfirmDue(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <Typography variant="caption" color="text.secondary">来源：{confirmDraft?.sourceName ?? '—'}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{confirmDraft?.sourceSnippet ?? ''}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDraft(null)}>取消</Button>
          <Button variant="contained" onClick={submitConfirm} disabled={updateDraft.isPending}>确认并生成日程</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="删除识别草稿"
        message="确定删除该识别草稿吗？已生成的日程不受影响。"
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) deleteDraft.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
      />
    </Box>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AddOutlined from '@mui/icons-material/AddOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
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
import { DocumentFormDialog } from '@/components/common/DocumentsPanel';
import { Field, FieldGrid } from '@/components/common/Field';
import { NotesPanel } from '@/components/common/NotesPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import { useClients, useDeleteDocument, useDocuments, useMatters, useUsers } from '@/hooks/useCrm';
import { useTrackVisit } from '@/hooks/useRecent';
import { formatDate, formatDateTime } from '@/lib/format';
import { documentCategoryMeta } from '@/lib/meta';
import type { Document, DocumentCategory } from '@/types';

const columns = 8;

export function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [matterId, setMatterId] = useState('');
  const [clientId, setClientId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [detail, setDetail] = useState<Document | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: documents, isLoading, isError, error, refetch } = useDocuments({ matterId: matterId || undefined, clientId: clientId || undefined });
  const { data: matters } = useMatters();
  const { data: clients } = useClients();
  const { data: users } = useUsers();
  const deleteDocument = useDeleteDocument();
  useTrackVisit('document', detail?.id, detail?.title);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const rows = (documents ?? []).filter((doc) => {
    if (category !== 'all' && doc.category !== category) return false;
    if (!query.trim()) return true;
    const text = `${doc.title} ${doc.fileName ?? ''} ${doc.description ?? ''} ${doc.version}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  const updateQuery = (value: string) => {
    setQuery(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  return (
    <Box>
      <PageHeader
        title="案件文档"
        subtitle={`共 ${documents?.length ?? 0} 份文档 · 已签署 ${documents?.filter((doc) => doc.signed).length ?? 0} 份`}
        actions={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            新建文档
          </Button>
        }
      >
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder="搜索标题、文件名或说明"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            sx={{ width: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="doc-category-filter">分类</InputLabel>
            <Select labelId="doc-category-filter" label="分类" value={category} onChange={(event) => setCategory(event.target.value as DocumentCategory | 'all')}>
              <MenuItem value="all">全部分类</MenuItem>
              {(Object.keys(documentCategoryMeta) as DocumentCategory[]).map((key) => (
                <MenuItem key={key} value={key}>{documentCategoryMeta[key].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="doc-matter-filter">关联案件</InputLabel>
            <Select labelId="doc-matter-filter" label="关联案件" value={matterId} onChange={(event) => setMatterId(event.target.value)}>
              <MenuItem value="">全部案件</MenuItem>
              {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="doc-client-filter">关联客户</InputLabel>
            <Select labelId="doc-client-filter" label="关联客户" value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <MenuItem value="">全部客户</MenuItem>
              {(clients ?? []).map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </PageHeader>

      <Paper>
        {isError && <ErrorState message={error?.message ?? '文档加载失败'} onRetry={() => void refetch()} />}
        {isLoading && <LoadingRows columns={columns} />}
        {!isLoading && !isError && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>文档标题</TableCell>
                  <TableCell>分类</TableCell>
                  <TableCell>关联案件</TableCell>
                  <TableCell>关联客户</TableCell>
                  <TableCell>版本</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>上传时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <DescriptionOutlined fontSize="small" color="action" />
                        <Box sx={{ minWidth: 0 }}>
                          <Button size="small" sx={{ p: 0, minWidth: 0, textTransform: 'none', justifyContent: 'flex-start' }} onClick={() => setDetail(doc)}>
                            {doc.title}
                          </Button>
                          {doc.fileName && <Typography variant="caption" color="text.secondary" display="block">{doc.fileName}</Typography>}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={documentCategoryMeta[doc.category]?.label ?? doc.category} color={documentCategoryMeta[doc.category]?.color} />
                    </TableCell>
                    <TableCell>{doc.matterId ? (
                      <Button size="small" sx={{ p: 0, minWidth: 0, textTransform: 'none' }} onClick={() => navigate(`/matters/${doc.matterId}`)}>
                        {matters?.find((matter) => matter.id === doc.matterId)?.title ?? `#${doc.matterId}`}
                      </Button>
                    ) : '—'}</TableCell>
                    <TableCell>{clients?.find((client) => client.id === doc.clientId)?.name ?? '—'}</TableCell>
                    <TableCell>v{doc.version}</TableCell>
                    <TableCell>
                      <Chip size="small" label={doc.signed ? '已签署' : '未签署'} color={doc.signed ? 'success' : 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setDetail(doc)} aria-label="查看详情"><DescriptionOutlined fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => { setEditing(doc); setFormOpen(true); }} aria-label="编辑文档"><EditOutlined fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setConfirmId(doc.id)} aria-label="删除文档"><DeleteOutline fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && rows.length === 0 && <EmptyRow columns={columns} text="暂无符合条件的文档" />}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <DocumentFormDialog open={formOpen} onClose={() => setFormOpen(false)} document={editing} />
      <ConfirmDialog
        open={confirmId !== null}
        title="删除文档"
        message="确定删除该文档吗？此操作不可撤销。"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteDocument.mutate(confirmId, { onSuccess: () => { setConfirmId(null); setDetail(null); } }); }}
      />

      <Drawer anchor="right" open={detail !== null} onClose={() => setDetail(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 2.5 } }}>
        {detail && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6">{detail.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>v{detail.version} · {documentCategoryMeta[detail.category]?.label ?? detail.category}</Typography>
              </Box>
              <IconButton onClick={() => setDetail(null)} aria-label="关闭"><CloseOutlined fontSize="small" /></IconButton>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <FieldGrid columns={2}>
              <Field label="文件名">{detail.fileName}</Field>
              <Field label="签署状态">{detail.signed ? '已签署' : '未签署'}</Field>
              <Field label="关联案件">
                {detail.matterId ? <Button size="small" sx={{ p: 0, minWidth: 0 }} onClick={() => navigate(`/matters/${detail.matterId}`)}>
                  {matters?.find((matter) => matter.id === detail.matterId)?.title ?? `#${detail.matterId}`}
                </Button> : undefined}
              </Field>
              <Field label="关联客户">{clients?.find((client) => client.id === detail.clientId)?.name}</Field>
              <Field label="上传人">{users?.find((user) => user.id === detail.uploadedById)?.name}</Field>
              <Field label="上传时间">{formatDateTime(detail.createdAt)}</Field>
              <Field label="说明" span={2}>{detail.description}</Field>
            </FieldGrid>
            <Box sx={{ mt: 3 }}>
              <NotesPanel targetType="document" targetId={detail.id} />
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}

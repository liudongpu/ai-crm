import { useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
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
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyRow, ErrorState, LoadingRows } from './States';
import { useClients, useCreateDocument, useDeleteDocument, useDocuments, useMatters, useUpdateDocument } from '@/hooks/useCrm';
import { formatDate } from '@/lib/format';
import { documentCategoryMeta } from '@/lib/meta';
import type { Document, DocumentCategory, DocumentInput } from '@/types';

type FormState = {
  title: string;
  category: DocumentCategory;
  fileName: string;
  version: string;
  matterId: string;
  clientId: string;
  signed: boolean;
  description: string;
};

const emptyForm: FormState = {
  title: '',
  category: 'contract',
  fileName: '',
  version: '1.0',
  matterId: '',
  clientId: '',
  signed: false,
  description: '',
};

export function DocumentFormDialog({
  open,
  onClose,
  document,
  defaultMatterId,
  defaultClientId,
}: {
  open: boolean;
  onClose: () => void;
  document?: Document | null;
  defaultMatterId?: number;
  defaultClientId?: number;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const { data: matters } = useMatters();
  const { data: clients } = useClients();
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();

  useEffect(() => {
    if (!open) return;
    setForm({
      title: document?.title ?? '',
      category: document?.category ?? 'contract',
      fileName: document?.fileName ?? '',
      version: document?.version ?? '1.0',
      matterId: String(document?.matterId ?? defaultMatterId ?? ''),
      clientId: String(document?.clientId ?? defaultClientId ?? ''),
      signed: document?.signed ?? false,
      description: document?.description ?? '',
    });
  }, [open, document, defaultMatterId, defaultClientId]);

  const submit = () => {
    if (!form.title.trim()) return;
    const payload: DocumentInput = {
      title: form.title.trim(),
      category: form.category,
      fileName: form.fileName.trim() || null,
      version: form.version.trim() || '1.0',
      matterId: form.matterId ? Number(form.matterId) : null,
      clientId: form.clientId ? Number(form.clientId) : null,
      signed: form.signed,
      description: form.description.trim() || null,
    };
    if (document) {
      updateDocument.mutate({ id: document.id, data: payload }, { onSuccess: onClose });
    } else {
      createDocument.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{document ? '编辑文档' : '新建文档'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label="标题 *" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} fullWidth autoFocus />
          <FormControl fullWidth>
            <InputLabel id="doc-category">分类</InputLabel>
            <Select labelId="doc-category" label="分类" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as DocumentCategory })}>
              {(Object.keys(documentCategoryMeta) as DocumentCategory[]).map((key) => (
                <MenuItem key={key} value={key}>{documentCategoryMeta[key].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="文件名" value={form.fileName} onChange={(event) => setForm({ ...form, fileName: event.target.value })} fullWidth />
          <TextField label="版本" value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="doc-matter">关联案件</InputLabel>
            <Select labelId="doc-matter" label="关联案件" value={form.matterId} onChange={(event) => setForm({ ...form, matterId: event.target.value })}>
              <MenuItem value="">不关联</MenuItem>
              {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="doc-client">关联客户</InputLabel>
            <Select labelId="doc-client" label="关联客户" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
              <MenuItem value="">不关联</MenuItem>
              {(clients ?? []).map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <FormControlLabel control={<Checkbox checked={form.signed} onChange={(event) => setForm({ ...form, signed: event.target.checked })} />} label="已签署" />
        <TextField label="说明" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={2} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button variant="contained" onClick={submit} disabled={!form.title.trim() || createDocument.isPending || updateDocument.isPending}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

export function DocumentsPanel({ matterId, clientId }: { matterId?: number; clientId?: number }) {
  const { data: documents, isLoading, isError, error, refetch } = useDocuments({ matterId, clientId });
  const { data: matters } = useMatters();
  const deleteDocument = useDeleteDocument();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">共 {documents?.length ?? 0} 份文档</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddOutlined />}
          onClick={() => { setEditing(null); setFormOpen(true); }}
        >
          新建文档
        </Button>
      </Stack>

      {isError && <ErrorState message={error?.message ?? '文档加载失败'} onRetry={() => void refetch()} />}
      {isLoading && <LoadingRows columns={6} />}
      {!isLoading && !isError && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>标题</TableCell>
                <TableCell>分类</TableCell>
                <TableCell>关联案件</TableCell>
                <TableCell>版本</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>创建日期</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents?.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{item.title}</Typography>
                    {item.fileName && <Typography variant="caption" color="text.secondary">{item.fileName}</Typography>}
                  </TableCell>
                  <TableCell><Chip size="small" variant="outlined" label={documentCategoryMeta[item.category]?.label ?? item.category} color={documentCategoryMeta[item.category]?.color} /></TableCell>
                  <TableCell>{matters?.find((matter) => matter.id === item.matterId)?.title ?? '—'}</TableCell>
                  <TableCell>v{item.version}</TableCell>
                  <TableCell>
                    <Chip size="small" label={item.signed ? '已签署' : '未签署'} color={item.signed ? 'success' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(item.createdAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setEditing(item); setFormOpen(true); }} aria-label="编辑文档"><EditOutlined fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirmId(item.id)} aria-label="删除文档"><DeleteOutline fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (documents?.length ?? 0) === 0 && <EmptyRow columns={7} text="暂无文档" />}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <DocumentFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        document={editing}
        defaultMatterId={matterId}
        defaultClientId={clientId}
      />
      <ConfirmDialog
        open={confirmId !== null}
        title="删除文档"
        message="确定删除该文档记录吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId !== null) deleteDocument.mutate(confirmId, { onSuccess: () => setConfirmId(null) });
        }}
      />
    </Box>
  );
}

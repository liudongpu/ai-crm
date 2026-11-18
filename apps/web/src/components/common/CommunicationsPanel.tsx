import { useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
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
import { useCommunications, useCreateCommunication, useDeleteCommunication, useUpdateCommunication, useUsers } from '@/hooks/useCrm';
import { formatDateTime, toLocalInput } from '@/lib/format';
import { communicationTypeMeta } from '@/lib/meta';
import type { Communication, CommunicationDirection, CommunicationInput, CommunicationType } from '@/types';

type FormState = {
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  content: string;
  occurredAt: string;
  userId: string;
};

const emptyForm: FormState = {
  type: 'email',
  direction: 'outbound',
  subject: '',
  content: '',
  occurredAt: toLocalInput(new Date().toISOString()),
  userId: '',
};

export function CommunicationsPanel({
  matterId,
  clientId,
  contactId,
  autoOpen = false,
  type,
}: {
  matterId?: number;
  clientId?: number;
  contactId?: number;
  autoOpen?: boolean;
  type?: CommunicationType;
}) {
  const params = { matterId, clientId, contactId, type };
  const { data: records, isLoading, isError, error, refetch } = useCommunications(params);
  const { data: users } = useUsers();
  const createRecord = useCreateCommunication();
  const updateRecord = useUpdateCommunication();
  const deleteRecord = useDeleteCommunication();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Communication | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (autoOpen) {
      setEditing(null);
      setOpen(true);
    }
  }, [autoOpen]);

  useEffect(() => {
    if (!open) return;
    setForm({
      type: editing?.type ?? 'email',
      direction: editing?.direction ?? 'outbound',
      subject: editing?.subject ?? '',
      content: editing?.content ?? '',
      occurredAt: toLocalInput(editing?.occurredAt ?? new Date().toISOString()),
      userId: String(editing?.userId ?? ''),
    });
  }, [open, editing]);

  const submit = () => {
    if (!form.content.trim()) return;
    const payload: CommunicationInput = {
      matterId: matterId ?? editing?.matterId ?? null,
      clientId: clientId ?? editing?.clientId ?? null,
      contactId: contactId ?? editing?.contactId ?? null,
      type: form.type,
      direction: form.direction,
      subject: form.subject.trim() || null,
      content: form.content.trim(),
      occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString() : undefined,
      userId: form.userId ? Number(form.userId) : null,
    };
    if (editing) {
      updateRecord.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) });
    } else {
      createRecord.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">共 {records?.length ?? 0} 条沟通记录</Typography>
        <Button size="small" variant="outlined" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>
          记录沟通
        </Button>
      </Stack>

      {isError && <ErrorState message={error?.message ?? '沟通记录加载失败'} onRetry={() => void refetch()} />}
      {isLoading && <LoadingRows columns={6} />}
      {!isLoading && !isError && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>时间</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>方向</TableCell>
                <TableCell>主题 / 内容</TableCell>
                <TableCell>记录人</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records?.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(record.occurredAt)}</TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={communicationTypeMeta[record.type]?.label ?? record.type} color={communicationTypeMeta[record.type]?.color} />
                  </TableCell>
                  <TableCell>{record.direction === 'inbound' ? '收到' : '发出'}</TableCell>
                  <TableCell sx={{ maxWidth: 420 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{record.subject || '（无主题）'}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">{record.content}</Typography>
                  </TableCell>
                  <TableCell>{users?.find((user) => user.id === record.userId)?.name ?? '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setEditing(record); setOpen(true); }} aria-label="编辑沟通记录"><EditOutlined fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirmId(record.id)} aria-label="删除沟通记录"><DeleteOutline fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (records?.length ?? 0) === 0 && <EmptyRow columns={6} text="暂无沟通记录" />}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑沟通记录' : '记录沟通'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="comm-type">类型</InputLabel>
              <Select labelId="comm-type" label="类型" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CommunicationType })}>
                {(Object.keys(communicationTypeMeta) as CommunicationType[]).map((key) => (
                  <MenuItem key={key} value={key}>{communicationTypeMeta[key].label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="comm-direction">方向</InputLabel>
              <Select labelId="comm-direction" label="方向" value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value as CommunicationDirection })}>
                <MenuItem value="outbound">发出</MenuItem>
                <MenuItem value="inbound">收到</MenuItem>
              </Select>
            </FormControl>
            <TextField label="发生时间" type="datetime-local" value={form.occurredAt} onChange={(event) => setForm({ ...form, occurredAt: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
            <FormControl fullWidth>
              <InputLabel id="comm-user">记录人</InputLabel>
              <Select labelId="comm-user" label="记录人" value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })}>
                <MenuItem value="">未指定</MenuItem>
                {(users ?? []).map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="主题" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} fullWidth />
          <TextField label="内容 *" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} multiline minRows={3} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.content.trim() || createRecord.isPending || updateRecord.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除沟通记录"
        message="确定删除该沟通记录吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId !== null) deleteRecord.mutate(confirmId, { onSuccess: () => setConfirmId(null) });
        }}
      />
    </Box>
  );
}

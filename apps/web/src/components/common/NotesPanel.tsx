import { useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import NotesOutlined from '@mui/icons-material/NotesOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from './ConfirmDialog';
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from '@/hooks/useCrm';
import { formatDateTime } from '@/lib/format';
import type { Note, NoteTargetType } from '@/types';

export function NotesPanel({ targetType, targetId }: { targetType: NoteTargetType; targetId: number }) {
  const { data: notes, isLoading } = useNotes({ targetType, targetId });
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content ?? '');
    setOpen(true);
  };

  const submit = () => {
    if (!title.trim()) return;
    const payload = { title: title.trim(), content: content.trim() || null, targetType, targetId };
    if (editing) {
      updateNote.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) });
    } else {
      createNote.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">共 {notes?.length ?? 0} 条备注</Typography>
        <Button size="small" variant="outlined" startIcon={<AddOutlined />} onClick={openCreate}>新建备注</Button>
      </Box>

      {isLoading && <Typography variant="body2" color="text.secondary">加载中...</Typography>}
      {!isLoading && notes?.length === 0 && (
        <Card sx={{ borderStyle: 'dashed', textAlign: 'center', py: 5 }}>
          <CardContent>
            <NotesOutlined sx={{ fontSize: 36, color: 'text.disabled' }} />
            <Typography color="text.secondary" sx={{ mt: 1 }}>还没有备注，记录一条跟进信息吧。</Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
        {notes?.map((note) => (
          <Card key={note.id}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2">{note.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {note.owner} · {formatDateTime(note.createdAt)}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => openEdit(note)} aria-label="编辑备注"><EditOutlined fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => setConfirmId(note.id)} aria-label="删除备注"><DeleteOutline fontSize="small" /></IconButton>
              </Box>
              {note.content && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {note.content}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑备注' : '新建备注'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="标题" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth autoFocus />
          <TextField label="内容" value={content} onChange={(event) => setContent(event.target.value)} fullWidth multiline minRows={4} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!title.trim() || createNote.isPending || updateNote.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除备注"
        message="确定删除这条备注吗？此操作不可撤销。"
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteNote.mutate(confirmId, { onSuccess: () => setConfirmId(null) })}
      />
    </Box>
  );
}

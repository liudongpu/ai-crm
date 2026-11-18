import { useMemo, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
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
import Divider from '@mui/material/Divider';
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
  useCalendarEvents,
  useCalendarReminders,
  useCreateReminder,
  useDeleteReminder,
  useImportIcs,
  useMarkReminderSent,
  useMatters,
  useUpdateReminder,
} from '@/hooks/useCrm';
import { api } from '@/lib/api';
import { formatDateTime, toLocalInput } from '@/lib/format';
import type {
  CalendarReminder,
  IcsImportResult,
  ReminderChannel,
  ReminderInput,
  ReminderStatus,
} from '@/types';

const channelMeta: Record<ReminderChannel, string> = {
  in_app: '站内提醒',
  email: '邮件',
  sms: '短信',
};

const reminderStatusMeta: Record<ReminderStatus, { label: string; color: 'warning' | 'success' | 'default' }> = {
  pending: { label: '待发送', color: 'warning' },
  sent: { label: '已发送', color: 'success' },
  cancelled: { label: '已取消', color: 'default' },
};

type FormState = {
  taskId: string;
  channel: ReminderChannel;
  recipient: string;
  leadMinutes: string;
  status: ReminderStatus;
  message: string;
};

const emptyForm = (): FormState => ({
  taskId: '',
  channel: 'in_app',
  recipient: '',
  leadMinutes: '60',
  status: 'pending',
  message: '',
});

export function SyncPage() {
  const toast = useToast();
  const [exportCalendar, setExportCalendar] = useState('all');
  const [importCalendar, setImportCalendar] = useState('firm');
  const [icsContent, setIcsContent] = useState('');
  const [importResult, setImportResult] = useState<IcsImportResult | null>(null);
  const [reminderStatus, setReminderStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarReminder | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: matters } = useMatters();
  const { data: events } = useCalendarEvents({});
  const { data: reminders, isLoading, isError, error, refetch } = useCalendarReminders();
  const importIcs = useImportIcs();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const markSent = useMarkReminderSent();
  const deleteReminder = useDeleteReminder();

  const calendarOptions = useMemo(() => [
    { id: 'firm', name: '律所日历' },
    { id: 'team', name: '团队日历' },
    { id: 'personal', name: '个人日历' },
    ...(matters ?? []).map((matter) => ({ id: `matter:${matter.id}`, name: `案件：${matter.title}` })),
  ], [matters]);

  const allReminders = reminders ?? [];
  const stats = {
    pending: allReminders.filter((item) => item.status === 'pending').length,
    sent: allReminders.filter((item) => item.status === 'sent').length,
    cancelled: allReminders.filter((item) => item.status === 'cancelled').length,
  };
  const rows = allReminders.filter((item) => reminderStatus === 'all' || item.status === reminderStatus);

  const downloadIcs = async () => {
    try {
      const content = await api.calendar.exportIcs({
        calendarId: exportCalendar === 'all' ? undefined : exportCalendar,
      });
      const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lexdesk-calendar-${exportCalendar}.ics`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('ICS 文件已生成并开始下载');
    } catch (err) {
      toast.error(`导出失败：${(err as Error).message}`);
    }
  };

  const readFile = async (file?: File) => {
    if (!file) return;
    setIcsContent(await file.text());
    toast.success(`已读取 ${file.name}`);
  };

  const submitImport = () => {
    if (!icsContent.trim()) {
      toast.warning('请粘贴 ICS 内容或选择 .ics 文件');
      return;
    }
    importIcs.mutate(
      { content: icsContent, calendarId: importCalendar },
      {
        onSuccess: (result) => {
          setImportResult(result);
          toast.success(`导入完成：成功 ${result.imported} 项，跳过 ${result.skipped} 项`);
        },
      },
    );
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (reminder: CalendarReminder) => {
    setEditing(reminder);
    setForm({
      taskId: String(reminder.taskId),
      channel: reminder.channel,
      recipient: reminder.recipient ?? '',
      leadMinutes: String(reminder.leadMinutes),
      status: reminder.status,
      message: reminder.message ?? '',
    });
    setFormOpen(true);
  };

  const submitReminder = () => {
    if (!form.taskId || !form.leadMinutes) return;
    const payload: ReminderInput = {
      taskId: Number(form.taskId),
      channel: form.channel,
      recipient: form.recipient.trim() || null,
      leadMinutes: Number(form.leadMinutes),
      status: form.status,
      message: form.message.trim() || null,
    };
    if (editing) {
      updateReminder.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createReminder.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <Box>
      <PageHeader
        title="同步与提醒"
        subtitle="标准日历文件交换与本地提醒队列管理"
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        使用标准 ICS 文件交换，不连接第三方云服务。导出后可用其他日历软件打开，导入时按标题与开始时间去重。
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, alignItems: 'start' }}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <DownloadOutlined color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>导出日历文件</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="export-calendar">导出日历</InputLabel>
                <Select labelId="export-calendar" label="导出日历" value={exportCalendar} onChange={(event) => setExportCalendar(event.target.value)}>
                  <MenuItem value="all">全部日历</MenuItem>
                  {calendarOptions.map((option) => <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<DownloadOutlined />} onClick={() => void downloadIcs()}>导出 .ics</Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <UploadFileOutlined color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>导入日历文件</Typography>
            </Stack>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="import-calendar">导入到</InputLabel>
                  <Select labelId="import-calendar" label="导入到" value={importCalendar} onChange={(event) => setImportCalendar(event.target.value)}>
                    {calendarOptions.map((option) => <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button component="label" variant="outlined" startIcon={<UploadFileOutlined />}>
                  选择 .ics 文件
                  <input
                    hidden
                    type="file"
                    accept=".ics,text/calendar"
                    onChange={(event) => void readFile(event.target.files?.[0])}
                  />
                </Button>
              </Stack>
              <TextField
                label="或直接粘贴 .ics 内容 *"
                value={icsContent}
                onChange={(event) => setIcsContent(event.target.value)}
                multiline
                minRows={8}
                fullWidth
                placeholder={'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n...'}
              />
              <Button variant="contained" startIcon={<UploadFileOutlined />} onClick={submitImport} disabled={importIcs.isPending}>
                导入日程
              </Button>
            </Stack>

            {importResult && (
              <Alert severity="success" sx={{ mt: 2 }}>
                导入 {importResult.imported} 项，跳过 {importResult.skipped} 项。
              </Alert>
            )}
            {importResult && (
              <Paper variant="outlined" sx={{ mt: 1, maxHeight: 240, overflowY: 'auto' }}>
                <TableContainer>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow><TableCell>导入的事件</TableCell><TableCell>时间</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                      {importResult.events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{event.title}</TableCell>
                          <TableCell>{formatDateTime(event.startDate ?? event.dueDate)}</TableCell>
                        </TableRow>
                      ))}
                      {importResult.events.length === 0 && (
                        <TableRow><TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>没有新增事件</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle1" fontWeight={700}>提醒队列</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>新建提醒</Button>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
              <Chip label={`待发送 ${stats.pending}`} color="warning" variant="outlined" />
              <Chip label={`已发送 ${stats.sent}`} color="success" variant="outlined" />
              <Chip label={`已取消 ${stats.cancelled}`} variant="outlined" />
            </Stack>

            <FormControl size="small" sx={{ minWidth: 140, mb: 2 }}>
              <InputLabel id="reminder-status-filter">状态</InputLabel>
              <Select labelId="reminder-status-filter" label="状态" value={reminderStatus} onChange={(event) => setReminderStatus(event.target.value)}>
                <MenuItem value="all">全部</MenuItem>
                {(Object.keys(reminderStatusMeta) as ReminderStatus[]).map((key) => (
                  <MenuItem key={key} value={key}>{reminderStatusMeta[key].label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {isError && <ErrorState message={error?.message ?? '提醒队列加载失败'} onRetry={() => void refetch()} />}
            <Paper variant="outlined">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>事项</TableCell>
                      <TableCell>渠道</TableCell>
                      <TableCell>接收人</TableCell>
                      <TableCell align="right">提前量</TableCell>
                      <TableCell>发送时间</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell>消息</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading && <LoadingRows columns={8} />}
                    {!isLoading && rows.map((reminder) => (
                      <TableRow key={reminder.id} hover>
                        <TableCell sx={{ maxWidth: 160 }}>
                          <Typography variant="body2" noWrap>{reminder.task?.title ?? events?.find((item) => item.id === reminder.taskId)?.title ?? `日程 #${reminder.taskId}`}</Typography>
                        </TableCell>
                        <TableCell>{channelMeta[reminder.channel] ?? reminder.channel}</TableCell>
                        <TableCell>{reminder.recipient ?? '—'}</TableCell>
                        <TableCell align="right">{reminder.leadMinutes} 分钟</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(reminder.sendAt)}</TableCell>
                        <TableCell>
                          <Chip size="small" color={reminderStatusMeta[reminder.status]?.color ?? 'default'} label={reminderStatusMeta[reminder.status]?.label ?? reminder.status} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 180 }}>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">{reminder.message ?? '—'}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {reminder.status === 'pending' && (
                            <Button size="small" onClick={() => markSent.mutate(reminder.id)}>标记已发送</Button>
                          )}
                          <Button size="small" startIcon={<EditOutlined />} onClick={() => openEdit(reminder)}>编辑</Button>
                          <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={() => setDeleteId(reminder.id)}>删除</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && !isError && rows.length === 0 && <EmptyRow columns={8} text="暂无符合条件的提醒" />}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑提醒' : '新建提醒'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel id="reminder-task">关联事项 *</InputLabel>
            <Select labelId="reminder-task" label="关联事项 *" value={form.taskId} onChange={(event) => setForm({ ...form, taskId: event.target.value })}>
              <MenuItem value="">请选择日程</MenuItem>
              {(events ?? []).map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>{item.title} · {formatDateTime(item.dueDate)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="reminder-channel">渠道</InputLabel>
              <Select labelId="reminder-channel" label="渠道" value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value as ReminderChannel })}>
                {(Object.keys(channelMeta) as ReminderChannel[]).map((key) => (
                  <MenuItem key={key} value={key}>{channelMeta[key]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" label="接收人" value={form.recipient} onChange={(event) => setForm({ ...form, recipient: event.target.value })} fullWidth />
            <TextField size="small" label="提前量（分钟）" type="number" value={form.leadMinutes} onChange={(event) => setForm({ ...form, leadMinutes: event.target.value })} fullWidth />
            <FormControl fullWidth size="small">
              <InputLabel id="reminder-status">状态</InputLabel>
              <Select labelId="reminder-status" label="状态" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ReminderStatus })}>
                {(Object.keys(reminderStatusMeta) as ReminderStatus[]).map((key) => (
                  <MenuItem key={key} value={key}>{reminderStatusMeta[key].label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <TextField size="small" label="消息内容" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} multiline minRows={2} fullWidth />
          <Typography variant="caption" color="text.secondary">
            发送时间由后端按事项截止时间减去提前量自动计算，当前编辑事项截止：
            {toLocalInput(events?.find((item) => item.id === Number(form.taskId))?.dueDate) || '未设置'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>取消</Button>
          <Button variant="contained" onClick={submitReminder} disabled={!form.taskId || !form.leadMinutes || createReminder.isPending || updateReminder.isPending}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="删除提醒"
        message="确定删除该提醒吗？"
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) deleteReminder.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
      />
    </Box>
  );
}

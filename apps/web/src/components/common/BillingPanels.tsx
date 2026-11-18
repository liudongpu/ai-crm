import { useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyRow, ErrorState, LoadingRows } from './States';
import {
  useApproveInvoice,
  useClients,
  useCreateExpense,
  useCreateInvoice,
  useCreateTimeEntry,
  useDeleteExpense,
  useDeleteInvoice,
  useDeleteTimeEntry,
  useExpenses,
  useInvoices,
  useMatters,
  usePayInvoice,
  useSendInvoice,
  useTimeEntries,
  useUpdateExpense,
  useUpdateInvoice,
  useUpdateTimeEntry,
  useUsers,
  useVoidInvoice,
} from '@/hooks/useCrm';
import { formatCurrency, formatDate, formatNumber, toDateInput } from '@/lib/format';
import { invoiceStatusMeta, paymentMethodMeta } from '@/lib/meta';
import type {
  Expense,
  ExpenseInput,
  Invoice,
  InvoiceInput,
  InvoiceItem,
  PaymentMethod,
  TimeEntry,
  TimeEntryInput,
} from '@/types';

const todayInput = () => toDateInput(new Date().toISOString());
const isoDate = (value: string) => (value ? new Date(`${value}T00:00:00`).toISOString() : new Date().toISOString());

/* ----------------------------- Time entries ----------------------------- */

type TimeForm = {
  matterId: string;
  userId: string;
  date: string;
  hours: string;
  description: string;
  billable: boolean;
  rate: string;
};

const emptyTime: TimeForm = { matterId: '', userId: '', date: todayInput(), hours: '1', description: '', billable: true, rate: '800' };

export function TimeEntriesPanel({ matterId }: { matterId?: number }) {
  const { data: entries, isLoading, isError, error, refetch } = useTimeEntries(matterId ? { matterId } : {});
  const { data: matters } = useMatters();
  const { data: users } = useUsers();
  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [form, setForm] = useState<TimeForm>(emptyTime);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      matterId: String(editing?.matterId ?? matterId ?? ''),
      userId: String(editing?.userId ?? ''),
      date: toDateInput(editing?.date ?? new Date().toISOString()),
      hours: String(editing?.hours ?? 1),
      description: editing?.description ?? '',
      billable: editing?.billable ?? true,
      rate: String(editing?.rate ?? 800),
    });
  }, [open, editing, matterId]);

  const submit = () => {
    if (!form.matterId || !form.userId || !form.description.trim()) return;
    const hours = Number(form.hours) || 0;
    const rate = Number(form.rate) || 0;
    const payload: TimeEntryInput = {
      matterId: Number(form.matterId),
      userId: Number(form.userId),
      date: isoDate(form.date),
      hours,
      description: form.description.trim(),
      billable: form.billable,
      rate,
      amount: hours * rate,
    };
    if (editing) {
      updateEntry.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) });
    } else {
      createEntry.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          共 {entries?.length ?? 0} 条 · 未开票 {entries?.filter((item) => !item.invoiced).length ?? 0} 条 · {formatNumber(entries?.filter((item) => !item.invoiced).reduce((sum, item) => sum + item.hours, 0))} 小时
        </Typography>
        <Button size="small" variant="outlined" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>记录时间</Button>
      </Stack>

      {isError && <ErrorState message={error?.message ?? '时间记录加载失败'} onRetry={() => void refetch()} />}
      {isLoading && <LoadingRows columns={8} />}
      {!isLoading && !isError && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>日期</TableCell>
                <TableCell>案件</TableCell>
                <TableCell>人员</TableCell>
                <TableCell>工作内容</TableCell>
                <TableCell align="right">小时</TableCell>
                <TableCell align="right">费率</TableCell>
                <TableCell align="right">金额</TableCell>
                <TableCell>开票</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries?.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</TableCell>
                  <TableCell>{matters?.find((matter) => matter.id === entry.matterId)?.title ?? `#${entry.matterId}`}</TableCell>
                  <TableCell>{users?.find((user) => user.id === entry.userId)?.name ?? `#${entry.userId}`}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}><Typography variant="body2" noWrap>{entry.description}</Typography></TableCell>
                  <TableCell align="right">{formatNumber(entry.hours)}</TableCell>
                  <TableCell align="right">{formatCurrency(entry.rate)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(entry.amount)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={entry.invoiced ? '已开票' : entry.billable ? '未开票' : '不可计费'} color={entry.invoiced ? 'success' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setEditing(entry); setOpen(true); }} aria-label="编辑时间记录"><EditOutlined fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirmId(entry.id)} aria-label="删除时间记录"><DeleteOutline fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (entries?.length ?? 0) === 0 && <EmptyRow columns={9} text="暂无时间记录" />}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑时间记录' : '记录工作时间'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="time-matter">案件 *</InputLabel>
              <Select labelId="time-matter" label="案件 *" value={form.matterId} onChange={(event) => setForm({ ...form, matterId: event.target.value })}>
                <MenuItem value="">请选择</MenuItem>
                {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="time-user">人员 *</InputLabel>
              <Select labelId="time-user" label="人员 *" value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })}>
                <MenuItem value="">请选择</MenuItem>
                {(users ?? []).map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="日期" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
            <TextField label="小时数" type="number" inputProps={{ min: 0, step: '0.25' }} value={form.hours} onChange={(event) => setForm({ ...form, hours: event.target.value })} fullWidth />
            <TextField label="费率 (¥/小时)" type="number" inputProps={{ min: 0 }} value={form.rate} onChange={(event) => setForm({ ...form, rate: event.target.value })} fullWidth />
          </Box>
          <TextField label="工作内容 *" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={2} fullWidth />
          <FormControlLabel control={<Checkbox checked={form.billable} onChange={(event) => setForm({ ...form, billable: event.target.checked })} />} label="可计费" />
          <Typography variant="body2" color="text.secondary" align="right">预计金额：{formatCurrency((Number(form.hours) || 0) * (Number(form.rate) || 0))}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.matterId || !form.userId || !form.description.trim() || createEntry.isPending || updateEntry.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除时间记录"
        message="确定删除该时间记录吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteEntry.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
    </Box>
  );
}

/* -------------------------------- Expenses ------------------------------- */

type ExpenseForm = {
  matterId: string;
  date: string;
  category: string;
  amount: string;
  description: string;
  billable: boolean;
  receipt: string;
};

const emptyExpense: ExpenseForm = { matterId: '', date: todayInput(), category: '差旅', amount: '', description: '', billable: true, receipt: '' };

export function ExpensesPanel({ matterId }: { matterId?: number }) {
  const { data: expenses, isLoading, isError, error, refetch } = useExpenses(matterId ? { matterId } : {});
  const { data: matters } = useMatters();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyExpense);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      matterId: String(editing?.matterId ?? matterId ?? ''),
      date: toDateInput(editing?.date ?? new Date().toISOString()),
      category: editing?.category ?? '差旅',
      amount: String(editing?.amount ?? ''),
      description: editing?.description ?? '',
      billable: editing?.billable ?? true,
      receipt: editing?.receipt ?? '',
    });
  }, [open, editing, matterId]);

  const submit = () => {
    if (!form.matterId || !form.amount) return;
    const payload: ExpenseInput = {
      matterId: Number(form.matterId),
      date: isoDate(form.date),
      category: form.category.trim() || '其他',
      amount: Number(form.amount),
      description: form.description.trim() || null,
      billable: form.billable,
      receipt: form.receipt.trim() || null,
    };
    if (editing) {
      updateExpense.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) });
    } else {
      createExpense.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          共 {expenses?.length ?? 0} 笔 · 合计 {formatCurrency(expenses?.reduce((sum, item) => sum + Number(item.amount), 0))}
        </Typography>
        <Button size="small" variant="outlined" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>登记费用</Button>
      </Stack>

      {isError && <ErrorState message={error?.message ?? '费用加载失败'} onRetry={() => void refetch()} />}
      {isLoading && <LoadingRows columns={7} />}
      {!isLoading && !isError && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>日期</TableCell>
                <TableCell>案件</TableCell>
                <TableCell>类别</TableCell>
                <TableCell>说明</TableCell>
                <TableCell align="right">金额</TableCell>
                <TableCell>开票</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses?.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(expense.date)}</TableCell>
                  <TableCell>{matters?.find((matter) => matter.id === expense.matterId)?.title ?? `#${expense.matterId}`}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}><Typography variant="body2" noWrap>{expense.description ?? '—'}</Typography></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(expense.amount)}</TableCell>
                  <TableCell><Chip size="small" label={expense.invoiced ? '已开票' : expense.billable ? '未开票' : '不可计费'} color={expense.invoiced ? 'success' : 'default'} variant="outlined" /></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setEditing(expense); setOpen(true); }} aria-label="编辑费用"><EditOutlined fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirmId(expense.id)} aria-label="删除费用"><DeleteOutline fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (expenses?.length ?? 0) === 0 && <EmptyRow columns={7} text="暂无费用记录" />}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑费用' : '登记费用'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="expense-matter">案件 *</InputLabel>
              <Select labelId="expense-matter" label="案件 *" value={form.matterId} onChange={(event) => setForm({ ...form, matterId: event.target.value })}>
                <MenuItem value="">请选择</MenuItem>
                {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="日期" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
            <TextField label="类别" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} fullWidth />
            <TextField label="金额 (¥) *" type="number" inputProps={{ min: 0 }} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} fullWidth />
            <TextField label="票据号" value={form.receipt} onChange={(event) => setForm({ ...form, receipt: event.target.value })} fullWidth />
          </Box>
          <TextField label="说明" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={2} fullWidth />
          <FormControlLabel control={<Checkbox checked={form.billable} onChange={(event) => setForm({ ...form, billable: event.target.checked })} />} label="可计费" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.matterId || !form.amount || createExpense.isPending || updateExpense.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除费用"
        message="确定删除该费用记录吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteExpense.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
    </Box>
  );
}

/* -------------------------------- Invoices ------------------------------- */

type ManualItem = { description: string; quantity: string; rate: string };
type InvoiceForm = {
  clientId: string;
  matterId: string;
  issueDate: string;
  dueDate: string;
  taxRate: string;
  notes: string;
  items: ManualItem[];
};

const emptyInvoice = (): InvoiceForm => ({
  clientId: '',
  matterId: '',
  issueDate: todayInput(),
  dueDate: todayInput(),
  taxRate: '6',
  notes: '',
  items: [{ description: '', quantity: '1', rate: '' }],
});

export function InvoicesPanel({ matterId, clientId, autoOpen = false }: { matterId?: number; clientId?: number; autoOpen?: boolean }) {
  const { data: invoices, isLoading, isError, error, refetch } = useInvoices({ matterId, clientId });
  const { data: clients } = useClients();
  const { data: matters } = useMatters();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const approveInvoice = useApproveInvoice();
  const sendInvoice = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  const payInvoice = usePayInvoice();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState<InvoiceForm>(emptyInvoice);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', date: todayInput(), method: 'bank' as PaymentMethod, reference: '', notes: '' });

  useEffect(() => {
    if (autoOpen) {
      setEditing(null);
      setOpen(true);
    }
  }, [autoOpen]);

  useEffect(() => {
    if (!open) return;
    setForm({
      clientId: String(editing?.clientId ?? clientId ?? ''),
      matterId: String(editing?.matterId ?? matterId ?? ''),
      issueDate: toDateInput(editing?.issueDate ?? new Date().toISOString()),
      dueDate: toDateInput(editing?.dueDate ?? new Date().toISOString()),
      taxRate: String(editing?.taxRate ?? 6),
      notes: editing?.notes ?? '',
      items: editing?.items?.filter((item) => item.type === 'manual').map((item) => ({
        description: item.description, quantity: String(item.quantity), rate: String(item.rate),
      })) ?? [{ description: '', quantity: '1', rate: '' }],
    });
  }, [open, editing, matterId, clientId]);

  useEffect(() => {
    if (!payTarget) return;
    setPayForm({
      amount: String(Math.max(0, payTarget.total - payTarget.paidAmount)),
      date: todayInput(),
      method: 'bank',
      reference: '',
      notes: '',
    });
  }, [payTarget]);

  const submit = () => {
    if (!form.clientId) return;
    const items: InvoiceItem[] = form.items
      .filter((item) => item.description.trim())
      .map((item) => {
        const quantity = Number(item.quantity) || 0;
        const rate = Number(item.rate) || 0;
        return { description: item.description.trim(), quantity, rate, amount: quantity * rate, type: 'manual' };
      });
    const payload: InvoiceInput = {
      clientId: Number(form.clientId),
      matterId: form.matterId ? Number(form.matterId) : null,
      issueDate: isoDate(form.issueDate),
      dueDate: isoDate(form.dueDate),
      taxRate: (Number(form.taxRate) || 0) / 100,
      notes: form.notes.trim() || null,
      items,
    };
    if (editing) {
      updateInvoice.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) });
    } else {
      createInvoice.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          共 {invoices?.length ?? 0} 张 · 未收金额 {formatCurrency(invoices?.filter((item) => item.status !== 'paid' && item.status !== 'void').reduce((sum, item) => sum + Math.max(0, item.total - item.paidAmount), 0))}
        </Typography>
        <Button size="small" variant="outlined" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>新建账单</Button>
      </Stack>

      {isError && <ErrorState message={error?.message ?? '账单加载失败'} onRetry={() => void refetch()} />}
      {isLoading && <LoadingRows columns={9} />}
      {!isLoading && !isError && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>账单号</TableCell>
                <TableCell>客户</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>开票日</TableCell>
                <TableCell>到期日</TableCell>
                <TableCell align="right">金额</TableCell>
                <TableCell align="right">已收</TableCell>
                <TableCell align="right">未收</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices?.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{invoice.number}</TableCell>
                  <TableCell>{clients?.find((client) => client.id === invoice.clientId)?.name ?? `#${invoice.clientId}`}</TableCell>
                  <TableCell><Chip size="small" label={invoiceStatusMeta[invoice.status]?.label ?? invoice.status} color={invoiceStatusMeta[invoice.status]?.color} variant="outlined" /></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell align="right">{formatCurrency(invoice.total)}</TableCell>
                  <TableCell align="right">{formatCurrency(invoice.paidAmount)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(Math.max(0, invoice.total - invoice.paidAmount))}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="明细"><IconButton size="small" onClick={() => setDetail(invoice)} aria-label="查看明细"><VisibilityOutlined fontSize="small" /></IconButton></Tooltip>
                    {(invoice.status === 'draft' || invoice.status === 'pending_approval') && (
                      <Tooltip title="审批"><IconButton size="small" onClick={() => approveInvoice.mutate(invoice.id)} aria-label="审批账单"><CheckOutlined fontSize="small" /></IconButton></Tooltip>
                    )}
                    {(invoice.status === 'approved' || invoice.status === 'pending_approval') && (
                      <Tooltip title="发送"><IconButton size="small" onClick={() => sendInvoice.mutate(invoice.id)} aria-label="发送账单"><SendOutlined fontSize="small" /></IconButton></Tooltip>
                    )}
                    {(invoice.status === 'sent' || invoice.status === 'approved' || invoice.status === 'pending_approval') && (
                      <Tooltip title="记录收款"><IconButton size="small" onClick={() => setPayTarget(invoice)} aria-label="记录收款"><PaymentsOutlined fontSize="small" /></IconButton></Tooltip>
                    )}
                    <IconButton size="small" onClick={() => { setEditing(invoice); setOpen(true); }} aria-label="编辑账单"><EditOutlined fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirmId(invoice.id)} aria-label="删除账单"><DeleteOutline fontSize="small" /></IconButton>
                    {invoice.status !== 'paid' && invoice.status !== 'void' && (
                      <Tooltip title="作废"><IconButton size="small" color="error" onClick={() => voidInvoice.mutate(invoice.id)} aria-label="作废账单"><CancelOutlined fontSize="small" /></IconButton></Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (invoices?.length ?? 0) === 0 && <EmptyRow columns={9} text="暂无账单" />}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑账单' : '新建账单'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="invoice-client">客户 *</InputLabel>
              <Select labelId="invoice-client" label="客户 *" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
                <MenuItem value="">请选择</MenuItem>
                {(clients ?? []).map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="invoice-matter">关联案件</InputLabel>
              <Select labelId="invoice-matter" label="关联案件" value={form.matterId} onChange={(event) => setForm({ ...form, matterId: event.target.value })}>
                <MenuItem value="">不关联</MenuItem>
                {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="开票日" type="date" value={form.issueDate} onChange={(event) => setForm({ ...form, issueDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
            <TextField label="到期日" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
            <TextField label="税率 (%)" type="number" inputProps={{ min: 0, max: 100 }} value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: event.target.value })} fullWidth />
          </Box>
          <Typography variant="subtitle2">账单项目（手工录入）</Typography>
          {form.items.map((item, index) => (
            <Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr auto' }, gap: 1, alignItems: 'center' }}>
              <TextField label="说明" value={item.description} onChange={(event) => {
                const items = [...form.items];
                items[index] = { ...item, description: event.target.value };
                setForm({ ...form, items });
              }} fullWidth />
              <TextField label="数量" type="number" value={item.quantity} onChange={(event) => {
                const items = [...form.items];
                items[index] = { ...item, quantity: event.target.value };
                setForm({ ...form, items });
              }} fullWidth />
              <TextField label="单价" type="number" value={item.rate} onChange={(event) => {
                const items = [...form.items];
                items[index] = { ...item, rate: event.target.value };
                setForm({ ...form, items });
              }} fullWidth />
              <IconButton size="small" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })} aria-label="移除项目"><DeleteOutline fontSize="small" /></IconButton>
            </Box>
          ))}
          <Button size="small" startIcon={<AddOutlined />} onClick={() => setForm({ ...form, items: [...form.items, { description: '', quantity: '1', rate: '' }] })}>添加项目</Button>
          <TextField label="备注" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} multiline minRows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.clientId || createInvoice.isPending || updateInvoice.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detail !== null} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>账单明细 · {detail?.number}</DialogTitle>
        <DialogContent>
          {(detail?.items ?? []).length === 0 && <Typography variant="body2" color="text.secondary">无明细项目</Typography>}
          {(detail?.items ?? []).map((item, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography variant="body2">{item.description}</Typography>
                <Typography variant="caption" color="text.secondary">{item.type} · {item.quantity} × {formatCurrency(item.rate)}</Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>{formatCurrency(item.amount)}</Typography>
            </Box>
          ))}
          {detail && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">小计</Typography><Typography variant="body2">{formatCurrency(detail.subtotal)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">税费 ({(detail.taxRate * 100).toFixed(0)}%)</Typography><Typography variant="body2">{formatCurrency(detail.tax)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="subtitle1">合计</Typography><Typography variant="subtitle1">{formatCurrency(detail.total)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">已收</Typography><Typography variant="body2" color="text.secondary">{formatCurrency(detail.paidAmount)}</Typography></Box>
            </Box>
          )}
          {detail?.notes && <Typography variant="body2" color="text.secondary" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{detail.notes}</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>关闭</Button></DialogActions>
      </Dialog>

      <Dialog open={payTarget !== null} onClose={() => setPayTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>记录收款 · {payTarget?.number}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="金额 *" type="number" inputProps={{ min: 0 }} value={payForm.amount} onChange={(event) => setPayForm({ ...payForm, amount: event.target.value })} fullWidth autoFocus />
          <TextField label="收款日期" type="date" value={payForm.date} onChange={(event) => setPayForm({ ...payForm, date: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="payment-method">方式</InputLabel>
            <Select labelId="payment-method" label="方式" value={payForm.method} onChange={(event) => setPayForm({ ...payForm, method: event.target.value as PaymentMethod })}>
              {(Object.keys(paymentMethodMeta) as PaymentMethod[]).map((key) => <MenuItem key={key} value={key}>{paymentMethodMeta[key]}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="参考号" value={payForm.reference} onChange={(event) => setPayForm({ ...payForm, reference: event.target.value })} fullWidth />
          <TextField label="备注" value={payForm.notes} onChange={(event) => setPayForm({ ...payForm, notes: event.target.value })} multiline minRows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayTarget(null)} color="inherit">取消</Button>
          <Button variant="contained" disabled={!payForm.amount || payInvoice.isPending} onClick={() => {
            if (!payTarget) return;
            payInvoice.mutate({
              id: payTarget.id,
              data: {
                amount: Number(payForm.amount),
                date: isoDate(payForm.date),
                method: payForm.method,
                reference: payForm.reference.trim() || null,
                notes: payForm.notes.trim() || null,
              },
            }, { onSuccess: () => setPayTarget(null) });
          }}>确认收款</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除账单"
        message="确定删除该账单吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteInvoice.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
    </Box>
  );
}

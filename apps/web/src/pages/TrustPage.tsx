import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, ErrorState, LoadingRows } from '@/components/common/States';
import {
  useClients,
  useCreateTrustTransaction,
  useDeleteTrustTransaction,
  useInvoices,
  useMatters,
  usePayments,
  useReconcileTrust,
  useTrustTransactions,
  useUpdateTrustTransaction,
} from '@/hooks/useCrm';
import { formatCurrency, formatDate } from '@/lib/format';
import { paymentMethodMeta, trustCategoryMeta, trustTypeMeta } from '@/lib/meta';
import type { TrustCategory, TrustTransaction, TrustTransactionInput, TrustTransactionType } from '@/types';

const todayInput = () => new Date().toISOString().slice(0, 10);
const isoDate = (value: string) => (value ? new Date(`${value}T00:00:00`).toISOString() : new Date().toISOString());

type FormState = {
  clientId: string;
  matterId: string;
  type: TrustTransactionType;
  category: TrustCategory;
  amount: string;
  date: string;
  description: string;
  reference: string;
  reconciled: boolean;
};

const emptyForm = (): FormState => ({
  clientId: '', matterId: '', type: 'deposit', category: 'retainer', amount: '',
  date: todayInput(), description: '', reference: '', reconciled: false,
});

const signedAmount = (tx: TrustTransaction) => {
  const value = Number(tx.amount) || 0;
  return ['deposit', 'transfer_in'].includes(tx.type) ? value : -value;
};

export function TrustPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<'trust' | 'payments'>('trust');
  const [clientFilter, setClientFilter] = useState('');
  const [reconciledFilter, setReconciledFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrustTransaction | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { data: transactions, isLoading, isError, error, refetch } = useTrustTransactions({
    clientId: clientFilter || undefined,
    reconciled: reconciledFilter === 'all' ? undefined : reconciledFilter === 'yes',
  });
  const { data: clients } = useClients();
  const { data: matters } = useMatters();
  const { data: payments } = usePayments();
  const { data: invoices } = useInvoices();
  const createTx = useCreateTrustTransaction();
  const updateTx = useUpdateTrustTransaction();
  const deleteTx = useDeleteTrustTransaction();
  const reconcile = useReconcileTrust();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setTab('trust');
      setEditing(null);
      setForm(emptyForm());
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!formOpen) return;
    setForm({
      clientId: String(editing?.clientId ?? ''),
      matterId: String(editing?.matterId ?? ''),
      type: editing?.type ?? 'deposit',
      category: editing?.category ?? 'retainer',
      amount: String(editing?.amount ?? ''),
      date: editing ? editing.date.slice(0, 10) : todayInput(),
      description: editing?.description ?? '',
      reference: editing?.reference ?? '',
      reconciled: editing?.reconciled ?? false,
    });
  }, [formOpen, editing]);

  const balance = (transactions ?? []).reduce((sum, tx) => sum + signedAmount(tx), 0);
  const rows = transactions ?? [];

  const submit = () => {
    if (!form.clientId || !form.amount) return;
    const payload: TrustTransactionInput = {
      clientId: Number(form.clientId),
      matterId: form.matterId ? Number(form.matterId) : null,
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      date: isoDate(form.date),
      description: form.description.trim() || null,
      reference: form.reference.trim() || null,
      reconciled: form.reconciled,
    };
    if (editing) updateTx.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    else createTx.mutate(payload, { onSuccess: () => setFormOpen(false) });
  };

  return (
    <Box>
      <PageHeader
        title="信托账户"
        subtitle="管理客户预付款、信托交易与收款记录"
        actions={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => { setEditing(null); setForm(emptyForm()); setFormOpen(true); }}>
            新信托交易
          </Button>
        }
      >
        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          <Card sx={{ minWidth: 220 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">当前筛选余额</Typography>
              <Typography variant="h6">{formatCurrency(balance)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 220 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">交易笔数</Typography>
              <Typography variant="h6">{rows.length}</Typography>
            </CardContent>
          </Card>
        </Stack>
      </PageHeader>

      <Card>
        <Tabs value={tab} onChange={(_, value: 'trust' | 'payments') => setTab(value)} sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tab value="trust" label="信托交易" />
          <Tab value="payments" label="收款记录" />
        </Tabs>
        <CardContent sx={{ p: 2 }}>
          {tab === 'trust' && (
            <>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="trust-client">客户</InputLabel>
                  <Select labelId="trust-client" label="客户" value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                    <MenuItem value="">全部客户</MenuItem>
                    {(clients ?? []).map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="trust-reconciled">对账状态</InputLabel>
                  <Select labelId="trust-reconciled" label="对账状态" value={reconciledFilter} onChange={(event) => setReconciledFilter(event.target.value)}>
                    <MenuItem value="all">全部</MenuItem>
                    <MenuItem value="yes">已对账</MenuItem>
                    <MenuItem value="no">未对账</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Paper>
                {isError && <ErrorState message={error?.message ?? '信托交易加载失败'} onRetry={() => void refetch()} />}
                {isLoading && <LoadingRows columns={9} />}
                {!isLoading && !isError && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>日期</TableCell>
                          <TableCell>客户</TableCell>
                          <TableCell>案件</TableCell>
                          <TableCell>类型</TableCell>
                          <TableCell>类别</TableCell>
                          <TableCell>说明</TableCell>
                          <TableCell align="right">金额</TableCell>
                          <TableCell>对账</TableCell>
                          <TableCell align="right">操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((tx) => (
                          <TableRow key={tx.id} hover>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(tx.date)}</TableCell>
                            <TableCell>{clients?.find((client) => client.id === tx.clientId)?.name ?? `#${tx.clientId}`}</TableCell>
                            <TableCell>{matters?.find((matter) => matter.id === tx.matterId)?.title ?? '—'}</TableCell>
                            <TableCell>
                              <Chip size="small" variant="outlined" label={trustTypeMeta[tx.type]?.label ?? tx.type} color={trustTypeMeta[tx.type]?.color} />
                            </TableCell>
                            <TableCell>{trustCategoryMeta[tx.category] ?? tx.category}</TableCell>
                            <TableCell sx={{ maxWidth: 220 }}><Typography variant="body2" noWrap>{tx.description ?? tx.reference ?? '—'}</Typography></TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: signedAmount(tx) >= 0 ? 'success.main' : 'error.main' }}>
                              {signedAmount(tx) >= 0 ? '+' : '-'}{formatCurrency(Math.abs(signedAmount(tx)))}
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                size="small"
                                checked={tx.reconciled}
                                onChange={() => reconcile.mutate(tx.id)}
                                inputProps={{ 'aria-label': `切换对账状态 ${tx.id}` }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button size="small" startIcon={<EditOutlined />} onClick={() => { setEditing(tx); setFormOpen(true); }}>编辑</Button>
                              <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmId(tx.id)}>删除</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!isLoading && rows.length === 0 && <EmptyRow columns={9} text="暂无信托交易" />}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </>
          )}

          {tab === 'payments' && (
            <Paper>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>日期</TableCell>
                      <TableCell>账单号</TableCell>
                      <TableCell>客户</TableCell>
                      <TableCell>方式</TableCell>
                      <TableCell>参考号</TableCell>
                      <TableCell>备注</TableCell>
                      <TableCell align="right">金额</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(payments ?? []).map((payment) => {
                      const invoice = invoices?.find((item) => item.id === payment.invoiceId);
                      return (
                        <TableRow key={payment.id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(payment.date)}</TableCell>
                          <TableCell>{invoice?.number ?? `#${payment.invoiceId}`}</TableCell>
                          <TableCell>{clients?.find((client) => client.id === invoice?.clientId)?.name ?? '—'}</TableCell>
                          <TableCell>{paymentMethodMeta[payment.method] ?? payment.method}</TableCell>
                          <TableCell>{payment.reference ?? '—'}</TableCell>
                          <TableCell>{payment.notes ?? '—'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(payment.amount)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {(payments ?? []).length === 0 && <EmptyRow columns={7} text="暂无收款记录" />}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑信托交易' : '新建信托交易'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="tx-client">客户 *</InputLabel>
              <Select labelId="tx-client" label="客户 *" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
                <MenuItem value="">请选择</MenuItem>
                {(clients ?? []).map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="tx-matter">关联案件</InputLabel>
              <Select labelId="tx-matter" label="关联案件" value={form.matterId} onChange={(event) => setForm({ ...form, matterId: event.target.value })}>
                <MenuItem value="">不关联</MenuItem>
                {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="tx-type">类型</InputLabel>
              <Select labelId="tx-type" label="类型" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TrustTransactionType })}>
                {(Object.keys(trustTypeMeta) as TrustTransactionType[]).map((key) => <MenuItem key={key} value={key}>{trustTypeMeta[key].label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="tx-category">类别</InputLabel>
              <Select labelId="tx-category" label="类别" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as TrustCategory })}>
                {(Object.keys(trustCategoryMeta) as TrustCategory[]).map((key) => <MenuItem key={key} value={key}>{trustCategoryMeta[key]}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="金额 (¥) *" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} fullWidth />
            <TextField label="日期" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
            <TextField label="参考号" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} fullWidth />
          </Box>
          <TextField label="说明" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={2} fullWidth />
          <FormControlLabel control={<Checkbox checked={form.reconciled} onChange={(event) => setForm({ ...form, reconciled: event.target.checked })} />} label="已对账" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submit} disabled={!form.clientId || !form.amount || createTx.isPending || updateTx.isPending}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除信托交易"
        message="确定删除该信托交易吗？"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) deleteTx.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
    </Box>
  );
}

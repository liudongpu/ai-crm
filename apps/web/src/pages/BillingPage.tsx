import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { ExpensesPanel, InvoicesPanel, TimeEntriesPanel } from '@/components/common/BillingPanels';
import { PageHeader } from '@/components/common/PageHeader';
import { useExpenses, useInvoices, useTimeEntries } from '@/hooks/useCrm';
import { formatCurrency, formatNumber } from '@/lib/format';

type BillingTab = 'time' | 'expenses' | 'invoices';

export function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<BillingTab>('invoices');
  const [newInvoice, setNewInvoice] = useState(false);
  const { data: timeEntries } = useTimeEntries();
  const { data: expenses } = useExpenses();
  const { data: invoices } = useInvoices();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setTab('invoices');
      setNewInvoice(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const unbilledHours = (timeEntries ?? []).filter((item) => !item.invoiced).reduce((sum, item) => sum + item.hours, 0);
  const unbilledExpenses = (expenses ?? []).filter((item) => !item.invoiced).reduce((sum, item) => sum + item.amount, 0);
  const outstanding = (invoices ?? [])
    .filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'void')
    .reduce((sum, invoice) => sum + Math.max(0, invoice.total - invoice.paidAmount), 0);

  return (
    <Box>
      <PageHeader title="时间与计费" subtitle="记录工时、登记费用、管理账单与收款" />
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">未开票工时</Typography>
            <Typography variant="h6">{formatNumber(unbilledHours)} 小时</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">未开票费用</Typography>
            <Typography variant="h6">{formatCurrency(unbilledExpenses)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">未收账单金额</Typography>
            <Typography variant="h6">{formatCurrency(outstanding)}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card>
        <Tabs value={tab} onChange={(_, value: BillingTab) => setTab(value)} sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tab value="time" label="时间记录" />
          <Tab value="expenses" label="费用记录" />
          <Tab value="invoices" label="账单与收款" />
        </Tabs>
        <CardContent sx={{ p: 2 }}>
          {tab === 'time' && <TimeEntriesPanel />}
          {tab === 'expenses' && <ExpensesPanel />}
          {tab === 'invoices' && <InvoicesPanel autoOpen={newInvoice} />}
        </CardContent>
      </Card>
    </Box>
  );
}

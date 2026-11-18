import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingCards, LoadingPanel } from '@/components/common/States';
import { useReports } from '@/hooks/useCrm';
import { formatCurrency, formatNumber } from '@/lib/format';

const PIE_COLORS = ['#1b365d', '#b8860b', '#2f7a55', '#5a5f9e', '#b4443c', '#2c6b8f'];

const metricCards = [
  { key: 'revenue', label: '收入', format: (value: number) => formatCurrency(value, true) },
  { key: 'collected', label: '已收款', format: (value: number) => formatCurrency(value, true) },
  { key: 'outstanding', label: '未收款', format: (value: number) => formatCurrency(value, true) },
  { key: 'trustBalance', label: '信托余额', format: (value: number) => formatCurrency(value, true) },
  { key: 'openMatters', label: '进行中案件', format: (value: number) => String(value) },
  { key: 'closedMatters', label: '已结案', format: (value: number) => String(value) },
  { key: 'realizationRate', label: '实现率', format: (value: number) => `${formatNumber(value)}%` },
  { key: 'utilizationRate', label: '利用率', format: (value: number) => `${formatNumber(value)}%` },
  { key: 'collectionRate', label: '收款率', format: (value: number) => `${formatNumber(value)}%` },
  { key: 'leads', label: '咨询线索', format: (value: number) => String(value) },
  { key: 'convertedLeads', label: '已转换线索', format: (value: number) => String(value) },
] as const;

export function ReportsPage() {
  const [days, setDays] = useState(90);
  const { data: report, isLoading, isError, error, refetch } = useReports(days);

  return (
    <Box>
      <PageHeader
        title="运营报表"
        subtitle="案件、收入、工时与线索转化分析"
        actions={
          <ButtonGroup size="small">
            {[30, 90, 180, 365].map((value) => (
              <Button key={value} variant={days === value ? 'contained' : 'outlined'} onClick={() => setDays(value)}>
                {value} 天
              </Button>
            ))}
          </ButtonGroup>
        }
      />

      {isError && <ErrorState message={error?.message ?? '报表加载失败'} onRetry={() => void refetch()} />}
      {isLoading && (
        <Box>
          <LoadingCards count={8} />
          <Box sx={{ mt: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <LoadingPanel height={320} />
            <LoadingPanel height={320} />
          </Box>
        </Box>
      )}
      {!isLoading && !isError && !report && <EmptyState title="暂无报表数据" />}

      {!isLoading && !isError && report && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' } }}>
            {metricCards.map((card) => (
              <Card key={card.key}>
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                  <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>{card.format(report.metrics[card.key] ?? 0)}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>月度收入趋势</Typography>
                {report.revenueByMonth.length === 0 ? (
                  <EmptyState title="暂无收入数据" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={report.revenueByMonth} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(value: number) => `${Math.round(value / 10000)}万`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="收入" stroke="#1b365d" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>线索来源</Typography>
                {report.leadsBySource.length === 0 ? (
                  <EmptyState title="暂无线索数据" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={report.leadsBySource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={90} label>
                        {report.leadsBySource.map((entry, index) => (
                          <Cell key={entry.source} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>执业领域案件分布</Typography>
                {report.mattersByPracticeArea.length === 0 ? (
                  <EmptyState title="暂无案件数据" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={report.mattersByPracticeArea} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="area" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" name="案件数" fill="#1b365d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>人员工时与金额</Typography>
                {report.timeByUser.length === 0 ? (
                  <EmptyState title="暂无工时数据" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={report.timeByUser} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(value, name) => (name === '金额' ? formatCurrency(Number(value)) : `${value} 小时`)} />
                      <Legend />
                      <Bar dataKey="hours" name="工时" fill="#b8860b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="amount" name="金额" fill="#2c6b8f" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>重点客户</Typography>
                {(report.topClients ?? []).length === 0 ? (
                  <EmptyState title="暂无客户数据" />
                ) : (
                  <Stack spacing={1}>
                    {report.topClients.map((client) => (
                      <Box key={client.name} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 0.75 }}>
                        <Typography variant="body2">{client.name} · {client.matters} 个案件</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatCurrency(client.value, true)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>事项类型统计</Typography>
                {(report.tasksByType ?? []).length === 0 ? (
                  <EmptyState title="暂无事项数据" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={report.tasksByType} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="type" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" name="数量" fill="#5a5f9e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}
    </Box>
  );
}

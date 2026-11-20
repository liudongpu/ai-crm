import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
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
import { useCoreReports, useReports } from '@/hooks/useCrm';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import type { CoreReports } from '@/types';

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

function RevenueReport({ data }: { data: CoreReports['revenue'] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' } }}>
        <Stat label="本月已收" value={formatCurrency(data.collectedThisMonth, true)} />
        <Stat label="本季已收" value={formatCurrency(data.collectedThisQuarter, true)} />
        <Stat label="累计已收" value={formatCurrency(data.collectedTotal, true)} />
        <Stat label="本月开票" value={formatCurrency(data.billedThisMonth, true)} />
        <Stat label="未收余额" value={formatCurrency(data.outstanding, true)} />
      </Box>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>近 6 个月收款</Typography>
          {data.byMonth.length === 0 ? <EmptyState title="暂无收款数据" /> : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.byMonth} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(value: number) => `${Math.round(value / 10000)}万`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="value" name="已收金额" stroke="#1b365d" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function ReceivablesReport({ data }: { data: CoreReports['receivables'] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' } }}>
        <Stat label="应收总额" value={formatCurrency(data.total, true)} />
        <Stat label="未结账单" value={`${data.count} 张`} />
        <Stat label="未逾期" value={formatCurrency(data.aging.current, true)} />
        <Stat label="逾期 1-30 天" value={formatCurrency(data.aging.days1to30, true)} />
        <Stat label="逾期 31 天以上" value={formatCurrency(data.aging.days31to60 + data.aging.over60, true)} />
      </Box>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>谁欠钱、欠多少、欠多久</Typography>
          {data.rows.length === 0 ? <EmptyState title="暂无应收账单" /> : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>账单号</TableCell><TableCell>客户</TableCell><TableCell>到期日</TableCell>
                    <TableCell align="right">未收金额</TableCell><TableCell align="right">账龄</TableCell><TableCell>状态</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={row.invoiceId} hover>
                      <TableCell>{row.number}</TableCell>
                      <TableCell>{row.clientName}</TableCell>
                      <TableCell>{formatDate(row.dueDate)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(row.remaining)}</TableCell>
                      <TableCell align="right">
                        <Chip size="small" color={row.agingDays > 30 ? 'error' : row.agingDays > 0 ? 'warning' : 'default'}
                          label={row.agingDays === 0 ? '未逾期' : `${row.agingDays} 天`} />
                      </TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function TimeReport({ data }: { data: CoreReports['time'] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>每人本周 / 本月工时</Typography>
        {data.rows.length === 0 ? <EmptyState title="暂无工时数据" /> : (
          <>
            <TableContainer sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>人员</TableCell><TableCell align="right">本周</TableCell><TableCell align="right">本月</TableCell>
                    <TableCell align="right">可计费</TableCell><TableCell align="right">不可计费</TableCell><TableCell align="right">工时金额</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={row.name} hover>
                      <TableCell>{row.name}</TableCell>
                      <TableCell align="right">{row.weekHours}h</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{row.monthHours}h</TableCell>
                      <TableCell align="right">{row.billableHours}h</TableCell>
                      <TableCell align="right">{row.nonBillableHours}h</TableCell>
                      <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.rows} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => `${value} 小时`} />
                <Legend />
                <Bar dataKey="billableHours" name="可计费" fill="#2f7a55" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonBillableHours" name="不可计费" fill="#b8860b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MattersReport({ data }: { data: CoreReports['matters'] }) {
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
            <Box><Typography variant="caption" color="text.secondary">进行中案件</Typography><Typography variant="h4">{data.open}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">已结案</Typography><Typography variant="h4">{data.closed}</Typography></Box>
          </Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>按执业领域</Typography>
          {data.byArea.length === 0 ? <EmptyState title="暂无案件数据" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byArea} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
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
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>按主办律师</Typography>
          {data.byOwner.length === 0 ? <EmptyState title="暂无案件数据" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.byOwner} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {data.byOwner.map((row, index) => <Cell key={row.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function ClientsReport({ data }: { data: CoreReports['clients'] }) {
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' } }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stat label="本月新增客户" value={`${data.newThisMonth} 家`} />
            <Stat label="本季新增客户" value={`${data.newThisQuarter} 家`} />
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>客户收入贡献</Typography>
          {data.revenueByClient.length === 0 ? <EmptyState title="暂无客户收入数据" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByClient} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={12} tickFormatter={(value: number) => `${Math.round(value / 10000)}万`} />
                <YAxis type="category" dataKey="name" fontSize={12} width={96} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" name="收款金额" fill="#b8860b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export function ReportsPage() {
  const [days, setDays] = useState(90);
  const [reportTab, setReportTab] = useState('overview');
  const { data: report, isLoading, isError, error, refetch } = useReports(days);
  const { data: core, isLoading: coreLoading, isError: coreError, refetch: refetchCore } = useCoreReports();

  return (
    <Box>
      <PageHeader
        title="运营报表"
        subtitle="5 张核心报表：收入、应收、工时、案件、客户"
        actions={
          reportTab === 'overview' ? (
            <ButtonGroup size="small">
              {[30, 90, 180, 365].map((value) => (
                <Button key={value} variant={days === value ? 'contained' : 'outlined'} onClick={() => setDays(value)}>
                  {value} 天
                </Button>
              ))}
            </ButtonGroup>
          ) : undefined
        }
      />

      <Tabs value={reportTab} onChange={(_, value: string) => setReportTab(value)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab value="overview" label="经营概览" />
        <Tab value="revenue" label="收入报表" />
        <Tab value="receivables" label="应收报表" />
        <Tab value="time" label="工时报表" />
        <Tab value="matters" label="案件报表" />
        <Tab value="clients" label="客户报表" />
      </Tabs>

      {reportTab === 'overview' && (
        <>
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
        </>
      )}

      {reportTab !== 'overview' && (coreError && <ErrorState message="核心报表加载失败" onRetry={() => void refetchCore()} />)}
      {reportTab !== 'overview' && coreLoading && (
        <Box><LoadingCards count={4} /><Box sx={{ mt: 2 }}><LoadingPanel height={320} /></Box></Box>
      )}
      {reportTab !== 'overview' && !coreLoading && !coreError && !core && <EmptyState title="暂无报表数据" />}
      {reportTab !== 'overview' && core && (
        <>
          {reportTab === 'revenue' && <RevenueReport data={core.revenue} />}
          {reportTab === 'receivables' && <ReceivablesReport data={core.receivables} />}
          {reportTab === 'time' && <TimeReport data={core.time} />}
          {reportTab === 'matters' && <MattersReport data={core.matters} />}
          {reportTab === 'clients' && <ClientsReport data={core.clients} />}
        </>
      )}
    </Box>
  );
}

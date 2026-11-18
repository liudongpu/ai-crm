import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import GavelOutlined from '@mui/icons-material/Gavel';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import PersonOutline from '@mui/icons-material/PersonOutline';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import RefreshOutlined from '@mui/icons-material/Refresh';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { EmptyState, ErrorState, LoadingCards } from '@/components/common/States';
import { useDashboard } from '@/hooks/useCrm';
import { avatarColor, formatCurrency, formatDate, formatNumber, initials, todayLabel } from '@/lib/format';
import { taskTypeLabel } from '@/lib/meta';
import type { DashboardSummary } from '@/types';

function MetricCard({
  label,
  value,
  hint,
  icon,
  color,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <ButtonBase onClick={onClick} sx={{ width: '100%', p: 2, justifyContent: 'flex-start', textAlign: 'left', borderRadius: 2 }}>
        <Avatar sx={{ bgcolor: `${color}18`, color, width: 40, height: 40, mr: 1.5 }}>{icon}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h6" sx={{ mt: 0.25, fontWeight: 700, fontSize: '1.2rem' }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{hint}</Typography>
        </Box>
      </ButtonBase>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={280} height={42} />
      <Box sx={{ mt: 2 }}><LoadingCards count={8} /></Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, mt: 2 }}>
        <Skeleton variant="rounded" height={320} />
        <Skeleton variant="rounded" height={320} />
      </Box>
    </Box>
  );
}

export function DashboardPage() {
  const { data, isLoading, isFetching, isError, error, refetch } = useDashboard();
  const navigate = useNavigate();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <Box>
        <PageHeader title="律所工作台" subtitle={todayLabel()} />
        <ErrorState message={error?.message ?? '工作台数据加载失败'} onRetry={() => void refetch()} />
      </Box>
    );
  }

  const { metrics, mattersByStage, tasksByType, recentMatters, upcomingTasks, revenueByMonth } = data as DashboardSummary;
  const pieData = tasksByType.map((item) => ({ name: taskTypeLabel(item.type), value: item.count }));
  const pieColors = ['#1b365d', '#b8860b', '#2f7a55', '#b4443c', '#2c6b8f', '#8a6808'];

  return (
    <Box>
      <PageHeader
        title="律所工作台"
        subtitle={`${todayLabel()} · 案件、截止日期与财务概览`}
        actions={
          <>
            <Chip size="small" variant="outlined" color="success" label="数据已同步" />
            <Button size="small" startIcon={<RefreshOutlined />} onClick={() => void refetch()} disabled={isFetching}>刷新</Button>
          </>
        }
      />

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
        <MetricCard label="进行中案件" value={String(metrics.openMatters)} hint={`已结案 ${metrics.closedMatters} 件`} icon={<GavelOutlined />} color="#1b365d" onClick={() => navigate('/matters')} />
        <MetricCard label="活跃客户" value={String(metrics.activeClients)} hint={`咨询线索 ${metrics.leads} 条`} icon={<PeopleOutline />} color="#2f7a55" onClick={() => navigate('/clients')} />
        <MetricCard label="待办事项" value={String(metrics.tasksDue)} hint="含逾期截止日期与庭审" icon={<CalendarMonthOutlined />} color="#b8860b" onClick={() => navigate('/calendar')} />
        <MetricCard label="本月收入" value={formatCurrency(metrics.revenueThisMonth, true)} hint={`应收 ${formatCurrency(metrics.outstandingAmount, true)}`} icon={<TrendingUpOutlined />} color="#b4443c" onClick={() => navigate('/reports')} />
        <MetricCard label="未开票工时" value={`${formatNumber(metrics.unbilledHours)} h`} hint={`可计费 ${formatCurrency(metrics.unbilledAmount, true)}`} icon={<ScheduleOutlined />} color="#2c6b8f" onClick={() => navigate('/billing')} />
        <MetricCard label="未结账单" value={String(metrics.outstandingInvoices)} hint={`应收 ${formatCurrency(metrics.outstandingAmount, true)}`} icon={<ReceiptLongOutlined />} color="#8a6808" onClick={() => navigate('/billing')} />
        <MetricCard label="信托余额" value={formatCurrency(metrics.trustBalance, true)} hint="客户预付款与代管款项" icon={<AccountBalanceOutlined />} color="#1b365d" onClick={() => navigate('/trust')} />
        <MetricCard label="新咨询线索" value={String(metrics.leads)} hint="待评估与转化" icon={<PersonOutline />} color="#b8860b" onClick={() => navigate('/leads')} />
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, mt: 2 }}>
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6">案件阶段分布</Typography>
            <Typography variant="caption" color="text.secondary">各阶段案件数量与标的金额</Typography>
            <Box sx={{ height: 270, mt: 1 }}>
              {mattersByStage.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mattersByStage} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf2" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: '#f4f6f8' }}
                      formatter={(value, _name, item) => [`${value ?? 0} 件 · ${formatCurrency(item.payload?.value ?? 0, true)}`, '案件']}
                      contentStyle={{ borderRadius: 6, border: '1px solid #dfe4ea', fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
                      {mattersByStage.map((stage) => <Cell key={stage.id} fill={stage.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState title="暂无案件数据" />}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6">任务类型</Typography>
            <Typography variant="caption" color="text.secondary">待办与庭审事项构成</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 270 }}>
              {pieData.length ? (
                <>
                  <Box sx={{ width: '48%', height: 210, minWidth: 110 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={76} paddingAngle={3} stroke="none">
                          {pieData.map((entry, index) => <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 6, border: '1px solid #dfe4ea', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {pieData.map((entry, index) => (
                      <Stack key={entry.name} direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: pieColors[index % pieColors.length] }} />
                        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>{entry.name}</Typography>
                        <Typography variant="caption" fontWeight={700}>{entry.value}</Typography>
                      </Stack>
                    ))}
                  </Box>
                </>
              ) : <Typography variant="body2" color="text.secondary" sx={{ width: '100%', textAlign: 'center' }}>暂无任务数据</Typography>}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, mt: 2 }}>
        <Card>
          <Box sx={{ px: 2, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="h6">收入趋势</Typography>
              <Typography variant="caption" color="text.secondary">按月统计已收款金额</Typography>
            </Box>
            <Button size="small" onClick={() => navigate('/reports')}>查看报表</Button>
          </Box>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ height: 230 }}>
              {revenueByMonth.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueByMonth} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf2" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${Math.round(value / 10000)}万`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 6, border: '1px solid #dfe4ea', fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" stroke="#b8860b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Typography variant="body2" color="text.secondary" sx={{ pt: 8, textAlign: 'center' }}>暂无收入数据</Typography>}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <Box sx={{ px: 2, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">近期任务</Typography>
            <Button size="small" onClick={() => navigate('/calendar')}>全部</Button>
          </Box>
          <CardContent sx={{ p: 1.5 }}>
            {upcomingTasks.length === 0 && <EmptyState title="暂无待办任务" />}
            {upcomingTasks.map((task) => {
              const overdue = task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <Box
                  key={task.id}
                  onClick={() => navigate(`/matters/${task.matterId ?? ''}`)}
                  sx={{ display: 'flex', gap: 1.25, p: 1, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
                >
                  <Avatar sx={{ width: 30, height: 30, bgcolor: overdue ? '#fdf0ef' : '#e8edf4', color: overdue ? '#b4443c' : '#1b365d', fontSize: 11 }}>
                    {task.type.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{task.title}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {taskTypeLabel(task.type)} · {formatDate(task.dueDate)}
                    </Typography>
                  </Box>
                  {overdue && <Chip size="small" color="error" variant="outlined" label="逾期" />}
                </Box>
              );
            })}
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mt: 2 }}>
        <Box sx={{ px: 2, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6">最近案件</Typography>
          <Button size="small" onClick={() => navigate('/matters')}>进入案件管理</Button>
        </Box>
        <Box>
          {recentMatters.map((matter) => (
            <Box
              key={matter.id}
              onClick={() => navigate(`/matters/${matter.id}`)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, cursor: 'pointer',
                borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 },
                '&:hover': { bgcolor: '#f8fafc' },
              }}
            >
              <Avatar sx={{ width: 34, height: 34, fontSize: 11, bgcolor: avatarColor(matter.title) }}>{initials(matter.title)}</Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{matter.title}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {matter.caseNumber || '未编号'} · {matter.practiceArea} · {matter.client?.name ?? `客户 #${matter.clientId}`}
                </Typography>
              </Box>
              <Chip size="small" variant="outlined" label={matter.stage?.name ?? `阶段 #${matter.stageId}`} />
              <Typography variant="body2" fontWeight={700} sx={{ width: 110, textAlign: 'right' }}>{formatCurrency(matter.value, true)}</Typography>
            </Box>
          ))}
          {recentMatters.length === 0 && <Box sx={{ p: 3 }}><EmptyState title="暂无案件" /></Box>}
        </Box>
      </Card>
    </Box>
  );
}

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import BriefcaseOutline from '@mui/icons-material/WorkOutline';
import CalendarClockOutlined from '@mui/icons-material/ScheduleOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import Refresh from '@mui/icons-material/Refresh';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { useDashboard } from '@/hooks/useCrm';
import { avatarColor, formatCurrency, formatDateTime, initials, todayLabel } from '@/lib/format';
import { activityMeta, dealStatusMeta } from '@/lib/meta';
import type { ActivityType } from '@/types';

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
        <Avatar sx={{ bgcolor: `${color}18`, color, width: 44, height: 44, mr: 2 }}>{icon}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 700 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{hint}</Typography>
        </Box>
      </ButtonBase>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading, isFetching, refetch } = useDashboard();
  const navigate = useNavigate();

  if (isLoading || !data) {
    return (
      <Box>
        <Skeleton variant="text" width={320} height={40} />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, mt: 2 }}>
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="rounded" height={110} />)}
        </Box>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, mt: 2 }}>
          <Skeleton variant="rounded" height={320} />
          <Skeleton variant="rounded" height={320} />
        </Box>
      </Box>
    );
  }

  const { metrics, dealsByStage, activitiesByType, recentDeals, upcomingActivities } = data;
  const pieData = activitiesByType.map((item) => ({
    name: activityMeta[item.type as ActivityType]?.label ?? item.type,
    value: item.count,
    color: activityMeta[item.type as ActivityType]?.color ?? '#706e6b',
  }));

  return (
    <Box>
      <PageHeader
        title="早上好，李明"
        subtitle={`${todayLabel()} · 这是你今天的销售工作台`}
        actions={
          <>
            <Chip size="small" color="success" variant="outlined" icon={<CheckCircleOutline />} label="数据实时同步" />
            <Button size="small" startIcon={<Refresh />} onClick={() => refetch()} disabled={isFetching}>刷新</Button>
          </>
        }
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
        <MetricCard label="进行中商机" value={String(metrics.openDeals)} hint={`预计金额 ${formatCurrency(metrics.pipelineValue, true)}`} icon={<BriefcaseOutline />} color="#0176d3" onClick={() => navigate('/opportunities')} />
        <MetricCard label="赢单金额" value={formatCurrency(metrics.wonValue, true)} hint={`已成交 ${metrics.wonDeals} 笔 · 胜率 ${metrics.winRate}%`} icon={<ArrowUpward />} color="#2e844a" onClick={() => navigate('/reports')} />
        <MetricCard label="待处理活动" value={String(metrics.activitiesDue)} hint="含今天到期及逾期任务" icon={<CalendarClockOutlined />} color="#c75a00" onClick={() => navigate('/activities')} />
        <MetricCard label="客户资源" value={String(metrics.contacts)} hint={`覆盖 ${metrics.companies} 家客户公司`} icon={<PeopleOutline />} color="#7060d8" onClick={() => navigate('/contacts')} />
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, mt: 2 }}>
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="h6">销售漏斗</Typography>
                <Typography variant="caption" color="text.secondary">各阶段商机数量与金额分布</Typography>
              </Box>
              <Button size="small" onClick={() => navigate('/opportunities')}>查看全部</Button>
            </Stack>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsByStage} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#706e6b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9a9a9a' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f7f7f7' }}
                    formatter={(value, name) => {
                      const stage = dealsByStage.find((item) => item.name === name);
                      return [`${value ?? 0} 笔 · ${formatCurrency(stage?.value ?? 0, true)}`, '商机'];
                    }}
                    contentStyle={{ borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    {dealsByStage.map((stage) => <Cell key={stage.id} fill={stage.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6">活动分布</Typography>
            <Typography variant="caption" color="text.secondary">全部跟进活动的类型占比</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 260 }}>
              {pieData.length ? (
                <>
                  <Box sx={{ width: '48%', height: 200, minWidth: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" innerRadius={52} outerRadius={76} paddingAngle={3} stroke="none">
                          {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {pieData.map((entry) => (
                      <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>{entry.name}</Typography>
                        <Typography variant="caption" fontWeight={700}>{entry.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ width: '100%', textAlign: 'center' }}>暂无活动数据</Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, mt: 2 }}>
        <Card>
          <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">最近商机</Typography>
            <Button size="small" onClick={() => navigate('/opportunities')}>进入商机看板</Button>
          </Box>
          <Box>
            {recentDeals.map((deal) => (
              <Box
                key={deal.id}
                onClick={() => navigate(`/opportunities/${deal.id}`)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.25, cursor: 'pointer', borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 }, '&:hover': { bgcolor: '#f7f7f7' } }}
              >
                <Avatar sx={{ width: 36, height: 36, fontSize: 12, bgcolor: avatarColor(deal.company?.name ?? deal.title) }}>
                  {initials(deal.company?.name ?? deal.title)}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>{deal.title}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {deal.company?.name ?? '未关联客户'} · {deal.contact?.name ?? '未关联联系人'}
                  </Typography>
                </Box>
                <Chip size="small" label={deal.stage.name} color={dealStatusMeta[deal.status].color} variant="outlined" />
                <Typography variant="body2" fontWeight={700} sx={{ width: 96, textAlign: 'right' }}>{formatCurrency(deal.value, true)}</Typography>
              </Box>
            ))}
            {recentDeals.length === 0 && <Typography sx={{ p: 3, textAlign: 'center' }} color="text.secondary">暂无商机</Typography>}
          </Box>
        </Card>

        <Card>
          <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">近期待办</Typography>
            <Button size="small" onClick={() => navigate('/activities')}>全部</Button>
          </Box>
          <CardContent sx={{ p: 1.5 }}>
            {upcomingActivities.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>暂无待办活动</Typography>}
            {upcomingActivities.map((activity) => {
              const meta = activityMeta[activity.type];
              const overdue = activity.dueDate && new Date(activity.dueDate) < new Date();
              return (
                <Box key={activity.id} sx={{ display: 'flex', gap: 1.25, p: 1, borderRadius: 1, '&:hover': { bgcolor: '#f7f7f7' } }}>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: meta.bg, color: meta.color }}><Box sx={{ fontSize: 14 }}>{activity.type === 'call' ? '电' : activity.type === 'email' ? '邮' : activity.type === 'meeting' ? '会' : activity.type === 'task' ? '任' : '止'}</Box></Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{activity.subject}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">{activity.deal?.title ?? activity.contact?.name ?? '未关联'}</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: overdue ? 'error.main' : 'text.secondary', whiteSpace: 'nowrap' }}>
                    {formatDateTime(activity.dueDate)}
                  </Typography>
                </Box>
              );
            })}
            {metrics.activitiesDue > 0 && (
              <Box sx={{ px: 1, pt: 1.5 }}>
                <LinearProgress variant="determinate" value={Math.min(100, metrics.activitiesDue * 10)} sx={{ height: 6, borderRadius: 3 }} />
                <Typography variant="caption" color="text.secondary">{metrics.activitiesDue} 项任务等待处理</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

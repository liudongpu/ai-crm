import { useState, type ReactNode } from 'react';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { useReports } from '@/hooks/useCrm';
import { formatCurrency } from '@/lib/format';
import { activityMeta, leadStatusMeta } from '@/lib/meta';
import type { ActivityType, LeadStatus } from '@/types';

const COLORS = ['#0176d3', '#2e844a', '#c75a00', '#7060d8', '#ba0517', '#057d8e'];

function StatCard({ label, value, hint, icon, color }: { label: string; value: string; hint: string; icon: ReactNode; color: string }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
        <Avatar sx={{ bgcolor: `${color}18`, color, width: 44, height: 44 }}>{icon}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{hint}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  const [days, setDays] = useState(90);
  const { data, isLoading } = useReports(days);

  if (isLoading || !data) {
    return (
      <Box>
        <Skeleton variant="text" width={280} height={40} />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, mt: 2 }}>
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="rounded" height={100} />)}
        </Box>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, mt: 2 }}>
          <Skeleton variant="rounded" height={340} /><Skeleton variant="rounded" height={340} />
        </Box>
      </Box>
    );
  }

  const { metrics, dealsByStage, wonByMonth, activitiesByType, dealsByOwner, leadsByStatus, topAccounts } = data;
  const pieData = activitiesByType.map((item) => ({
    name: activityMeta[item.type as ActivityType]?.label ?? item.type,
    value: item.count,
    color: activityMeta[item.type as ActivityType]?.color ?? COLORS[0],
  }));
  const leadData = leadsByStatus.map((item) => ({
    ...item,
    label: leadStatusMeta[item.status as LeadStatus]?.label ?? item.status,
  }));

  return (
    <Box>
      <PageHeader
        title="销售报表"
        subtitle="从商机、线索与活动多维角度分析销售表现"
        actions={
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={days} onChange={(event) => setDays(Number(event.target.value))}>
              <MenuItem value={30}>最近 30 天</MenuItem>
              <MenuItem value={90}>最近 90 天</MenuItem>
              <MenuItem value={365}>最近 12 个月</MenuItem>
            </Select>
          </FormControl>
        }
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
        <StatCard label="在途商机金额" value={formatCurrency(metrics.pipelineValue, true)} hint={`${metrics.openDeals} 个进行中商机`} icon={<TrendingUpOutlined />} color="#0176d3" />
        <StatCard label="赢单金额" value={formatCurrency(metrics.wonValue, true)} hint={`${metrics.wonDeals} 笔成交`} icon={<EmojiEventsOutlined />} color="#2e844a" />
        <StatCard label="商机胜率" value={`${metrics.winRate}%`} hint={`赢 ${metrics.wonDeals} / 输 ${metrics.lostDeals}`} icon={<AssessmentOutlined />} color="#7060d8" />
        <StatCard label="线索转化" value={String(metrics.convertedLeads)} hint={`共 ${metrics.leads} 条潜在客户`} icon={<AutoAwesomeOutlined />} color="#c75a00" />
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, mt: 2 }}>
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6">赢单金额趋势</Typography>
            <Typography variant="caption" color="text.secondary">按预计成交月份统计</Typography>
            <Box sx={{ height: 280, mt: 1 }}>
              {wonByMonth.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={wonByMonth} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wonGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0176d3" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0176d3" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecebea" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#706e6b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9a9a9a' }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${Math.round(value / 10000)}万`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" stroke="#0176d3" strokeWidth={2} fill="url(#wonGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ pt: 8, textAlign: 'center' }}>该时间段暂无赢单数据</Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6">销售漏斗</Typography>
            <Typography variant="caption" color="text.secondary">各阶段商机金额</Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsByStage} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9a9a9a' }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${Math.round(value / 10000)}万`} />
                  <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11, fill: '#706e6b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {dealsByStage.map((stage) => <Cell key={stage.id} fill={stage.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, mt: 2 }}>
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6">活动分布</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', height: 260 }}>
              {pieData.length ? (
                <>
                  <Box sx={{ width: '50%', height: 220 }}>
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
                      <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>{entry.name}</Typography>
                        <Typography variant="caption" fontWeight={700}>{entry.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : <Typography variant="body2" color="text.secondary" sx={{ width: '100%', textAlign: 'center' }}>暂无活动</Typography>}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6">负责人业绩</Typography>
            <Typography variant="caption" color="text.secondary">按联系人负责人关联商机统计</Typography>
            <Box sx={{ height: 260, mt: 1 }}>
              {dealsByOwner.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealsByOwner} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <XAxis dataKey="owner" tick={{ fontSize: 11, fill: '#706e6b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9a9a9a' }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${Math.round(value / 10000)}万`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 12 }} />
                    <Bar dataKey="value" fill="#0176d3" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Typography variant="body2" color="text.secondary" sx={{ pt: 8, textAlign: 'center' }}>暂无数据</Typography>}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6">潜在客户状态</Typography>
            <Typography variant="caption" color="text.secondary">线索管道概览</Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {leadData.map((item) => {
                const total = leadsByStatus.reduce((sum, row) => sum + row.count, 0) || 1;
                const percent = Math.round((item.count / total) * 100);
                return (
                  <Box key={item.status}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Chip size="small" variant="outlined" color={leadStatusMeta[item.status as LeadStatus]?.color} label={item.label} />
                      <Typography variant="caption" fontWeight={700}>{item.count} 条 · {percent}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={percent} color="primary" sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                );
              })}
              {!leadData.length && <Typography variant="body2" color="text.secondary">暂无潜在客户</Typography>}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mt: 2 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6">重点客户</Typography>
          <Typography variant="caption" color="text.secondary">按商机金额排名</Typography>
        </Box>
        <Table size="small">
          <TableHead><TableRow><TableCell>排名</TableCell><TableCell>客户名称</TableCell><TableCell align="right">商机数量</TableCell><TableCell align="right">商机金额</TableCell></TableRow></TableHead>
          <TableBody>
            {topAccounts.map((account, index) => (
              <TableRow key={account.name}>
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{account.name}</TableCell>
                <TableCell align="right">{account.deals}</TableCell>
                <TableCell align="right">{formatCurrency(account.value, true)}</TableCell>
              </TableRow>
            ))}
            {topAccounts.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>暂无数据</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => window.print()}>打印报表</Button>
      </Box>
    </Box>
  );
}

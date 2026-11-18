import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  Mail,
  Phone,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/useCrm';
import { avatarColor, cn, formatCurrency, initials } from '@/lib/utils';
import type { ActivityType } from '@/types';

const activityMeta: Record<ActivityType, { label: string; icon: typeof Phone; color: string }> = {
  call: { label: '电话', icon: Phone, color: '#0ea5e9' },
  email: { label: '邮件', icon: Mail, color: '#8b5cf6' },
  meeting: { label: '会议', icon: Users, color: '#f59e0b' },
  task: { label: '任务', icon: Target, color: '#16a34a' },
  deadline: { label: '截止', icon: CalendarClock, color: '#ef4444' },
};

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-4 p-5">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          <Skeleton className="h-80 rounded-xl xl:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const { metrics, dealsByStage, activitiesByType, recentDeals, upcomingActivities } = data;
  const pieData = activitiesByType.map((item) => ({
    name: activityMeta[item.type]?.label ?? item.type,
    value: item.count,
    color: activityMeta[item.type]?.color ?? '#94a3b8',
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">早上好，李明 👋</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            今天是 {format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN })}，下面是你的销售概况。
          </p>
        </div>
        <Badge variant="success" className="gap-1 px-3 py-1">
          <ArrowUpRight className="h-3.5 w-3.5" /> 数据实时同步
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="进行中交易"
          value={String(metrics.openDeals)}
          hint={`预计金额 ${formatCurrency(metrics.pipelineValue, true)}`}
          icon={BriefcaseBusiness}
          tone="bg-sky-50 text-sky-600"
        />
        <MetricCard
          label="赢单金额"
          value={formatCurrency(metrics.wonValue, true)}
          hint={`已成交 ${metrics.wonDeals} 笔 · 胜率 ${metrics.winRate}%`}
          icon={Trophy}
          tone="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="待处理活动"
          value={String(metrics.activitiesDue)}
          hint="包含今天到期及已逾期的任务"
          icon={CalendarClock}
          tone="bg-amber-50 text-amber-600"
        />
        <MetricCard
          label="客户资源"
          value={String(metrics.contacts)}
          hint={`覆盖 ${metrics.companies} 家公司`}
          icon={CircleDollarSign}
          tone="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>销售漏斗</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">各阶段交易数量与金额分布</p>
            </div>
            <Link to="/deals" className="text-xs font-medium text-primary hover:underline">
              查看全部 →
            </Link>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealsByStage} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7a90' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value, name) => {
                    const stage = dealsByStage.find((item) => item.name === name);
                    return [`${value ?? 0} 笔 · ${formatCurrency(stage?.value ?? 0, true)}`, '交易'];
                  }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e3e8ef', fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {dealsByStage.map((stage) => (
                    <Cell key={stage.id} fill={stage.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>活动分布</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">全部跟进活动的类型占比</p>
          </CardHeader>
          <CardContent className="flex h-72 items-center gap-2">
            {pieData.length ? (
              <>
                <div className="h-44 w-1/2 min-w-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e3e8ef', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                      <span className="flex-1 text-muted-foreground">{entry.name}</span>
                      <span className="font-semibold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="w-full text-center text-sm text-muted-foreground">暂无活动数据</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>最近交易</CardTitle>
            <Link to="/deals" className="text-xs font-medium text-primary hover:underline">
              进入交易看板 →
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <div className="divide-y">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold', avatarColor(deal.title))}>
                    {initials(deal.company?.name ?? deal.title)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{deal.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {deal.company?.name ?? '未关联公司'} · {deal.contact?.name ?? '未关联联系人'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      deal.status === 'won' ? 'success' : deal.status === 'lost' ? 'danger' : 'outline'
                    }
                  >
                    {deal.stage.name}
                  </Badge>
                  <span className="w-24 text-right text-sm font-semibold">{formatCurrency(deal.value, true)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>近期待办</CardTitle>
            <Link to="/activities" className="text-xs font-medium text-primary hover:underline">
              全部 →
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcomingActivities.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无待办活动</p>
            )}
            {upcomingActivities.map((activity) => {
              const meta = activityMeta[activity.type];
              const Icon = meta.icon;
              const isOverdue = activity.dueDate && new Date(activity.dueDate) < new Date();
              return (
                <div key={activity.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60">
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${meta.color}18`, color: meta.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{activity.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.deal?.title ?? activity.contact?.name ?? '未关联'}
                    </p>
                  </div>
                  {activity.dueDate && (
                    <span className={cn('shrink-0 text-[11px]', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                      {format(parseISO(activity.dueDate), 'M/d HH:mm')}
                    </span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

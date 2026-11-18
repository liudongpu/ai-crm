import { useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  ChevronDown,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useCrm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { to: '/', label: '概览', icon: LayoutDashboard },
  { to: '/deals', label: '交易', icon: BriefcaseBusiness },
  { to: '/contacts', label: '联系人', icon: Users },
  { to: '/companies', label: '公司', icon: Building2 },
  { to: '/activities', label: '活动', icon: CalendarCheck2 },
];

const pageTitles: Record<string, string> = {
  '/': '销售概览',
  '/deals': '交易管理',
  '/contacts': '联系人',
  '/companies': '公司',
  '/activities': '活动计划',
};

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useDashboard();
  const title = pageTitles[location.pathname] ?? 'AI CRM';
  const dueCount = data?.metrics.activitiesDue ?? 0;

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-wide">AI CRM</div>
          <div className="text-[10px] text-slate-400">销售增长平台</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">工作台</div>
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-white shadow-sm'
                  : 'text-slate-400 hover:bg-sidebar-accent/60 hover:text-white',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
            {to === '/activities' && dueCount > 0 && (
              <span className="ml-auto rounded-full bg-primary/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {dueCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-white">
            李
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">李明</div>
            <div className="truncate text-[11px] text-slate-400">销售经理</div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 md:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="关闭菜单"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

          <form
            className="ml-auto hidden w-64 lg:block"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(`/deals?search=${encodeURIComponent(search)}`);
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索交易、客户..."
                className="h-9 bg-secondary/60 pl-9"
              />
            </div>
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="ml-auto lg:ml-0">
                <Plus className="h-4 w-4" />
                新建
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>快速创建</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/deals?new=1')}>
                <BriefcaseBusiness /> 新交易
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/contacts?new=1')}>
                <Users /> 新联系人
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/companies?new=1')}>
                <Building2 /> 新公司
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/activities?new=1')}>
                <CalendarCheck2 /> 新活动
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/activities')}>
            <Bell className="h-[18px] w-[18px]" />
            {dueCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-white" />
            )}
          </Button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
            李
          </div>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

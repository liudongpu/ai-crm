import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import ExtensionOutlined from '@mui/icons-material/ExtensionOutlined';
import GavelOutlined from '@mui/icons-material/Gavel';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import PersonOutline from '@mui/icons-material/PersonOutline';
import PsychologyOutlined from '@mui/icons-material/PsychologyOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useDashboard, useFeatureCatalog, useInbox, useSearch, useUsers } from '@/hooks/useCrm';
import { recordPath, useRecent, type RecentType } from '@/hooks/useRecent';
import { avatarColor, initials } from '@/lib/format';
import { moduleHref, resolveNavigation, type Navigation } from '@/lib/navigation';

/** One icon per primary module; reused by both the top tabs and the sidebar. */
const moduleIcons: Record<string, ReactElement> = {
  grow: <PersonOutline fontSize="small" />,
  manage: <GavelOutlined fontSize="small" />,
  calendar: <CalendarMonthOutlined fontSize="small" />,
  draft: <DescriptionOutlined fontSize="small" />,
  communicate: <EmailOutlined fontSize="small" />,
  billing: <ReceiptLongOutlined fontSize="small" />,
  accounting: <AccountBalanceOutlined fontSize="small" />,
  work_ai: <PsychologyOutlined fontSize="small" />,
  reports: <BarChartOutlined fontSize="small" />,
  automation: <AutoAwesomeOutlined fontSize="small" />,
  integrations: <ExtensionOutlined fontSize="small" />,
  security: <SecurityOutlined fontSize="small" />,
};

const createMenu = [
  { label: '新案件', to: '/matters?new=1' },
  { label: '新客户', to: '/clients?new=1' },
  { label: '新联系人', to: '/contacts?new=1' },
  { label: '新咨询线索', to: '/leads?new=1' },
  { label: '新任务', to: '/tasks?new=1' },
  { label: '新文档', to: '/documents?new=1' },
  { label: '新账单', to: '/billing?new=1' },
  { label: '新信托交易', to: '/trust?new=1' },
  { label: '新沟通记录', to: '/communications?new=1' },
];

const recentIcons: Record<RecentType, ReactNode> = {
  matter: <GavelOutlined fontSize="small" />,
  client: <AccountBalanceOutlined fontSize="small" />,
  contact: <PeopleOutline fontSize="small" />,
  lead: <PersonOutline fontSize="small" />,
  document: <DescriptionOutlined fontSize="small" />,
};

type SearchItem = {
  id: number;
  name?: string | null;
  title?: string | null;
  company?: string | null;
  email?: string | null;
};

function GlobalSearch() {
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useSearch(query);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(value.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [value]);

  const groups: Array<{ label: string; items: SearchItem[]; to: (item: SearchItem) => string }> = [
    { label: '案件', items: data?.matters ?? [], to: (item) => `/matters/${item.id}` },
    { label: '客户', items: data?.clients ?? [], to: (item) => `/clients/${item.id}` },
    { label: '联系人', items: data?.contacts ?? [], to: (item) => `/contacts/${item.id}` },
    { label: '咨询线索', items: data?.leads ?? [], to: (item) => `/leads/${item.id}` },
    { label: '文档', items: data?.documents ?? [], to: (item) => `/documents?q=${encodeURIComponent(item.title ?? '')}` },
  ];
  const hasResults = groups.some((group) => group.items.length > 0);

  const go = (to: string) => {
    navigate(to);
    setOpen(false);
    setValue('');
    setQuery('');
  };

  const firstResult = groups.find((group) => group.items.length > 0);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative', width: { xs: 170, sm: 260, md: 380 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            height: 36,
            px: 1.5,
            bgcolor: 'rgba(255,255,255,.14)',
            border: '1px solid rgba(255,255,255,.14)',
            borderRadius: 1,
            '&:focus-within': { bgcolor: 'rgba(255,255,255,.22)', borderColor: 'rgba(255,255,255,.35)' },
          }}
        >
          <SearchIcon sx={{ fontSize: 18, opacity: 0.85 }} />
          <InputBase
            value={value}
            onChange={(event) => { setValue(event.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && firstResult) go(firstResult.to(firstResult.items[0]));
              if (event.key === 'Escape') setOpen(false);
            }}
            placeholder="搜索案件、客户、联系人、文档..."
            inputProps={{ 'aria-label': '全局搜索' }}
            sx={{ color: '#fff', fontSize: 13, flex: 1, '& input::placeholder': { color: 'rgba(255,255,255,.7)', opacity: 1 } }}
          />
          {isFetching && <CircularProgress size={14} sx={{ color: '#fff' }} />}
        </Box>

        {open && value.trim().length > 0 && (
          <Paper sx={{ position: 'absolute', top: 42, left: 0, width: '100%', maxHeight: 460, overflowY: 'auto', zIndex: 30, py: 1 }}>
            {!hasResults && !isFetching && (
              <Typography sx={{ px: 2, py: 2 }} color="text.secondary" variant="body2">没有找到匹配结果</Typography>
            )}
            {groups.map((group) =>
              group.items.length ? (
                <Box key={group.label}>
                  <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.75, display: 'block', fontWeight: 700 }}>
                    {group.label}
                  </Typography>
                  <List dense disablePadding>
                    {group.items.map((item) => (
                      <ListItemButton key={item.id} onClick={() => go(group.to(item))}>
                        <ListItemIcon sx={{ minWidth: 34 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: '#e8edf4', color: 'primary.main' }}>
                            {initials(item.name ?? item.title)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name ?? item.title ?? '（未命名）'}
                          secondary={item.company ?? item.email ?? ''}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 600, noWrap: true }}
                          secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                  <Divider />
                </Box>
              ) : null,
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}

function SidebarContent({
  active,
  catalogError,
  onNavigate,
}: {
  active: Navigation;
  catalogError: boolean;
  onNavigate?: () => void;
}) {
  const recent = useRecent();
  const features = active.module
    ? [...active.module.features].sort((a, b) => a.position - b.position)
    : [];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f9fafb' }}>
      <Box sx={{ p: 1.5, overflowY: 'auto' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.6, px: 1 }}>
          {active.module?.name ?? '功能导航'}
        </Typography>
        <List dense disablePadding sx={{ mt: 0.5 }}>
          {features.map((feature) => (
            <ListItemButton
              key={feature.code}
              component={RouterLink}
              to={feature.route}
              onClick={onNavigate}
              selected={active.feature?.code === feature.code}
              sx={{ borderRadius: 1, mb: 0.25, py: 0.6, '&.Mui-selected': { bgcolor: '#e8edf4', color: 'primary.main' } }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                {moduleIcons[active.module?.code ?? ''] ?? <GavelOutlined fontSize="small" />}
              </ListItemIcon>
              <ListItemText primary={feature.name} primaryTypographyProps={{ variant: 'body2', noWrap: true }} />
            </ListItemButton>
          ))}
          {catalogError && (
            <Typography variant="caption" color="error" sx={{ px: 1, display: 'block', py: 1 }}>
              功能目录加载失败，请刷新重试
            </Typography>
          )}
          {!catalogError && features.length === 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ px: 1, display: 'block', py: 1 }}>
              暂无二级功能
            </Typography>
          )}
        </List>

        <Divider sx={{ my: 1.5 }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.6, px: 1 }}>
          最近浏览
        </Typography>
        <List dense disablePadding sx={{ mt: 0.5 }}>
          {recent.length === 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ px: 1, display: 'block', py: 1 }}>
              暂无浏览记录
            </Typography>
          )}
          {recent.map((item) => (
            <ListItemButton
              key={`${item.type}-${item.id}`}
              component={RouterLink}
              to={recordPath(item.type, item.id)}
              onClick={onNavigate}
              sx={{ borderRadius: 1, mb: 0.25, py: 0.6 }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>{recentIcons[item.type]}</ListItemIcon>
              <ListItemText primary={item.title} primaryTypographyProps={{ variant: 'body2', noWrap: true }} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: dashboard } = useDashboard();
  const { data: users } = useUsers();
  const { data: catalog, isError: catalogError } = useFeatureCatalog();
  const modules = useMemo(
    () => [...(catalog ?? [])].sort((a, b) => a.position - b.position),
    [catalog],
  );
  const active = useMemo(
    () => resolveNavigation(modules, location.pathname, location.search),
    [modules, location.pathname, location.search],
  );
  const currentUser = users?.[0];
  const dueCount = dashboard?.metrics.tasksDue ?? 0;
  const { data: inbox } = useInbox();
  const unreadCount = useMemo(() => (inbox ?? []).reduce((sum, conversation) => sum + conversation.unread, 0), [inbox]);
  const [createAnchor, setCreateAnchor] = useState<HTMLElement | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.main', height: 56 }}>
        <Toolbar variant="dense" sx={{ minHeight: '56px !important', gap: 1.5 }}>
          <ButtonBase onClick={() => navigate('/')} sx={{ color: 'inherit', mr: 1, borderRadius: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <GavelOutlined sx={{ fontSize: 22, color: '#d4af37' }} />
              <Typography sx={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', letterSpacing: 0.2 }}>
                LexDesk <Box component="span" sx={{ color: '#d4af37' }}>·</Box> 律所管理平台
              </Typography>
            </Stack>
          </ButtonBase>
          <GlobalSearch />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="快速新建">
            <IconButton color="inherit" aria-label="快速新建" onClick={(event) => setCreateAnchor(event.currentTarget)}><AddOutlined /></IconButton>
          </Tooltip>
          <Tooltip title={`沟通中心 · ${unreadCount} 条未读`}>
            <IconButton color="inherit" aria-label="沟通中心" onClick={() => navigate('/communications')}>
              <Badge badgeContent={unreadCount} color="error" max={99}><EmailOutlined /></Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="待办提醒">
            <IconButton color="inherit" aria-label="待办提醒" onClick={() => navigate('/calendar')}>
              <Badge badgeContent={dueCount} color="error" max={99}><NotificationsNone /></Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="用户菜单">
            <IconButton color="inherit" aria-label="用户菜单" onClick={(event) => setProfileAnchor(event.currentTarget)}>
              <Avatar sx={{ width: 30, height: 30, fontSize: 11, bgcolor: '#d4af37', color: '#1b365d' }}>
                {initials(currentUser?.name ?? '律师')}
              </Avatar>
            </IconButton>
          </Tooltip>
          <IconButton color="inherit" aria-label="打开导航" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Paper square elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 56, zIndex: 10 }}>
        <Tabs
          value={active.module?.code ?? ''}
          variant="scrollable"
          scrollButtons="auto"
          onChange={(_, value: string) => {
            const target = modules.find((module) => module.code === value);
            if (target) navigate(moduleHref(target));
          }}
          sx={{ px: { md: 2 } }}
        >
          {modules.map((module) => (
            <Tab
              key={module.code}
              value={module.code}
              label={module.name}
              icon={moduleIcons[module.code] ?? <GavelOutlined fontSize="small" />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      <Menu anchorEl={createAnchor} open={Boolean(createAnchor)} onClose={() => setCreateAnchor(null)}>
        {createMenu.map((item) => (
          <MenuItem key={item.to} onClick={() => { navigate(item.to); setCreateAnchor(null); }}>
            <AddOutlined fontSize="small" sx={{ mr: 1.5, color: 'secondary.main' }} />{item.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}>
        <MenuItem disabled>
          <Avatar sx={{ width: 24, height: 24, fontSize: 10, mr: 1.5, bgcolor: avatarColor(currentUser?.name ?? '律师') }}>
            {initials(currentUser?.name ?? '律师')}
          </Avatar>
          {currentUser?.name ?? 'LexDesk 用户'} · {currentUser?.title ?? '律所成员'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { navigate('/calendar'); setProfileAnchor(null); }}><CalendarMonthOutlined fontSize="small" sx={{ mr: 1.5 }} />我的待办</MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); setProfileAnchor(null); }}><SettingsOutlined fontSize="small" sx={{ mr: 1.5 }} />系统设置</MenuItem>
      </Menu>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' } }} PaperProps={{ sx: { width: 240 } }}>
        <SidebarContent active={active} catalogError={catalogError} onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <Box
          component="aside"
          sx={{
            width: 220,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            display: { xs: 'none', md: 'block' },
            minHeight: 'calc(100vh - 100px)',
          }}
        >
          <SidebarContent active={active} catalogError={catalogError} />
        </Box>
        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 1.5, md: 2.5 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

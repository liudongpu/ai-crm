import { useEffect, useState, type ReactNode } from 'react';
import AppsIcon from '@mui/icons-material/Apps';
import AddOutlined from '@mui/icons-material/AddOutlined';
import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import CloudOutlined from '@mui/icons-material/CloudOutlined';
import ContactSupportOutlined from '@mui/icons-material/ContactSupportOutlined';
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import HelpOutline from '@mui/icons-material/HelpOutline';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import PersonOutline from '@mui/icons-material/PersonOutline';
import SearchIcon from '@mui/icons-material/Search';
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined';
import WorkOutline from '@mui/icons-material/WorkOutline';
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
import { useDashboard, useSearch } from '@/hooks/useCrm';
import { recordPath, useRecent, type RecentType } from '@/hooks/useRecent';

const tabs = [
  { value: '/', label: '首页', icon: <HomeOutlined fontSize="small" /> },
  { value: '/accounts', label: '客户', icon: <WorkOutline fontSize="small" /> },
  { value: '/contacts', label: '联系人', icon: <PeopleOutline fontSize="small" /> },
  { value: '/leads', label: '潜在客户', icon: <PersonOutline fontSize="small" /> },
  { value: '/opportunities', label: '商机', icon: <ViewKanbanOutlined fontSize="small" /> },
  { value: '/activities', label: '活动', icon: <EventNoteOutlined fontSize="small" /> },
  { value: '/reports', label: '报表', icon: <BarChartOutlined fontSize="small" /> },
];

const createMenu = [
  { label: '新客户', to: '/accounts?new=1' },
  { label: '新联系人', to: '/contacts?new=1' },
  { label: '新潜在客户', to: '/leads?new=1' },
  { label: '新商机', to: '/opportunities?new=1' },
  { label: '新活动', to: '/activities?new=1' },
];

const recentIcons: Record<RecentType, ReactNode> = {
  account: <WorkOutline fontSize="small" />,
  contact: <PeopleOutline fontSize="small" />,
  lead: <PersonOutline fontSize="small" />,
  opportunity: <ViewKanbanOutlined fontSize="small" />,
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

  const groups = [
    { label: '客户', items: data?.accounts ?? [], to: (id: number) => `/accounts/${id}` },
    { label: '联系人', items: data?.contacts ?? [], to: (id: number) => `/contacts/${id}` },
    { label: '潜在客户', items: data?.leads ?? [], to: (id: number) => `/leads/${id}` },
    { label: '商机', items: data?.opportunities ?? [], to: (id: number) => `/opportunities/${id}` },
  ];
  const hasResults = groups.some((group) => group.items.length > 0);
  const go = (to: string) => {
    navigate(to);
    setOpen(false);
    setValue('');
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative', width: { xs: 180, sm: 280, md: 400 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 36, px: 1.5, bgcolor: 'rgba(255,255,255,.16)', borderRadius: 1, '&:focus-within': { bgcolor: 'rgba(255,255,255,.26)' } }}>
          <SearchIcon sx={{ fontSize: 18, opacity: 0.85 }} />
          <InputBase
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && hasResults) go(groups.find((group) => group.items.length > 0)!.to(groups.find((group) => group.items.length > 0)!.items[0].id));
              if (event.key === 'Escape') setOpen(false);
            }}
            placeholder="搜索客户、联系人、商机..."
            inputProps={{ 'aria-label': '全局搜索' }}
            sx={{ color: '#fff', fontSize: 13, flex: 1, '& input::placeholder': { color: 'rgba(255,255,255,.7)', opacity: 1 } }}
          />
          {isFetching && <CircularProgress size={14} sx={{ color: '#fff' }} />}
        </Box>

        {open && value.trim() && (
          <Paper sx={{ position: 'absolute', top: 42, left: 0, width: '100%', maxHeight: 460, overflowY: 'auto', zIndex: 30, py: 1 }}>
            {!hasResults && !isFetching && <Typography sx={{ px: 2, py: 2 }} color="text.secondary" variant="body2">没有找到匹配结果</Typography>}
            {groups.map((group) =>
              group.items.length ? (
                <Box key={group.label}>
                  <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.75, display: 'block', fontWeight: 700 }}>
                    {group.label}
                  </Typography>
                  <List dense disablePadding>
                    {group.items.map((item) => (
                      <ListItemButton key={item.id} onClick={() => go(group.to(item.id))}>
                        <ListItemIcon sx={{ minWidth: 34 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: '#e8f4ff', color: 'primary.main' }}>
                            {(item as { name?: string; title?: string }).name?.slice(0, 1) ?? (item as { title?: string }).title?.slice(0, 1) ?? '?'}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={(item as { name?: string; title?: string }).name ?? (item as { title?: string }).title}
                          secondary={(item as { company?: string; email?: string }).company ?? (item as { email?: string }).email ?? ''}
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const recent = useRecent();
  const shortcuts = [
    { label: '商机看板', to: '/opportunities', icon: <ViewKanbanOutlined fontSize="small" /> },
    { label: '活动日历', to: '/activities', icon: <CalendarMonthOutlined fontSize="small" /> },
    { label: '销售报表', to: '/reports', icon: <BarChartOutlined fontSize="small" /> },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f7f7f7' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>导航面板</Typography>
        <List dense disablePadding sx={{ mt: 1 }}>
          {shortcuts.map((item) => (
            <ListItemButton key={item.label} component={RouterLink} to={item.to} onClick={onNavigate} sx={{ borderRadius: 1, mb: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 34, color: 'primary.main' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
          ))}
        </List>

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, mt: 2, display: 'block' }}>最近浏览</Typography>
        <List dense disablePadding sx={{ mt: 1 }}>
          {recent.length === 0 && <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>暂无浏览记录</Typography>}
          {recent.map((item) => (
            <ListItemButton
              key={`${item.type}-${item.id}`}
              component={RouterLink}
              to={recordPath(item.type, item.id)}
              onClick={onNavigate}
              sx={{ borderRadius: 1, mb: 0.25 }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}>{recentIcons[item.type]}</ListItemIcon>
              <ListItemText primary={item.title} primaryTypographyProps={{ variant: 'body2', noWrap: true }} />
            </ListItemButton>
          ))}
        </List>
      </Box>
      <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 30, height: 30, bgcolor: '#0176d3', fontSize: 12 }}>李明</Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>李明</Typography>
            <Typography variant="caption" color="text.secondary">销售经理 · 销售团队</Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useDashboard();
  const dueCount = data?.metrics.activitiesDue ?? 0;
  const [appAnchor, setAppAnchor] = useState<HTMLElement | null>(null);
  const [createAnchor, setCreateAnchor] = useState<HTMLElement | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeTab = tabs.find((tab) => tab.value !== '/' && location.pathname.startsWith(tab.value))?.value ?? '/';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#032d60', height: 56 }}>
        <Toolbar variant="dense" sx={{ minHeight: '56px !important', gap: 1 }}>
          <Tooltip title="应用启动器">
            <IconButton color="inherit" aria-label="应用启动器" onClick={(event) => setAppAnchor(event.currentTarget)}>
              <AppsIcon />
            </IconButton>
          </Tooltip>
          <ButtonBase onClick={() => navigate('/')} sx={{ color: 'inherit', mr: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CloudOutlined sx={{ fontSize: 24 }} />
              <Typography sx={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>AI CRM</Typography>
            </Stack>
          </ButtonBase>
          <GlobalSearch />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="快速新建">
            <IconButton color="inherit" aria-label="快速新建" onClick={(event) => setCreateAnchor(event.currentTarget)}><AddOutlined /></IconButton>
          </Tooltip>
          <Tooltip title="帮助">
            <IconButton color="inherit" aria-label="帮助" onClick={() => setProfileAnchor(null)}><HelpOutline /></IconButton>
          </Tooltip>
          <Tooltip title="待办提醒">
            <IconButton color="inherit" aria-label="待办提醒" onClick={() => navigate('/activities')}>
              <Badge badgeContent={dueCount} color="error"><NotificationsNone /></Badge>
            </IconButton>
          </Tooltip>
          <IconButton color="inherit" aria-label="用户菜单" onClick={(event) => setProfileAnchor(event.currentTarget)} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            <Avatar sx={{ width: 30, height: 30, bgcolor: '#0b6fb5', fontSize: 12 }}>李明</Avatar>
          </IconButton>
          <IconButton color="inherit" aria-label="打开菜单" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Paper square elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 56, zIndex: 10 }}>
        <Tabs
          value={activeTab}
          variant="scrollable"
          scrollButtons="auto"
          onChange={(_, value) => navigate(value)}
          sx={{ px: { md: 2 } }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} icon={tab.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Paper>

      <Menu anchorEl={appAnchor} open={Boolean(appAnchor)} onClose={() => setAppAnchor(null)}>
        {tabs.map((tab) => (
          <MenuItem key={tab.value} onClick={() => { navigate(tab.value); setAppAnchor(null); }}>
            <ListItemIcon sx={{ minWidth: 32 }}>{tab.icon}</ListItemIcon>{tab.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={createAnchor} open={Boolean(createAnchor)} onClose={() => setCreateAnchor(null)}>
        {createMenu.map((item) => (
          <MenuItem key={item.to} onClick={() => { navigate(item.to); setCreateAnchor(null); }}>
            <AddOutlined fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />{item.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}>
        <MenuItem disabled><ContactSupportOutlined fontSize="small" sx={{ mr: 1.5 }} />李明 · 销售经理</MenuItem>
        <Divider />
        <MenuItem onClick={() => { navigate('/reports'); setProfileAnchor(null); }}><BarChartOutlined fontSize="small" sx={{ mr: 1.5 }} />我的报表</MenuItem>
        <MenuItem onClick={() => { navigate('/activities'); setProfileAnchor(null); }}><EventNoteOutlined fontSize="small" sx={{ mr: 1.5 }} />我的待办</MenuItem>
      </Menu>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' } }} PaperProps={{ sx: { width: 240 } }}>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <Box component="aside" sx={{ width: 220, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'block' }, minHeight: 'calc(100vh - 108px)' }}>
          <SidebarContent />
        </Box>
        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 1.5, md: 2.5 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

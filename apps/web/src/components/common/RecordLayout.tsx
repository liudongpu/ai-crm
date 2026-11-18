import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';

export type Crumb = { label: string; to?: string };

export function RecordLayout({
  crumbs,
  title,
  subtitle,
  icon,
  chips,
  actions,
  tabs,
  tab,
  onTabChange,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  chips?: ReactNode;
  actions?: ReactNode;
  tabs?: Array<{ label: string; value: string }>;
  tab?: string;
  onTabChange?: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Box>
      <Breadcrumbs separator="›" aria-label="面包屑" sx={{ mb: 1.5, fontSize: 12 }}>
        {crumbs.map((crumb, index) =>
          crumb.to ? (
            <Link
              key={`${crumb.label}-${index}`}
              component={RouterLink}
              to={crumb.to}
              underline="hover"
              color="text.secondary"
              variant="body2"
            >
              {crumb.label}
            </Link>
          ) : (
            <Typography key={`${crumb.label}-${index}`} variant="body2" color="text.primary">
              {crumb.label}
            </Typography>
          ),
        )}
      </Breadcrumbs>

      <Paper sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, flexWrap: 'wrap' }}>
          {icon && (
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 1,
                bgcolor: '#e8edf4',
                color: 'primary.main',
                display: 'grid',
                placeItems: 'center',
                '& svg': { fontSize: 25 },
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ flexGrow: 1, minWidth: 200 }}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
              <Typography variant="h5" component="h1">{title}</Typography>
              {chips}
            </Stack>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>{actions}</Stack>
        </Box>
        {tabs && (
          <Box sx={{ px: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Tabs
              value={tab ?? tabs[0]?.value}
              onChange={(_, value: string) => onTabChange?.(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabs.map((item) => <Tab key={item.value} value={item.value} label={item.label} />)}
            </Tabs>
          </Box>
        )}
      </Paper>

      {children}
    </Box>
  );
}

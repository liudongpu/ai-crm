import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useActivities, useUpdateActivity } from '@/hooks/useCrm';
import { activityMeta } from '@/lib/meta';
import { formatDateTime } from '@/lib/format';
import type { Activity } from '@/types';

export function ActivitiesPanel({
  dealId,
  contactId,
  accountId,
}: {
  dealId?: number;
  contactId?: number;
  accountId?: number;
}) {
  const { data: activities, isLoading } = useActivities();
  const updateActivity = useUpdateActivity();
  const related = (activities ?? []).filter((activity: Activity) => {
    if (dealId && activity.dealId === dealId) return true;
    if (contactId && activity.contactId === contactId) return true;
    if (accountId && (activity.deal?.companyId === accountId || activity.contact?.companyId === accountId)) return true;
    return false;
  });

  const query = dealId ? `dealId=${dealId}` : contactId ? `contactId=${contactId}` : accountId ? `accountId=${accountId}` : '';
  const due = related.filter((item) => !item.done).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          共 {related.length} 条活动，{due} 条待办
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddOutlined />}
          component={RouterLink}
          to={`/activities?new=1${query ? `&${query}` : ''}`}
        >
          新建活动
        </Button>
      </Box>

      {isLoading && <Typography variant="body2" color="text.secondary">加载中...</Typography>}
      {!isLoading && related.length === 0 && (
        <Paper sx={{ borderStyle: 'dashed', textAlign: 'center', py: 5 }}>
          <Typography color="text.secondary">暂无相关活动</Typography>
        </Paper>
      )}

      <Paper sx={{ overflow: 'hidden' }}>
        {related.map((activity) => {
          const meta = activityMeta[activity.type];
          return (
            <Box key={activity.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
              <Checkbox
                size="small"
                checked={activity.done}
                onChange={(event) => updateActivity.mutate({ id: activity.id, data: { done: event.target.checked } })}
              />
              <Chip size="small" label={meta.label} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600 }} />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, textDecoration: activity.done ? 'line-through' : 'none', color: activity.done ? 'text.disabled' : 'text.primary' }}>
                  {activity.subject}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activity.deal?.title ?? activity.contact?.name ?? '未关联'} · {formatDateTime(activity.dueDate)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Paper>
    </Box>
  );
}

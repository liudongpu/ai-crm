import type { ChipProps } from '@mui/material/Chip';
import type { ActivityType, LeadRating, LeadStatus } from '@/types';

type ChipColor = NonNullable<ChipProps['color']>;

export const activityMeta: Record<ActivityType, { label: string; color: string; bg: string }> = {
  call: { label: '电话', color: '#0176d3', bg: '#e8f4ff' },
  email: { label: '邮件', color: '#7060d8', bg: '#f0edff' },
  meeting: { label: '会议', color: '#a55100', bg: '#fff3e0' },
  task: { label: '任务', color: '#2e844a', bg: '#e7f5ec' },
  deadline: { label: '截止', color: '#ba0517', bg: '#fdecef' },
};

export const leadStatusMeta: Record<LeadStatus, { label: string; color: ChipColor }> = {
  new: { label: '新建', color: 'primary' },
  working: { label: '跟进中', color: 'info' },
  qualified: { label: '已验证', color: 'warning' },
  converted: { label: '已转换', color: 'success' },
  unqualified: { label: '不合格', color: 'error' },
};

export const leadRatingMeta: Record<LeadRating, { label: string; color: string }> = {
  hot: { label: '高意向', color: '#ba0517' },
  warm: { label: '中意向', color: '#c75a00' },
  cold: { label: '低意向', color: '#0176d3' },
};

export const priorityMeta: Record<'low' | 'medium' | 'high', { label: string; color: ChipColor }> = {
  low: { label: '低', color: 'default' },
  medium: { label: '中', color: 'warning' },
  high: { label: '高', color: 'error' },
};

export const dealStatusMeta: Record<'open' | 'won' | 'lost', { label: string; color: ChipColor }> = {
  open: { label: '进行中', color: 'info' },
  won: { label: '赢单', color: 'success' },
  lost: { label: '输单', color: 'error' },
};

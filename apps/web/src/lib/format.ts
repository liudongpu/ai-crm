import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatCurrency(value: number, compact = false) {
  if (compact && Math.abs(value) >= 10000) {
    return `¥${(value / 10000).toFixed(value % 10000 === 0 ? 0 : 1)}万`;
  }
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  '#2e844a',
  '#0176d3',
  '#9060d8',
  '#c75a00',
  '#ba0517',
  '#057d8e',
];

export function avatarColor(seed: string) {
  const sum = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function formatDate(value?: string | null, pattern = 'yyyy-MM-dd') {
  if (!value) return '—';
  try {
    return format(parseISO(value), pattern);
  } catch {
    return value;
  }
}

export function formatDateTime(value?: string | null) {
  return formatDate(value, 'M月d日 HH:mm');
}

export function todayLabel() {
  return format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN });
}

export function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const date = parseISO(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

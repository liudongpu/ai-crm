import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatCurrency(value: number | null | undefined, compact = false) {
  const amount = value ?? 0;
  if (compact && Math.abs(amount) >= 10000) {
    return `¥${(amount / 10000).toFixed(amount % 10000 === 0 ? 0 : 1)}万`;
  }
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number | null | undefined, digits = 1) {
  return (value ?? 0).toFixed(digits).replace(/\.0+$/, '');
}

export function initials(name: string | null | undefined) {
  return (name ?? '').trim().slice(0, 2).toUpperCase() || '?';
}

const AVATAR_COLORS = ['#1b365d', '#2f7a55', '#8a6808', '#5a5f9e', '#b4443c', '#2c6b8f'];

export function avatarColor(seed: string | null | undefined) {
  const key = seed ?? '';
  const sum = [...key].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  try {
    const parsed = typeof value === 'string' ? parseISO(value) : value;
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export function formatDate(value?: string | null, pattern = 'yyyy-MM-dd') {
  const parsed = parseDate(value);
  return parsed ? format(parsed, pattern) : '—';
}

export function formatDateTime(value?: string | null) {
  return formatDate(value, 'yyyy-MM-dd HH:mm');
}

export function formatShortDate(value?: string | null) {
  return formatDate(value, 'M月d日');
}

export function todayLabel() {
  return format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN });
}

/** Value for a datetime-local input, in the browser's local timezone. */
export function toLocalInput(iso?: string | null) {
  const parsed = parseDate(iso);
  if (!parsed) return '';
  const shifted = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

/** Value for a date input. */
export function toDateInput(iso?: string | null) {
  const parsed = parseDate(iso);
  return parsed ? format(parsed, 'yyyy-MM-dd') : '';
}

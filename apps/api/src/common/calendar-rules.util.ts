/** 期限规则计算相关的纯函数，不依赖 NestJS / 数据库。 */

export interface CourtRuleStep {
  code: string;
  label: string;
  offsetDays: number;
  base?: string;
  businessDays?: boolean;
}

export interface DeadlineItem {
  code: string;
  label: string;
  offsetDays: number;
  base: string;
  rawDate: string;
  dueDate: string;
  adjusted: boolean;
  holidayAdjusted: boolean;
  taskId?: number | null;
}

export interface DeadlineRuleLike {
  code?: string;
  name?: string;
  steps: CourtRuleStep[];
}

export type CalendarHolidayLike = string | { date: string };

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** 本地日期的 yyyy-MM-dd，用于与法院节假日字符串比较。 */
export function toDateKey(date: Date): string {
  const value = toDate(date);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function toDate(value: Date | string): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}

/** 日期加减天数（保留原有时分秒）。 */
export function addDays(date: Date | string, days: number): Date {
  const result = toDate(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isHoliday(date: Date, holidays: CalendarHolidayLike[] = []): boolean {
  const key = toDateKey(date);
  return holidays.some((holiday) => (typeof holiday === 'string' ? holiday : holiday.date) === key);
}

/** 是否为工作日：非周末且不在法院节假日列表中。 */
export function isBusinessDay(date: Date, holidays: CalendarHolidayLike[] = []): boolean {
  const day = toDate(date).getDay();
  return day !== 0 && day !== 6 && !isHoliday(date, holidays);
}

/** 生成当天 23:59:00 的 ISO 字符串。 */
export function toIsoEndOfDay(date: Date | string): string {
  const value = toDate(date);
  value.setHours(23, 59, 0, 0);
  return value.toISOString();
}

/**
 * 按规则步骤生成期限链。
 * base 为 'trigger'（默认）时使用触发日，否则取前序步骤的 rawDate/dueDate；
 * businessDays 为 true 时按偏移方向跳过周末与法院节假日。
 */
export function computeDeadlineItems(
  rule: DeadlineRuleLike,
  triggerDate: Date | string,
  existingItems: DeadlineItem[] = [],
  holidays: CalendarHolidayLike[] = [],
): DeadlineItem[] {
  const trigger = toDate(triggerDate);
  const byCode = new Map<string, Date>();
  const previous = new Map<string, DeadlineItem>();
  for (const item of existingItems ?? []) {
    if (item?.code) previous.set(item.code, item);
  }

  const items: DeadlineItem[] = [];
  for (const step of rule.steps ?? []) {
    const base = step.base || 'trigger';
    const baseDate = base === 'trigger' ? trigger : byCode.get(base) ?? trigger;
    let raw = addDays(baseDate, step.offsetDays);
    let adjusted = false;
    let holidayAdjusted = false;

    if (step.businessDays) {
      const direction = step.offsetDays >= 0 ? 1 : -1;
      let guard = 0;
      while (!isBusinessDay(raw, holidays) && guard < 400) {
        if (isHoliday(raw, holidays)) holidayAdjusted = true;
        adjusted = true;
        raw = addDays(raw, direction);
        guard += 1;
      }
    }

    const rawIso = raw.toISOString();
    const dueIso = toIsoEndOfDay(raw);
    const old = previous.get(step.code);
    const item: DeadlineItem = {
      code: step.code,
      label: step.label,
      offsetDays: step.offsetDays,
      base,
      rawDate: rawIso,
      dueDate: dueIso,
      adjusted,
      holidayAdjusted,
      taskId: old?.taskId ?? null,
    };
    items.push(item);
    byCode.set(step.code, raw);
  }

  return items;
}

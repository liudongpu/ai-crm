/**
 * 律师工具箱本地计算规则库。
 *
 * 收费标准与统计指标均为演示参考值：诉讼费/保全费按《诉讼费用交纳办法》
 * 的公开标准实现；仲裁费、地方附加费、赔偿统计指标与 LPR 历史值为本地
 * 演示数据，正式使用必须以官方最新公布文本和机构收费办法为准。
 */

export const JURISDICTIONS = [
  { code: 'national', label: '全国标准' },
  { code: 'beijing', label: '北京' },
  { code: 'shanghai', label: '上海' },
  { code: 'guangdong', label: '广东' },
  { code: 'jiangsu', label: '江苏' },
  { code: 'zhejiang', label: '浙江' },
];

/** 地方差异演示值：诉讼费与保全费执行国家统一标准，此处仅列常见地方杂费参考。 */
export const LOCAL_FEES: Record<string, { announcement: number; guaranteeService: number; note: string }> = {
  national: { announcement: 300, guaranteeService: 0, note: '全国标准，地方杂费按实际发生为准' },
  beijing: { announcement: 400, guaranteeService: 800, note: '北京地区演示参考值' },
  shanghai: { announcement: 400, guaranteeService: 700, note: '上海地区演示参考值' },
  guangdong: { announcement: 350, guaranteeService: 600, note: '广东地区演示参考值' },
  jiangsu: { announcement: 300, guaranteeService: 500, note: '江苏地区演示参考值' },
  zhejiang: { announcement: 300, guaranteeService: 500, note: '浙江地区演示参考值' },
};

const PROPERTY_BRACKETS = [
  { upTo: 10_000, rate: 0, fixed: 50, label: '1 万元以下' },
  { upTo: 100_000, rate: 0.025, label: '1–10 万元' },
  { upTo: 200_000, rate: 0.02, label: '10–20 万元' },
  { upTo: 500_000, rate: 0.015, label: '20–50 万元' },
  { upTo: 1_000_000, rate: 0.01, label: '50–100 万元' },
  { upTo: 2_000_000, rate: 0.009, label: '100–200 万元' },
  { upTo: 5_000_000, rate: 0.008, label: '200–500 万元' },
  { upTo: 10_000_000, rate: 0.007, label: '500–1000 万元' },
  { upTo: 20_000_000, rate: 0.006, label: '1000–2000 万元' },
  { upTo: Infinity, rate: 0.005, label: '2000 万元以上' },
];

const ARBITRATION_TABLES: Record<string, { label: string; rows: Array<{ upTo: number; fixed: number; rate: number }> }> = {
  beijing: {
    label: '北京仲裁委员会（演示标准）',
    rows: [
      { upTo: 100_000, fixed: 6_000, rate: 0 },
      { upTo: 500_000, fixed: 6_000, rate: 0.06 },
      { upTo: 1_000_000, fixed: 30_000, rate: 0.04 },
      { upTo: 5_000_000, fixed: 50_000, rate: 0.03 },
      { upTo: Infinity, fixed: 170_000, rate: 0.02 },
    ],
  },
  shanghai: {
    label: '上海仲裁委员会（演示标准）',
    rows: [
      { upTo: 100_000, fixed: 5_000, rate: 0 },
      { upTo: 500_000, fixed: 5_000, rate: 0.055 },
      { upTo: 1_000_000, fixed: 27_000, rate: 0.04 },
      { upTo: 5_000_000, fixed: 47_000, rate: 0.028 },
      { upTo: Infinity, fixed: 159_000, rate: 0.018 },
    ],
  },
  cieta: {
    label: '中国国际经济贸易仲裁委员会（演示标准）',
    rows: [
      { upTo: 100_000, fixed: 10_000, rate: 0 },
      { upTo: 500_000, fixed: 10_000, rate: 0.05 },
      { upTo: 1_000_000, fixed: 30_000, rate: 0.04 },
      { upTo: 5_000_000, fixed: 50_000, rate: 0.03 },
      { upTo: Infinity, fixed: 170_000, rate: 0.02 },
    ],
  },
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcPropertyFee(amount: number) {
  const rows: Array<{ label: string; base: number; rate: number; fee: number }> = [];
  let fee = 0;
  let previous = 0;
  for (const bracket of PROPERTY_BRACKETS) {
    if (amount <= previous) break;
    const slice = Math.min(amount, bracket.upTo) - previous;
    const part = bracket.fixed ?? slice * bracket.rate;
    fee += part;
    rows.push({
      label: bracket.label,
      base: round2(slice),
      rate: bracket.rate,
      fee: round2(part),
    });
    previous = bracket.upTo;
  }
  return { fee: round2(fee), rows };
}

export function calcPreservationFee(amount: number) {
  let fee = 30;
  if (amount > 1000 && amount <= 100_000) fee = 30 + (amount - 1000) * 0.01;
  else if (amount > 100_000) fee = 30 + 99_000 * 0.01 + (amount - 100_000) * 0.005;
  const capped = Math.min(fee, 5000);
  return { fee: round2(capped), uncapped: round2(fee), capped: fee > 5000 };
}

export function calcArbitrationFee(amount: number, tableCode: string) {
  const table = ARBITRATION_TABLES[tableCode] ?? ARBITRATION_TABLES.beijing;
  let fee = table.rows[0].fixed;
  for (const row of table.rows) {
    if (amount <= row.upTo) {
      fee = row.fixed + Math.max(0, amount - (row.upTo === 100_000 ? 0 : 0)) * 0;
      // 分段累计：前段上限按上一档计算
      const index = table.rows.indexOf(row);
      const prevUpTo = index === 0 ? 0 : table.rows[index - 1].upTo;
      fee = row.fixed + Math.max(0, amount - prevUpTo) * row.rate;
      break;
    }
  }
  return { table: table.label, fee: round2(fee) };
}

export function calcLitigationFee(input: {
  caseType: string;
  amount?: number;
  jurisdiction?: string;
  reduction?: string;
}) {
  const amount = input.amount ?? 0;
  const jurisdiction = input.jurisdiction ?? 'national';
  const local = LOCAL_FEES[jurisdiction] ?? LOCAL_FEES.national;
  const caseTypeLabels: Record<string, string> = {
    property: '财产案件',
    divorce: '离婚案件',
    labor: '劳动争议案件',
    ip: '商标/专利/著作权纠纷',
    admin: '行政案件',
    other: '其他非财产案件',
  };

  let base = 0;
  let detail: unknown = null;
  if (input.caseType === 'property') {
    const result = calcPropertyFee(amount);
    base = result.fee;
    detail = result.rows;
  } else if (input.caseType === 'labor') {
    base = 10;
  } else if (input.caseType === 'divorce') {
    base = 200;
  } else if (input.caseType === 'ip') {
    base = 800;
  } else if (input.caseType === 'admin') {
    base = 100;
  } else {
    base = 100;
  }

  const half = input.reduction === 'half';
  const final = half ? base / 2 : base;
  const preservation = calcPreservationFee(amount);
  const arbitration = calcArbitrationFee(amount, 'beijing');

  return {
    caseType: input.caseType,
    caseTypeLabel: caseTypeLabels[input.caseType] ?? input.caseType,
    jurisdiction,
    jurisdictionLabel: JURISDICTIONS.find((j) => j.code === jurisdiction)?.label ?? jurisdiction,
    amount,
    baseFee: round2(base),
    reduction: half ? '减半（简易程序/调解/撤诉）' : '无',
    finalFee: round2(final),
    detail,
    preservationFee: preservation.fee,
    preservationCapped: preservation.capped,
    arbitration: { table: arbitration.table, fee: arbitration.fee },
    localFees: { announcement: local.announcement, guaranteeService: local.guaranteeService, note: local.note },
    totalEstimate: round2(final + preservation.fee + local.announcement + local.guaranteeService),
    disclaimer: '诉讼费、保全费按《诉讼费用交纳办法》公开标准计算；仲裁费与地方杂费为本地演示标准，请以受理机构最新收费办法为准。',
  };
}

/** LPR 历史参考值（本地演示库，单位 %）。正式使用请核对中国人民银行/全国银行间同业拆借中心公告。 */
export const LPR_HISTORY: Array<{ from: string; oneYear: number; fiveYear: number }> = [
  { from: '2019-08-20', oneYear: 4.25, fiveYear: 4.85 },
  { from: '2019-09-20', oneYear: 4.2, fiveYear: 4.85 },
  { from: '2019-11-20', oneYear: 4.15, fiveYear: 4.8 },
  { from: '2020-02-20', oneYear: 4.05, fiveYear: 4.75 },
  { from: '2020-04-20', oneYear: 3.85, fiveYear: 4.65 },
  { from: '2021-12-20', oneYear: 3.8, fiveYear: 4.65 },
  { from: '2022-01-20', oneYear: 3.7, fiveYear: 4.6 },
  { from: '2022-08-22', oneYear: 3.65, fiveYear: 4.3 },
  { from: '2023-06-20', oneYear: 3.55, fiveYear: 4.2 },
  { from: '2023-08-21', oneYear: 3.45, fiveYear: 4.2 },
  { from: '2024-02-20', oneYear: 3.45, fiveYear: 3.95 },
  { from: '2024-07-22', oneYear: 3.35, fiveYear: 3.85 },
  { from: '2024-10-21', oneYear: 3.1, fiveYear: 3.6 },
  { from: '2025-05-20', oneYear: 3.0, fiveYear: 3.5 },
];

function parseDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

function getLpr(date: Date, type: string): number {
  const key = dateKey(date);
  let rate = LPR_HISTORY[0];
  for (const item of LPR_HISTORY) {
    if (item.from <= key) rate = item;
  }
  return type === '5y' ? rate.fiveYear : rate.oneYear;
}

export function calcInterest(input: {
  principal: number;
  startDate: string;
  endDate: string;
  compound?: string;
  rateSource?: string;
  manualRate?: number;
  segments?: Array<{ from: string; rate: number }>;
  paidAmount?: number;
  doubleDelay?: boolean;
  delayStartDate?: string;
}) {
  const start = parseDate(input.startDate);
  const end = parseDate(input.endDate);
  if (!start || !end || end < start) {
    return { error: '截止日期必须不早于起算日期', segments: [], totalInterest: 0 };
  }

  const custom = (input.segments ?? []).filter((s) => parseDate(s.from));
  const boundaries: Array<{ date: Date; rate: number }> = [];
  if (input.rateSource === 'manual') {
    boundaries.push({ date: start, rate: input.manualRate ?? 0 });
  } else if (custom.length) {
    custom.forEach((s) => boundaries.push({ date: parseDate(s.from)!, rate: s.rate }));
    boundaries.sort((a, b) => a.date.getTime() - b.date.getTime());
  } else {
    let cursor = new Date(start);
    while (cursor <= end) {
      boundaries.push({ date: new Date(cursor), rate: getLpr(cursor, input.rateSource ?? '1y') });
      const key = dateKey(cursor);
      const next = LPR_HISTORY.find((h) => h.from > key);
      if (!next) break;
      cursor = parseDate(next.from)!;
    }
  }
  if (!boundaries.length) boundaries.push({ date: start, rate: getLpr(start, '1y') });

  const points: Array<{ from: Date; to: Date; rate: number }> = [];
  boundaries.forEach((b, i) => {
    const from = i === 0 ? (b.date < start ? start : b.date) : b.date < start ? start : b.date;
    if (from > end || from < start) return;
    let to = i + 1 < boundaries.length ? new Date(boundaries[i + 1].date) : end;
    if (to > end) to = end;
    if (to <= from) return;
    points.push({ from, to, rate: b.rate });
  });
  // 补齐全区间（自定义分段未覆盖 tail）
  if (points.length && points[points.length - 1].to < end) {
    const last = points[points.length - 1];
    points.push({ from: last.to, to: end, rate: last.rate });
  }
  if (!points.length) points.push({ from: start, to: end, rate: boundaries[0].rate });

  let principal = Math.max(0, input.principal - (input.paidAmount ?? 0));
  let totalInterest = 0;
  const rows = points.map((p) => {
    const days = daysBetween(p.from, p.to);
    const years = days / 365;
    const rate = p.rate / 100;
    let interest: number;
    if (input.compound === 'monthly') {
      interest = principal * (Math.pow(1 + rate / 12, days / 30.4375) - 1);
    } else if (input.compound === 'yearly') {
      interest = principal * (Math.pow(1 + rate, years) - 1);
    } else {
      interest = principal * rate * years;
    }
    interest = round2(Math.max(0, interest));
    totalInterest += interest;
    if (input.compound !== 'single') principal += interest;
    return {
      from: dateKey(p.from),
      to: dateKey(p.to),
      days,
      rate: round2(p.rate),
      interest,
      principalAfter: round2(principal),
    };
  });

  let delayInterest = 0;
  let delayDays = 0;
  if (input.doubleDelay) {
    const delayStart = parseDate(input.delayStartDate ?? input.startDate) ?? start;
    delayDays = daysBetween(delayStart < start ? start : delayStart, end);
    delayInterest = round2(Math.max(0, input.principal - (input.paidAmount ?? 0)) * 0.000175 * delayDays);
  }

  return {
    principal: round2(input.principal),
    paidAmount: round2(input.paidAmount ?? 0),
    rateSource: input.rateSource ?? '1y',
    compound: input.compound ?? 'single',
    segments: rows,
    totalInterest: round2(totalInterest),
    delayDays,
    delayInterest,
    total: round2(input.principal + totalInterest + delayInterest),
    disclaimer: 'LPR 历史值为本地演示参考数据；计算按实际天数/365 计息，迟延履行加倍部分按日万分之一点七五计算。正式主张请以生效裁判与官方公布数据为准。',
  };
}

/** 赔偿测算的地区统计指标（本地演示参考值，单位：元/年 或 元/月）。 */
export const COMPENSATION_STATS: Record<string, { disposable: number; avgWage: number; label: string }> = {
  national: { disposable: 49283, avgWage: 7881, label: '全国参考值（演示）' },
  beijing: { disposable: 81752, avgWage: 12800, label: '北京参考值（演示）' },
  shanghai: { disposable: 76437, avgWage: 12183, label: '上海参考值（演示）' },
  guangdong: { disposable: 59307, avgWage: 9183, label: '广东参考值（演示）' },
  jiangsu: { disposable: 55315, avgWage: 8500, label: '江苏参考值（演示）' },
  zhejiang: { disposable: 63830, avgWage: 9500, label: '浙江参考值（演示）' },
};

const DISABILITY_FACTOR: Record<number, number> = {
  1: 1, 2: 0.9, 3: 0.8, 4: 0.7, 5: 0.6, 6: 0.5, 7: 0.4, 8: 0.3, 9: 0.2, 10: 0.1,
};
/** 工伤一次性伤残补助金月数（工伤保险条例第 35–37 条）。 */
const INJURY_MONTHS: Record<number, number> = {
  1: 27, 2: 25, 3: 23, 4: 21, 5: 18, 6: 16, 7: 13, 8: 11, 9: 9, 10: 7,
};

export function calcCompensation(input: {
  type: string;
  region?: string;
  medicalCost?: number;
  lostWageMonths?: number;
  monthlyWage?: number;
  careMonths?: number;
  disabilityGrade?: number;
  otherCost?: number;
  yearsWorked?: number;
  compensationMode?: string;
  applyTripleCap?: boolean;
  localAverageWage?: number;
}) {
  const region = input.region ?? 'national';
  const stats = COMPENSATION_STATS[region] ?? COMPENSATION_STATS.national;
  const grade = input.disabilityGrade ?? 10;
  const items: Array<{ label: string; amount: number; basis: string }> = [];
  const add = (label: string, amount: number, basis: string) =>
    items.push({ label, amount: round2(amount), basis });

  if (input.type === 'personal') {
    const factor = DISABILITY_FACTOR[grade] ?? 0.1;
    add('医疗费', input.medicalCost ?? 0, '按实际票据');
    add('误工费', (input.monthlyWage ?? 0) * (input.lostWageMonths ?? 0), '月工资 × 误工月数');
    add('护理费', (input.monthlyWage ?? 0) * 0.5 * (input.careMonths ?? 0), '按误工工资 50% × 护理月数（演示）');
    add('残疾赔偿金', stats.disposable * 20 * factor, `${stats.label} · 城镇居民人均可支配收入 × 20 年 × ${factor}`);
    add('其他费用', input.otherCost ?? 0, '交通/住院伙食/营养等');
  } else if (input.type === 'work_injury') {
    const months = INJURY_MONTHS[grade] ?? 7;
    add('一次性伤残补助金', (input.monthlyWage ?? 0) * months, `本人工资 × ${months} 个月（${grade} 级）`);
    add('停工留薪期工资', (input.monthlyWage ?? 0) * (input.lostWageMonths ?? 0), '本人工资 × 停工留薪月数');
    add('医疗费', input.medicalCost ?? 0, '按实际票据');
    add('护理费', (input.monthlyWage ?? 0) * 0.4 * (input.careMonths ?? 0), '按本人工资 40% × 护理月数（演示）');
    const localAvg = input.localAverageWage ?? stats.avgWage;
    add('一次性工伤医疗补助金', localAvg * (grade <= 4 ? 18 : grade <= 7 ? 12 : 8), `统筹地区月平均工资 × 等级月数（${stats.label} 演示）`);
    add('一次性伤残就业补助金', localAvg * (grade <= 4 ? 24 : grade <= 7 ? 16 : 10), `统筹地区月平均工资 × 等级月数（${stats.label} 演示）`);
    add('其他费用', input.otherCost ?? 0, '其他实际支出');
  } else if (input.type === 'work_death') {
    add('一次性工亡补助金', COMPENSATION_STATS.national.disposable * 20, '上年度全国城镇居民人均可支配收入 × 20');
    const localAvg = input.localAverageWage ?? stats.avgWage;
    add('丧葬补助金', localAvg * 6, '统筹地区上年度职工月平均工资 × 6');
    add('供养亲属抚恤金', (input.monthlyWage ?? 0) * 0.3 * 12 * (input.lostWageMonths ?? 1), '按本人工资 30%/人 · 年（演示）');
    add('其他费用', input.otherCost ?? 0, '其他实际支出');
  } else {
    const wage = input.monthlyWage ?? 0;
    const years = input.yearsWorked ?? 0;
    const capWage = stats.avgWage * 3;
    const capped = input.applyTripleCap && wage > capWage;
    const baseWage = capped ? capWage : wage;
    let nYears = years;
    if (capped && nYears > 12) nYears = 12;
    const n = Math.floor(nYears);
    const remainder = nYears - n;
    let months = n + (remainder >= 0.5 ? 1 : 0);
    const mode = input.compensationMode ?? 'N';
    if (mode === 'N1') months += 1;
    if (mode === '2N') months = months * 2;
    add('经济补偿金/赔偿金', baseWage * months, `${mode} · ${baseWage.toFixed(2)} 元 × ${months} 个月${capped ? '（三倍封顶且年限≤12）' : ''}`);
    add('其他费用', input.otherCost ?? 0, '其他实际支出');
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    type: input.type,
    region: stats.label,
    items,
    total: round2(total),
    disclaimer: '地区统计指标、工伤一次性补助月数为本地演示参考值；实际赔偿须按受诉法院/统筹地区最新公布数据、伤残鉴定与实际证据核算。',
  };
}

/** 诉讼期限预设（天数）。法定期间最后一日为节假日/休息日的，顺延至次一工作日。 */
export const DEADLINE_PRESETS: Record<string, { label: string; days: number; basis: string }> = {
  appeal: { label: '民事判决上诉期', days: 15, basis: '民事诉讼法第 171 条' },
  appeal_ruling: { label: '民事裁定上诉期', days: 10, basis: '民事诉讼法第 171 条' },
  evidence: { label: '举证期限（普通程序）', days: 15, basis: '民诉法解释第 99 条' },
  answer: { label: '答辩期', days: 15, basis: '民事诉讼法第 128 条' },
  execution: { label: '申请执行期间', days: 730, basis: '民事诉讼法第 250 条（二年）' },
  custom: { label: '自定义期限', days: 15, basis: '用户自定义' },
};

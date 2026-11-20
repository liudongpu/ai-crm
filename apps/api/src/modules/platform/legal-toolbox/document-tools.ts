/**
 * 证据与文档处理的本地规则实现。
 *
 * 敏感信息脱敏为真实可用的正则识别；证据目录与页码编排为本地确定性规则；
 * OCR 双层 PDF 为「批量登记 + 处理状态模拟 + 产物占位」，明确标注未真实识别。
 * 不引入任何新依赖，不上传文件，不调用外部 OCR 服务。
 */

export type RedactKind = 'idCard' | 'bankCard' | 'phone' | 'email';

export interface RedactionHit {
  kind: RedactKind;
  raw: string;
  masked: string;
  start: number;
  end: number;
}

interface Pattern {
  kind: RedactKind;
  re: RegExp;
  mask: (value: string) => string;
}

function keep(value: string, head: number, tail: number): string {
  if (value.length <= head + tail) return '*'.repeat(value.length);
  return `${value.slice(0, head)}${'*'.repeat(value.length - head - tail)}${value.slice(-tail)}`;
}

const PATTERNS: Pattern[] = [
  {
    kind: 'idCard',
    // 18 位身份证，末位可为数字或 X；前面不能紧跟数字，避免误伤长编号
    re: /(?<!\d)(\d{6})(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx](?!\d)/g,
    mask: (v) => keep(v, 6, 1),
  },
  {
    kind: 'bankCard',
    re: /(?<!\d)\d{16,19}(?!\d)/g,
    mask: (v) => keep(v, 4, 4),
  },
  {
    kind: 'phone',
    re: /(?<!\d)1[3-9]\d{9}(?!\d)/g,
    mask: (v) => keep(v, 3, 4),
  },
  {
    kind: 'email',
    re: /[\w.+-]+@[\w-]+\.[\w.-]+/g,
    mask: (v) => {
      const [user, domain] = v.split('@');
      return `${user.slice(0, 1)}${'*'.repeat(Math.max(1, user.length - 1))}@${domain}`;
    },
  },
];

export function redactText(text: string, only?: RedactKind) {
  const patterns = only ? PATTERNS.filter((p) => p.kind === only) : PATTERNS;
  const occupied: Array<{ start: number; end: number }> = [];
  const hits: RedactionHit[] = [];

  // 长模式优先：身份证/银行卡先于手机号，避免 18 位身份证中的片段被当作其他类型
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.re.source, 'g');
    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (occupied.some((o) => start < o.end && end > o.start)) continue;
      occupied.push({ start, end });
      hits.push({
        kind: pattern.kind,
        raw: match[0],
        masked: pattern.mask(match[0]),
        start,
        end,
      });
    }
  }

  hits.sort((a, b) => a.start - b.start);
  let output = '';
  let cursor = 0;
  for (const hit of hits) {
    output += text.slice(cursor, hit.start) + hit.masked;
    cursor = hit.end;
  }
  output += text.slice(cursor);

  const byKind = hits.reduce<Record<string, number>>((acc, hit) => {
    acc[hit.kind] = (acc[hit.kind] ?? 0) + 1;
    return acc;
  }, {});

  return {
    inputLength: text.length,
    redactedText: output,
    hitCount: hits.length,
    byKind,
    hits: hits.map(({ raw, ...rest }) => ({ ...rest, raw })),
    disclaimer:
      '脱敏基于本地正则规则，识别结果需人工复核；复杂版式、影印件或特殊编码可能漏识别，对外提供前请逐项确认。原文未上传、未留存。',
  };
}

export interface CatalogRow {
  index: number;
  name: string;
  type: string;
  source: string;
  pageFrom: number;
  pageTo: number;
  pages: number;
  note: string;
}

export function buildEvidenceCatalog(input: {
  caseName: string;
  submitter?: string;
  items: Array<{ name: string; type?: string; source?: string; pages?: number; note?: string }>;
}) {
  let cursor = 1;
  const rows: CatalogRow[] = input.items.map((item, index) => {
    const pages = Math.max(1, item.pages ?? 1);
    const row: CatalogRow = {
      index: index + 1,
      name: item.name,
      type: item.type ?? '书证',
      source: item.source ?? '—',
      pageFrom: cursor,
      pageTo: cursor + pages - 1,
      pages,
      note: item.note ?? '',
    };
    cursor += pages;
    return row;
  });

  const header = `证据目录\n案件：${input.caseName}${input.submitter ? `\n提交人：${input.submitter}` : ''}`;
  const lines = rows.map(
    (r) =>
      `${r.index}. ${r.name}（${r.type}）｜来源：${r.source}｜页码：${r.pageFrom}-${r.pageTo}（${r.pages} 页）${r.note ? `｜备注：${r.note}` : ''}`,
  );
  const text = [header, '', ...lines, '', `合计：${rows.length} 组证据，共 ${cursor - 1} 页。`].join('\n');

  return {
    caseName: input.caseName,
    submitter: input.submitter ?? null,
    rows,
    totalGroups: rows.length,
    totalPages: cursor - 1,
    text,
    disclaimer: '页码按录入页数顺序编排生成，生成后须与实物证据逐页核对；本工具不读取文件内容。',
  };
}

export function registerOcrBatch(files: Array<{ name: string; size?: number; pages?: number }>) {
  const jobs = files.map((file, index) => {
    const pages = Math.max(1, file.pages ?? 1);
    const ext = file.name.toLowerCase().split('.').pop() ?? '';
    const supported = ['jpg', 'jpeg', 'png', 'bmp', 'tif', 'tiff', 'pdf'].includes(ext);
    return {
      id: index + 1,
      name: file.name,
      size: file.size ?? null,
      pages,
      fileType: ext || '未知',
      supported,
      status: supported ? '待处理（模拟）' : '格式不支持',
      outputName: supported ? `${file.name.replace(/\.[^.]+$/, '')}.双层PDF.pdf` : null,
      confidence: null,
    };
  });

  return {
    jobs,
    total: jobs.length,
    supported: jobs.filter((j) => j.supported).length,
    mode: 'local-demo' as const,
    disclaimer:
      '本演示不上传文件、不执行真实 OCR 识别；以上仅为批量登记与处理状态占位，输出的「双层 PDF」为占位产物名，不含识别文本。正式使用需接入合规的 OCR 服务并人工校对。',
  };
}

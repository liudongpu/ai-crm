/**
 * 企业工商与失信速查的本地演示主体库。
 *
 * 所有数据均为虚构演示数据，不连接任何工商/司法公开平台，不是实时查询结果，
 * 不得作为尽调或授信依据。正式使用必须接入合规数据源并核对原始文书。
 */

export interface EquityNode {
  id: string;
  name: string;
  type: 'company' | 'person';
  ratio: number;
}

export interface EquityEdge {
  from: string;
  to: string;
  label: string;
}

export interface CompanyRecord {
  name: string;
  aliases: string[];
  creditCode: string;
  legalRepresentative: string;
  registeredCapital: string;
  establishedAt: string;
  status: string;
  address: string;
  businessScope: string;
  riskLevel: '低' | '中' | '高';
  shareholders: EquityNode[];
  equityEdges: EquityEdge[];
  lawsuits: Array<{ caseNo: string; cause: string; role: string; amount: string; date: string; status: string }>;
  executions: Array<{ caseNo: string; amount: string; date: string; status: string }>;
  restrictions: Array<{ caseNo: string; date: string; reason: string }>;
}

export const DEMO_COMPANIES: CompanyRecord[] = [
  {
    name: '星海科技有限公司',
    aliases: ['星海科技', '星海'],
    creditCode: '91310115MA1K3XXXXX',
    legalRepresentative: '王建国',
    registeredCapital: '5000 万元人民币',
    establishedAt: '2015-06-18',
    status: '存续',
    address: '上海市浦东新区张江高科技园区科苑路 88 号',
    businessScope: '软件开发、技术咨询、技术服务、计算机系统集成、货物及技术进出口。',
    riskLevel: '低',
    shareholders: [
      { id: 'c0', name: '星海科技有限公司', type: 'company', ratio: 100 },
      { id: 's1', name: '星海投资控股有限公司', type: 'company', ratio: 62 },
      { id: 's2', name: '陈思远', type: 'person', ratio: 23 },
      { id: 's3', name: '何静', type: 'person', ratio: 15 },
      { id: 'p1', name: '星海集团有限公司', type: 'company', ratio: 80 },
    ],
    equityEdges: [
      { from: 's1', to: 'c0', label: '持股 62%' },
      { from: 's2', to: 'c0', label: '持股 23%' },
      { from: 's3', to: 'c0', label: '持股 15%' },
      { from: 'p1', to: 's1', label: '控股 80%' },
    ],
    lawsuits: [
      { caseNo: '（2025）沪0115民初1234号', cause: '买卖合同纠纷', role: '原告', amount: '1,280,000 元', date: '2025-03-12', status: '一审已判决' },
      { caseNo: '（2024）沪01民终5678号', cause: '技术服务合同纠纷', role: '被告', amount: '340,000 元', date: '2024-09-03', status: '二审结案' },
    ],
    executions: [],
    restrictions: [],
  },
  {
    name: '华远建设工程有限公司',
    aliases: ['华远建设', '华远'],
    creditCode: '91110108MA01YYYYY',
    legalRepresentative: '赵明远',
    registeredCapital: '2 亿元人民币',
    establishedAt: '2008-03-05',
    status: '存续',
    address: '北京市海淀区中关村南大街 12 号',
    businessScope: '施工总承包、专业承包、建筑工程设计、建材销售。',
    riskLevel: '高',
    shareholders: [
      { id: 'c0', name: '华远建设工程有限公司', type: 'company', ratio: 100 },
      { id: 's1', name: '赵明远', type: 'person', ratio: 55 },
      { id: 's2', name: '华远置业有限公司', type: 'company', ratio: 45 },
      { id: 'p1', name: '远东资本管理有限公司', type: 'company', ratio: 90 },
    ],
    equityEdges: [
      { from: 's1', to: 'c0', label: '持股 55%' },
      { from: 's2', to: 'c0', label: '持股 45%' },
      { from: 'p1', to: 's2', label: '控股 90%' },
    ],
    lawsuits: [
      { caseNo: '（2025）京0108民初9012号', cause: '建设工程施工合同纠纷', role: '被告', amount: '8,600,000 元', date: '2025-01-20', status: '审理中' },
      { caseNo: '（2024）京01民终3344号', cause: '劳务分包合同纠纷', role: '被告', amount: '1,200,000 元', date: '2024-11-08', status: '已判决' },
      { caseNo: '（2024）京0108民初7788号', cause: '租赁合同纠纷', role: '原告', amount: '260,000 元', date: '2024-06-15', status: '调解结案' },
    ],
    executions: [
      { caseNo: '（2025）京0108执1234号', amount: '2,300,000 元', date: '2025-05-09', status: '被执行人' },
      { caseNo: '（2024）京0108执5678号', amount: '860,000 元', date: '2024-12-02', status: '终本' },
    ],
    restrictions: [
      { caseNo: '（2025）京0108执1234号', date: '2025-06-01', reason: '未按执行通知书履行给付义务，法定代表人被限制高消费' },
    ],
  },
  {
    name: '恒信贸易有限公司',
    aliases: ['恒信贸易', '恒信'],
    creditCode: '91330106MA2ZZZZZZ',
    legalRepresentative: '刘伟',
    registeredCapital: '1000 万元人民币',
    establishedAt: '2012-09-21',
    status: '存续',
    address: '浙江省杭州市西湖区文三路 259 号',
    businessScope: '日用百货、电子产品、机械设备批发零售；供应链管理服务。',
    riskLevel: '中',
    shareholders: [
      { id: 'c0', name: '恒信贸易有限公司', type: 'company', ratio: 100 },
      { id: 's1', name: '刘伟', type: 'person', ratio: 60 },
      { id: 's2', name: '周敏', type: 'person', ratio: 40 },
    ],
    equityEdges: [
      { from: 's1', to: 'c0', label: '持股 60%' },
      { from: 's2', to: 'c0', label: '持股 40%' },
    ],
    lawsuits: [
      { caseNo: '（2024）浙0106民初2211号', cause: '买卖合同纠纷', role: '被告', amount: '520,000 元', date: '2024-08-14', status: '已判决' },
    ],
    executions: [
      { caseNo: '（2025）浙0106执889号', amount: '180,000 元', date: '2025-04-17', status: '被执行人' },
    ],
    restrictions: [],
  },
];

export function findDemoCompany(name: string): CompanyRecord | null {
  const key = name.trim();
  if (!key) return null;
  return (
    DEMO_COMPANIES.find((c) => c.name === key || c.aliases.some((a) => a === key)) ??
    DEMO_COMPANIES.find(
      (c) => c.name.includes(key) || c.aliases.some((a) => key.includes(a) && a.length >= 2),
    ) ??
    null
  );
}

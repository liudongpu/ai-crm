import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Client,
  Communication,
  ConflictCheck,
  Contact,
  Document,
  Expense,
  Feature as FeatureEntity,
  FeatureModule as FeatureModuleEntity,
  FeatureRecord,
  FeatureRecordPriority,
  FeatureRecordStatus,
  Invoice,
  InvoiceItem,
  Lead,
  Matter,
  MatterStage,
  Note,
  Payment,
  Task,
  TimeEntry,
  TrustTransaction,
  User,
} from './entities';

const USERS: Array<{ name: string; email: string; role: User['role']; title: string }> = [
  { name: '王建国', email: 'wang.jianguo@lexdesk.cn', role: 'partner', title: '主任律师 / 合伙人' },
  { name: '李静', email: 'li.jing@lexdesk.cn', role: 'associate', title: '主办律师' },
  { name: '陈浩', email: 'chen.hao@lexdesk.cn', role: 'associate', title: '律师' },
  { name: '刘洋', email: 'liu.yang@lexdesk.cn', role: 'assistant', title: '律师助理' },
  { name: '赵敏', email: 'zhao.min@lexdesk.cn', role: 'accountant', title: '财务经理' },
];

const STAGES: Array<{
  name: string;
  color: string;
  probability: number;
  isFinal?: boolean;
}> = [
  { name: '咨询评估', color: '#94a3b8', probability: 10 },
  { name: '已签约', color: '#3b82f6', probability: 30 },
  { name: '证据收集', color: '#6366f1', probability: 50 },
  { name: '审理/谈判', color: '#f59e0b', probability: 75 },
  { name: '结案准备', color: '#ec4899', probability: 90 },
  { name: '已归档', color: '#22c55e', probability: 100, isFinal: true },
];

const CLIENTS: Array<{
  name: string;
  type: Client['type'];
  industry: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: Client['status'];
  owner: number;
}> = [
  { name: '星海科技有限公司', type: 'company', industry: '互联网 / 软件', contactName: '陈思远', email: 'contact@xinghai.example.com', phone: '010-8888 1201', address: '北京市海淀区中关村大街 1 号', status: 'active', owner: 0 },
  { name: '远景医药集团', type: 'company', industry: '医药健康', contactName: '王磊', email: 'legal@yuanjing.example.com', phone: '021-6688 2301', address: '上海市浦东新区张江路 88 号', status: 'active', owner: 1 },
  { name: '恒信物流有限公司', type: 'company', industry: '物流运输', contactName: '周涛', email: 'zhou.tao@hengxin.example.com', phone: '022-5888 9101', address: '天津市滨海新区港城路 16 号', status: 'active', owner: 2 },
  { name: '蓝山文化传播公司', type: 'company', industry: '文化传媒', contactName: '吴彤', email: 'wu.tong@lanshan.example.com', phone: '020-3888 4501', address: '广州市天河区珠江新城 12 号', status: 'prospect', owner: 1 },
  { name: '周雅琴', type: 'individual', industry: '个人客户', contactName: '周雅琴', email: 'zhou.yaqin@example.com', phone: '138 0000 1303', address: '深圳市南山区科技园南区', status: 'active', owner: 2 },
  { name: '林婉清', type: 'individual', industry: '个人客户', contactName: '林婉清', email: 'lin.wanqing@example.com', phone: '138 0000 1306', address: '杭州市余杭区文一西路', status: 'active', owner: 0 },
];

const CONTACTS: Array<{
  name: string;
  client: number;
  position: string;
  email: string;
  phone: string;
  mobile: string;
  isPrimary?: boolean;
}> = [
  { name: '陈思远', client: 0, position: '法务总监', email: 'chen.siyuan@xinghai.example.com', phone: '010-8888 1201', mobile: '138 0000 1201', isPrimary: true },
  { name: '何静', client: 0, position: '财务经理', email: 'he.jing@xinghai.example.com', phone: '010-8888 1202', mobile: '138 0000 1202' },
  { name: '王磊', client: 1, position: '集团副总裁', email: 'wang.lei@yuanjing.example.com', phone: '021-6688 2302', mobile: '138 0000 1203', isPrimary: true },
  { name: '孙雅', client: 1, position: '法务主管', email: 'sun.ya@yuanjing.example.com', phone: '021-6688 2303', mobile: '138 0000 1204' },
  { name: '周涛', client: 2, position: '总经理', email: 'zhou.tao@hengxin.example.com', phone: '022-5888 9101', mobile: '138 0000 1205', isPrimary: true },
  { name: '吴彤', client: 3, position: '创始人', email: 'wu.tong@lanshan.example.com', phone: '020-3888 4501', mobile: '138 0000 1206', isPrimary: true },
  { name: '周雅琴', client: 4, position: '本人', email: 'zhou.yaqin@example.com', phone: '138 0000 1303', mobile: '138 0000 1303', isPrimary: true },
  { name: '林婉清', client: 5, position: '本人', email: 'lin.wanqing@example.com', phone: '138 0000 1306', mobile: '138 0000 1306', isPrimary: true },
];

const MATTERS: Array<{
  title: string;
  caseNumber: string;
  client: number;
  stage: number;
  practiceArea: string;
  status: Matter['status'];
  priority: Matter['priority'];
  owner: number;
  value: number;
  openDaysAgo: number;
  closeDaysAgo?: number;
}> = [
  { title: '软件买卖合同货款纠纷', caseNumber: '(2026)京0108民初1201号', client: 0, stage: 0, practiceArea: '合同纠纷', status: 'open', priority: 'high', owner: 0, value: 860000, openDaysAgo: 12 },
  { title: '员工竞业限制争议处理', caseNumber: '(2026)京0108民初1208号', client: 2, stage: 0, practiceArea: '劳动法律', status: 'open', priority: 'medium', owner: 2, value: 180000, openDaysAgo: 8 },
  { title: '医药企业股权并购专项', caseNumber: '(2026)沪01民初2330号', client: 1, stage: 1, practiceArea: '并购重组', status: 'open', priority: 'high', owner: 1, value: 3200000, openDaysAgo: 45 },
  { title: '软件著作权许可谈判', caseNumber: '(2026)京知民初442号', client: 0, stage: 1, practiceArea: '知识产权', status: 'open', priority: 'medium', owner: 0, value: 520000, openDaysAgo: 36 },
  { title: '医疗服务责任纠纷应诉', caseNumber: '(2026)沪0115民初8871号', client: 1, stage: 2, practiceArea: '医疗纠纷', status: 'open', priority: 'high', owner: 1, value: 1450000, openDaysAgo: 67 },
  { title: '影视作品著作权维权', caseNumber: '(2026)粤0106民初3312号', client: 3, stage: 2, practiceArea: '知识产权', status: 'on_hold', priority: 'low', owner: 2, value: 240000, openDaysAgo: 55 },
  { title: '物流运输合同商事诉讼', caseNumber: '(2026)津0116民初1902号', client: 2, stage: 3, practiceArea: '商事诉讼', status: 'open', priority: 'high', owner: 0, value: 980000, openDaysAgo: 118 },
  { title: '星海科技股权转让纠纷', caseNumber: '(2026)京0108民初2011号', client: 0, stage: 3, practiceArea: '公司法', status: 'open', priority: 'high', owner: 1, value: 2100000, openDaysAgo: 96 },
  { title: '集团数据合规审查', caseNumber: '(2026)沪01合审77号', client: 1, stage: 4, practiceArea: '合规审查', status: 'open', priority: 'medium', owner: 2, value: 360000, openDaysAgo: 140 },
  { title: '婚姻财产分割纠纷', caseNumber: '(2026)粤0305民初6612号', client: 4, stage: 4, practiceArea: '婚姻家庭', status: 'open', priority: 'medium', owner: 1, value: 780000, openDaysAgo: 132 },
  { title: '遗产继承纠纷调解', caseNumber: '(2025)浙0110民初8820号', client: 5, stage: 5, practiceArea: '家事法律', status: 'won', priority: 'low', owner: 0, value: 420000, openDaysAgo: 320, closeDaysAgo: 26 },
  { title: '商标异议复审案件', caseNumber: '(2025)粤0106行初118号', client: 3, stage: 5, practiceArea: '知识产权', status: 'lost', priority: 'low', owner: 2, value: 160000, openDaysAgo: 280, closeDaysAgo: 48 },
];

const LEADS: Array<{
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  practiceArea: string;
  description: string;
  status: Lead['status'];
  rating: Lead['rating'];
  conflictChecked?: boolean;
  conflictResult?: 'clear' | 'conflict';
  owner?: number;
  converted?: { client: number; contact: number; matter: number; daysAgo: number };
}> = [
  { name: '张沐', company: '远景能源', email: 'zhang.mu@yuanjing.example.com', phone: '138 0000 1301', source: '网站', practiceArea: '公司法', description: '拟设立合资公司，需要股权架构设计与合同审查。', status: 'new', rating: 'hot', owner: 0 },
  { name: '李文博', company: '汇通金服', email: 'li.wenbo@huitong.example.com', phone: '138 0000 1302', source: '转介绍', practiceArea: '金融合规', description: '需对信贷业务合作方案进行合规性审查。', status: 'contacted', rating: 'hot', conflictChecked: true, conflictResult: 'clear', owner: 1 },
  { name: '方敏', company: '德昌制造', email: 'fang.min@dechang.example.com', phone: '138 0000 1306', source: '线下活动', practiceArea: '劳动法律', description: '工厂用工制度调整，咨询裁员补偿方案。', status: 'new', rating: 'cold', owner: 2 },
  { name: '苏晴', company: '星辰传媒', email: 'su.qing@xingchen.example.com', phone: '138 0000 1307', source: '广告', practiceArea: '知识产权', description: '发现品牌标识被抢注，希望提起异议。', status: 'qualified', rating: 'warm', conflictChecked: true, conflictResult: 'clear', owner: 0 },
  { name: '陈思远', company: '星海科技', email: 'chen.siyuan@xinghai.example.com', phone: '138 0000 1201', source: '老客户', practiceArea: '合同纠纷', description: '已有货款纠纷案件，追加专项法律顾问服务。', status: 'converted', rating: 'hot', conflictChecked: true, conflictResult: 'clear', owner: 0, converted: { client: 0, contact: 0, matter: 0, daysAgo: 12 } },
  { name: '郑浩', company: '云图数据', email: 'zheng.hao@yuntu.example.com', phone: '138 0000 1308', source: '网站', practiceArea: '数据合规', description: '预算暂缓，明年再启动数据出境合规项目。', status: 'lost', rating: 'cold', conflictChecked: true, conflictResult: 'clear', owner: 1 },
];

const CONFLICTS: Array<{
  name: string;
  type: ConflictCheck['type'];
  result: ConflictCheck['result'];
  matter?: number;
  checkedBy: number;
  details?: string;
  daysAgo: number;
}> = [
  { name: '星海科技', type: 'client', result: 'conflict', matter: 0, checkedBy: 0, details: '[{"type":"client","id":1,"name":"星海科技有限公司","detail":"既有客户 · 合同纠纷"}]', daysAgo: 11 },
  { name: '陈思远', type: 'contact', result: 'potential', matter: 3, checkedBy: 1, details: '[{"type":"contact","id":1,"name":"陈思远","detail":"法务总监 · 星海科技"}]', daysAgo: 9 },
  { name: '恒信物流', type: 'client', result: 'clear', matter: 6, checkedBy: 2, details: '[]', daysAgo: 6 },
  { name: '股权转让', type: 'matter', result: 'potential', matter: 7, checkedBy: 0, details: '[{"type":"matter","id":8,"name":"星海科技股权转让纠纷","detail":"公司法 · 进行中"}]', daysAgo: 3 },
];

const TASKS: Array<{
  title: string;
  type: Task['type'];
  description: string;
  inDays: number;
  hour: number;
  priority: Task['priority'];
  matter?: number;
  assignee: number;
  done?: boolean;
}> = [
  { title: '提交货款纠纷证据目录', type: 'deadline', description: '向法院提交第一批证据材料及原件核对。', inDays: -5, hour: 18, priority: 'high', matter: 0, assignee: 0, done: true },
  { title: '并购项目尽职调查补充', type: 'task', description: '补充目标公司劳动用工与关联交易资料。', inDays: -3, hour: 16, priority: 'high', matter: 2, assignee: 1, done: true },
  { title: '客户沟通会议', type: 'task', description: '与星海科技讨论和解方案。', inDays: -1, hour: 10, priority: 'medium', matter: 0, assignee: 0, done: true },
  { title: '整理医疗纠纷病历材料', type: 'task', description: '按时间轴整理病历与费用凭证。', inDays: 0, hour: 15, priority: 'high', matter: 4, assignee: 1 },
  { title: '物流合同纠纷庭审', type: 'hearing', description: '天津市滨海新区人民法院第三法庭。', inDays: 2, hour: 9, priority: 'high', matter: 6, assignee: 0 },
  { title: '证据交换', type: 'court', description: '与对方律师交换证据并确认争议焦点。', inDays: 4, hour: 14, priority: 'medium', matter: 7, assignee: 1 },
  { title: '提交著作权维权起诉状', type: 'deadline', description: '注意诉讼时效，务必在期限前完成提交。', inDays: 1, hour: 17, priority: 'high', matter: 5, assignee: 2 },
  { title: '合规报告初稿审阅', type: 'task', description: '复核数据合规报告初稿关键条款。', inDays: 3, hour: 11, priority: 'medium', matter: 8, assignee: 2 },
  { title: '婚姻案件调解准备', type: 'reminder', description: '提醒当事人准备财产清单与收入证明。', inDays: 5, hour: 10, priority: 'low', matter: 9, assignee: 1 },
  { title: '合同模板更新', type: 'task', description: '更新标准服务合同模板中的争议解决条款。', inDays: 7, hour: 16, priority: 'low', assignee: 3 },
  { title: '归档案件材料', type: 'reminder', description: '遗产继承案卷归档并扫描电子版本。', inDays: 9, hour: 14, priority: 'low', matter: 10, assignee: 3 },
  { title: '客户回访电话', type: 'reminder', description: '回访恒信物流负责人确认满意度。', inDays: -2, hour: 11, priority: 'low', matter: 6, assignee: 0, done: true },
  { title: '股权并购谈判纪要', type: 'task', description: '整理第二轮谈判核心条款。', inDays: 6, hour: 18, priority: 'high', matter: 2, assignee: 0 },
  { title: '商标异议答辩期限', type: 'deadline', description: '案件已归档，仅作期限提醒。', inDays: -8, hour: 17, priority: 'low', matter: 11, assignee: 2, done: true },
  { title: '庭审笔录核对', type: 'court', description: '核对物流案件庭审笔录并签字确认。', inDays: 3, hour: 15, priority: 'medium', matter: 6, assignee: 3 },
  { title: '开具律师费发票', type: 'task', description: '为已结案件开具尾款发票。', inDays: 4, hour: 10, priority: 'medium', matter: 10, assignee: 4 },
  { title: '新客户接待准备', type: 'reminder', description: '准备初次咨询接待室与利益冲突检查表。', inDays: 1, hour: 9, priority: 'low', assignee: 3 },
  { title: '知识产权许可合同定稿', type: 'deadline', description: '与对方确认最终版本并安排签署。', inDays: 8, hour: 17, priority: 'medium', matter: 3, assignee: 1 },
];

const DOCUMENTS: Array<{
  title: string;
  category: Document['category'];
  fileName: string;
  version: string;
  matter?: number;
  client: number;
  uploadedBy: number;
  signed?: boolean;
  description: string;
}> = [
  { title: '软件买卖合同（原件）', category: 'contract', fileName: 'xinghai-sales-contract.pdf', version: '1.0', matter: 0, client: 0, uploadedBy: 3, description: '案件核心合同原件扫描件。' },
  { title: '货款催告律师函', category: 'correspondence', fileName: 'demand-letter-01.docx', version: '2.1', matter: 0, client: 0, uploadedBy: 0, signed: true, description: '已发送对方并留存回执。' },
  { title: '证据目录与说明', category: 'evidence', fileName: 'evidence-list.xlsx', version: '1.2', matter: 0, client: 0, uploadedBy: 3, description: '第一批证据清单。' },
  { title: '股权并购框架协议', category: 'contract', fileName: 'yuanjing-ma-framework.pdf', version: '3.0', matter: 2, client: 1, uploadedBy: 1, signed: true, description: '双方已签署的框架协议。' },
  { title: '尽职调查报告', category: 'other', fileName: 'due-diligence-report.pdf', version: '1.0', matter: 2, client: 1, uploadedBy: 1, description: '法律尽职调查最终报告。' },
  { title: '病历资料汇编', category: 'evidence', fileName: 'medical-records.pdf', version: '1.0', matter: 4, client: 1, uploadedBy: 3, description: '医疗纠纷案件关键证据。' },
  { title: '物流运输合同补充协议', category: 'contract', fileName: 'hengxin-supplement.pdf', version: '1.1', matter: 6, client: 2, uploadedBy: 2, signed: true, description: '补充协议签署版。' },
  { title: '起诉状模板', category: 'template', fileName: 'complaint-template.docx', version: '2.0', uploadedBy: 0, client: 0, description: '所内通用民事起诉状模板。' },
  { title: '著作权授权许可协议', category: 'contract', fileName: 'copyright-license.pdf', version: '1.0', matter: 3, client: 0, uploadedBy: 1, signed: true, description: '许可协议定稿。' },
  { title: '和解协议草案', category: 'contract', fileName: 'settlement-draft.docx', version: '0.9', matter: 7, client: 0, uploadedBy: 0, description: '待与对方协商确认。' },
];

const TIME_ENTRIES: Array<{
  matter: number;
  user: number;
  daysAgo: number;
  hours: number;
  description: string;
  billable?: boolean;
  rate: number;
}> = [
  { matter: 0, user: 0, daysAgo: 1, hours: 3.5, description: '审阅案件材料并制定诉讼策略', rate: 1200 },
  { matter: 0, user: 3, daysAgo: 2, hours: 4, description: '整理证据材料与往来函件', rate: 500 },
  { matter: 0, user: 1, daysAgo: 4, hours: 2.5, description: '起草律师函', rate: 900 },
  { matter: 2, user: 1, daysAgo: 3, hours: 6, description: '并购项目法律尽职调查', rate: 1200 },
  { matter: 2, user: 3, daysAgo: 5, hours: 5, description: '整理目标公司工商与合同档案', rate: 500 },
  { matter: 2, user: 0, daysAgo: 7, hours: 3, description: '参与并购交易结构讨论会', rate: 1500 },
  { matter: 3, user: 1, daysAgo: 6, hours: 4, description: '起草著作权许可协议', rate: 900 },
  { matter: 4, user: 1, daysAgo: 8, hours: 5.5, description: '研究医疗损害责任相关判例', rate: 1000 },
  { matter: 4, user: 3, daysAgo: 10, hours: 6, description: '编制病历时间轴', rate: 500 },
  { matter: 6, user: 0, daysAgo: 12, hours: 4.5, description: '准备庭审代理意见', rate: 1200 },
  { matter: 6, user: 2, daysAgo: 14, hours: 3, description: '核对运输合同争议条款', rate: 800 },
  { matter: 7, user: 1, daysAgo: 15, hours: 5, description: '审阅股权转让协议及附件', rate: 900 },
  { matter: 8, user: 2, daysAgo: 16, hours: 4, description: '数据合规差距分析', rate: 800 },
  { matter: 9, user: 1, daysAgo: 18, hours: 3.5, description: '与当事人沟通财产分割方案', rate: 900 },
  { matter: 10, user: 0, daysAgo: 20, hours: 2, description: '遗产继承调解结案确认', rate: 1200 },
  { matter: 5, user: 2, daysAgo: 22, hours: 3, description: '著作权权属证据梳理', rate: 800 },
  { matter: 1, user: 2, daysAgo: 25, hours: 2.5, description: '竞业限制条款法律分析', rate: 800 },
  { matter: 11, user: 3, daysAgo: 30, hours: 4, description: '商标异议案卷整理', rate: 500 },
  { matter: 0, user: 0, daysAgo: 34, hours: 1.5, description: '内部案件讨论（不计费）', rate: 1200, billable: false },
  { matter: 2, user: 1, daysAgo: 40, hours: 6, description: '交易文件条款谈判', rate: 1200 },
];

const EXPENSES: Array<{
  matter: number;
  daysAgo: number;
  category: string;
  amount: number;
  description: string;
  billable?: boolean;
}> = [
  { matter: 0, daysAgo: 2, category: '诉讼费', amount: 6800, description: '案件受理费' },
  { matter: 0, daysAgo: 6, category: '复印', amount: 320, description: '证据材料复印装订' },
  { matter: 2, daysAgo: 4, category: '差旅', amount: 2450, description: '上海出差高铁与住宿' },
  { matter: 2, daysAgo: 9, category: '专家费', amount: 8000, description: '财务专家咨询' },
  { matter: 4, daysAgo: 11, category: '诉讼费', amount: 5200, description: '医疗纠纷案件受理费' },
  { matter: 4, daysAgo: 13, category: '差旅', amount: 1680, description: '外出调查交通费' },
  { matter: 6, daysAgo: 15, category: '诉讼费', amount: 8900, description: '商事诉讼受理费' },
  { matter: 6, daysAgo: 17, category: '其他', amount: 460, description: '快递与邮寄费用' },
  { matter: 7, daysAgo: 19, category: '专家费', amount: 5000, description: '股权估值专家意见' },
  { matter: 8, daysAgo: 21, category: '其他', amount: 1200, description: '数据合规工具订阅' },
  { matter: 9, daysAgo: 23, category: '差旅', amount: 980, description: '当事人面谈交通费' },
  { matter: 5, daysAgo: 28, category: '复印', amount: 260, description: '著作权资料打印', billable: false },
];

const INVOICES: Array<{
  client: number;
  matter: number;
  status: Invoice['status'];
  issueDaysAgo: number;
  dueInDays: number;
  timeIndexes: number[];
  expenseIndexes: number[];
  manual?: { description: string; amount: number };
  notes: string;
}> = [
  { client: 0, matter: 0, status: 'draft', issueDaysAgo: 2, dueInDays: 20, timeIndexes: [], expenseIndexes: [], manual: { description: '专项法律顾问费（草案）', amount: 20000 }, notes: '待主办律师确认' },
  { client: 1, matter: 2, status: 'pending_approval', issueDaysAgo: 3, dueInDays: 25, timeIndexes: [], expenseIndexes: [], manual: { description: '并购项目阶段性服务费', amount: 120000 }, notes: '等待合伙人审批' },
  { client: 2, matter: 6, status: 'approved', issueDaysAgo: 6, dueInDays: 20, timeIndexes: [], expenseIndexes: [], manual: { description: '商事诉讼代理费', amount: 80000 }, notes: '已审批，待发送客户' },
  { client: 0, matter: 0, status: 'sent', issueDaysAgo: 8, dueInDays: 15, timeIndexes: [0, 1, 2], expenseIndexes: [0, 1], notes: '货款纠纷第一阶段费用' },
  { client: 1, matter: 4, status: 'paid', issueDaysAgo: 14, dueInDays: 20, timeIndexes: [7, 8], expenseIndexes: [4, 5], notes: '已全额收款' },
  { client: 2, matter: 6, status: 'sent', issueDaysAgo: 16, dueInDays: 18, timeIndexes: [9, 10], expenseIndexes: [6, 7], notes: '庭审准备阶段费用' },
  { client: 1, matter: 2, status: 'void', issueDaysAgo: 20, dueInDays: 15, timeIndexes: [], expenseIndexes: [], manual: { description: '重复开具的账单', amount: 30000 }, notes: '重复账单已作废' },
  { client: 5, matter: 10, status: 'draft', issueDaysAgo: 1, dueInDays: 30, timeIndexes: [14], expenseIndexes: [], notes: '结案尾款待确认' },
];

const TRUST: Array<{
  client: number;
  matter?: number;
  type: TrustTransaction['type'];
  category: TrustTransaction['category'];
  amount: number;
  daysAgo: number;
  description: string;
  reference: string;
  reconciled?: boolean;
}> = [
  { client: 0, matter: 0, type: 'deposit', category: 'retainer', amount: 100000, daysAgo: 30, description: '诉讼保证金预存', reference: 'TR-2026-0001', reconciled: true },
  { client: 0, matter: 0, type: 'withdrawal', category: 'earned_fee', amount: 28000, daysAgo: 12, description: '第一阶段律师费结转', reference: 'TR-2026-0002', reconciled: true },
  { client: 1, matter: 2, type: 'deposit', category: 'retainer', amount: 300000, daysAgo: 45, description: '并购项目预付款', reference: 'TR-2026-0003', reconciled: true },
  { client: 1, matter: 2, type: 'withdrawal', category: 'cost', amount: 10450, daysAgo: 9, description: '代垫差旅及专家费', reference: 'TR-2026-0004' },
  { client: 2, matter: 6, type: 'deposit', category: 'retainer', amount: 150000, daysAgo: 60, description: '诉讼专项保证金', reference: 'TR-2026-0005', reconciled: true },
  { client: 2, matter: 6, type: 'transfer_out', category: 'cost', amount: 9360, daysAgo: 15, description: '支付案件受理费', reference: 'TR-2026-0006' },
  { client: 4, matter: 9, type: 'deposit', category: 'retainer', amount: 50000, daysAgo: 35, description: '家事案件预付款', reference: 'TR-2026-0007', reconciled: true },
  { client: 5, matter: 10, type: 'refund', category: 'refund', amount: 12000, daysAgo: 20, description: '结案余额退款', reference: 'TR-2026-0008', reconciled: true },
];

const COMMUNICATIONS: Array<{
  matter?: number;
  client: number;
  contact?: number;
  type: Communication['type'];
  direction: Communication['direction'];
  subject: string;
  content: string;
  daysAgo: number;
  user: number;
}> = [
  { matter: 0, client: 0, contact: 0, type: 'email', direction: 'outbound', subject: '关于货款纠纷和解方案', content: '已向对方发送和解方案，请确认可接受范围。', daysAgo: 1, user: 0 },
  { matter: 0, client: 0, contact: 0, type: 'call', direction: 'inbound', subject: '客户来电询问进展', content: '客户希望本周内收到庭审排期信息。', daysAgo: 2, user: 3 },
  { matter: 2, client: 1, contact: 2, type: 'meeting', direction: 'outbound', subject: '并购项目进度会', content: '讨论尽调发现的问题及交易价格调整方案。', daysAgo: 3, user: 1 },
  { matter: 4, client: 1, contact: 3, type: 'email', direction: 'inbound', subject: '病历资料补充', content: '客户补充了住院期间的护理记录。', daysAgo: 5, user: 1 },
  { matter: 6, client: 2, contact: 4, type: 'sms', direction: 'outbound', subject: '庭审时间提醒', content: '已提醒客户庭审时间与地点。', daysAgo: 7, user: 2 },
  { matter: 6, client: 2, contact: 4, type: 'meeting', direction: 'inbound', subject: '证据准备会议', content: '确认第二批证据材料清单。', daysAgo: 10, user: 0 },
  { matter: 3, client: 0, contact: 0, type: 'email', direction: 'outbound', subject: '许可协议修订稿', content: '发送第三版许可协议修订稿供审阅。', daysAgo: 12, user: 1 },
  { matter: 8, client: 1, contact: 2, type: 'letter', direction: 'outbound', subject: '合规审查阶段报告', content: '寄送数据合规阶段性报告。', daysAgo: 18, user: 2 },
  { matter: 9, client: 4, contact: 6, type: 'call', direction: 'inbound', subject: '调解意向沟通', content: '客户愿意接受调解，需准备财产清单。', daysAgo: 21, user: 1 },
  { matter: 11, client: 3, contact: 5, type: 'message', direction: 'outbound', subject: '案件结果通知', content: '商标异议复审结果已通知客户。', daysAgo: 45, user: 2 },
];

const NOTES: Array<{
  title: string;
  content: string;
  targetType: Note['targetType'];
  target: { kind: 'client' | 'contact' | 'matter' | 'lead' | 'document'; index: number };
  author: number;
}> = [
  { title: '客户决策链', content: '法务总监陈思远负责案件推进，财务经理何静负责付款审批。', targetType: 'client', target: { kind: 'client', index: 0 }, author: 0 },
  { title: '并购交易关注点', content: '客户最关注目标公司潜在劳动纠纷及关联交易披露。', targetType: 'client', target: { kind: 'client', index: 1 }, author: 1 },
  { title: '沟通偏好', content: '王磊偏好邮件沟通，通常在工作日晚间回复。', targetType: 'contact', target: { kind: 'contact', index: 2 }, author: 1 },
  { title: '证据收集进度', content: '第一批证据已收齐，缺少银行流水原件，需再次催要。', targetType: 'matter', target: { kind: 'matter', index: 0 }, author: 3 },
  { title: '庭审注意事项', content: '对方可能主张时效抗辩，需准备时效中断证据。', targetType: 'matter', target: { kind: 'matter', index: 6 }, author: 0 },
  { title: '咨询要点', content: '有意追加常年法律顾问服务，可在案件结束后跟进报价。', targetType: 'lead', target: { kind: 'lead', index: 4 }, author: 0 },
  { title: '文档版本说明', content: '起诉状模板已更新至 2.0，旧版本请勿使用。', targetType: 'document', target: { kind: 'document', index: 7 }, author: 0 },
  { title: '结案提示', content: '遗产继承案件已调解结案，信托账户余额需安排退款。', targetType: 'matter', target: { kind: 'matter', index: 10 }, author: 4 },
];

const FEATURE_MODULES: Array<{ code: string; name: string; description: string }> = [
  { code: 'grow', name: '获客与客户关系管理', description: '从线索、咨询登记、资格筛查到签约转化与客户经营的完整获客流程。' },
  { code: 'manage', name: '案件与事项管理', description: '案件档案、自定义数据、任务流程与活动时间线的统一管理。' },
  { code: 'calendar', name: '日历、任务与截止日期管理', description: '日程、法定期限、时效预警与日历计费联动。' },
  { code: 'draft', name: '文档管理与文档自动化', description: '文档存储、模板自动化、法院表格与协作版本管理。' },
  { code: 'communicate', name: '客户沟通与客户门户', description: '统一沟通记录、邮件归档、客户门户与自助服务。' },
  { code: 'billing', name: '时间、费用与计费', description: '工时、费用、费率、账单生成与应收催收的全流程计费。' },
  { code: 'accounting', name: '支付、信托与法律会计', description: '支付计划、信托记账、对账、总账及财务报表。' },
  { code: 'work_ai', name: '实体法律工作AI', description: '本地演示：案件分析、法律检索、策略检验与文档审阅辅助。' },
  { code: 'reports', name: '报告、分析与经营管理', description: '仪表盘、经营指标、自定义报告与审计追溯。' },
  { code: 'automation', name: '自动化、工作流与AI运营能力', description: '工作流、任务与计费自动化及本地演示的AI运营辅助。' },
  { code: 'integrations', name: '集成生态与开放能力', description: '本地演示：邮件、会计、文档、沟通与开放API等集成配置。' },
  { code: 'security', name: '安全、合规与治理', description: '认证加密、合规框架、访问控制与数据治理配置。' },
];

type FeatureSeed = {
  module: string;
  code: string;
  name: string;
  route: string;
  description: string;
  titles: [string, string];
};

const FEATURES: FeatureSeed[] = [
  { module: 'grow', code: 'grow_crm', name: '线索与CRM', route: '/leads', description: '统一管理线索、客户与跟进记录，跟踪商机转化。', titles: ['星海科技线索分配与跟进', '季度商机转化漏斗复盘'] },
  { module: 'grow', code: 'grow_intake', name: '获客intake', route: '/features/grow_intake', description: '登记初次咨询与委托意向，形成标准化 intake 记录。', titles: ['官网咨询登记表配置', '新客户 intake 信息补全'] },
  { module: 'grow', code: 'grow_qualification', name: '资格筛查', route: '/features/grow_qualification', description: '按预算、需求与匹配度评估潜在客户资格。', titles: ['远景能源合作资格评分', '低预算线索筛选规则调整'] },
  { module: 'grow', code: 'grow_conflict', name: '冲突检查', route: '/features/grow_conflict', description: '委托前进行利益冲突检索并留存检查结果。', titles: ['股权转让案冲突检索记录', '潜在客户同名主体核查'] },
  { module: 'grow', code: 'grow_appointment', name: '预约与跟进', route: '/features/grow_appointment', description: '安排咨询预约、提醒跟进并跟踪到场情况。', titles: ['并购项目初次面谈预约', '客户回访计划与提醒'] },
  { module: 'grow', code: 'grow_engagement', name: '签约转化', route: '/features/grow_engagement', description: '管理报价、合同签署与委托转正式客户的转化。', titles: ['常年法律顾问报价审批', '委托合同签署与归档'] },
  { module: 'grow', code: 'grow_marketing', name: '营销', route: '/features/grow_marketing', description: '维护营销活动、渠道投放与内容素材。', titles: ['知识产权主题沙龙策划', '公众号专业文章排期'] },
  { module: 'grow', code: 'grow_referral', name: '口碑与复购', route: '/features/grow_referral', description: '跟踪老客户转介绍、满意度与二次委托机会。', titles: ['结案客户满意度回访', '老客户转介绍奖励方案'] },

  { module: 'manage', code: 'manage_case_file', name: '案件档案', route: '/matters', description: '案件立卷、材料归集与案卷归档管理。', titles: ['货款纠纷案卷材料清单', '结案卷宗扫描归档'] },
  { module: 'manage', code: 'manage_custom_data', name: '自定义数据', route: '/features/manage_custom_data', description: '配置案件与客户自定义字段及表单。', titles: ['合规审查自定义字段配置', '客户行业分类字典维护'] },
  { module: 'manage', code: 'manage_tasks', name: '任务与流程', route: '/calendar', description: '统一管理任务分派、进度与截止日期。', titles: ['证据交换任务分派', '庭审准备清单跟踪'] },
  { module: 'manage', code: 'manage_workflow_template', name: '案件流程模板', route: '/features/manage_workflow_template', description: '按案件类型维护标准化流程与节点模板。', titles: ['商事诉讼流程模板更新', '并购项目节点模板启用'] },
  { module: 'manage', code: 'manage_conflict_search', name: '冲突与检索', route: '/features/manage_conflict_search', description: '跨客户、案件与联系人进行冲突与关键词检索。', titles: ['集团关联方批量检索', '历史案卷关键词检索'] },
  { module: 'manage', code: 'manage_activity_timeline', name: '活动时间线', route: '/features/manage_activity_timeline', description: '汇总案件沟通、任务与文档形成时间线。', titles: ['医疗纠纷案件时间轴梳理', '客户往来活动记录汇总'] },
  { module: 'manage', code: 'manage_mobile_access', name: '移动与访问', route: '/features/manage_mobile_access', description: '配置移动端访问方式与外出办案权限。', titles: ['外出庭审移动访问配置', '助理移动端权限调整'] },

  { module: 'calendar', code: 'calendar_manage', name: '日历管理', route: '/calendar', description: '统一查看与维护日程、庭审及提醒事项。', titles: ['下周庭审日历排期', '团队共享日历订阅'] },
  { module: 'calendar', code: 'calendar_deadline_calc', name: '截止日期计算', route: '/features/calendar_deadline_calc', description: '按程序规则计算并校验各类法定期限。', titles: ['上诉期限自动计算规则', '举证期限计算结果复核'] },
  { module: 'calendar', code: 'calendar_statute', name: '时效管理', route: '/features/calendar_statute', description: '跟踪诉讼时效与保全期限并设置预警。', titles: ['著作权维权时效预警', '应收账款诉讼时效台账'] },
  { module: 'calendar', code: 'calendar_ai_assist', name: 'AI日历辅助', route: '/features/calendar_ai_assist', description: '本地演示：辅助识别日程文本并生成提醒建议。', titles: ['会议纪要日程提取演示', '期限提醒文案生成演示'] },
  { module: 'calendar', code: 'calendar_sync_reminder', name: '同步与提醒', route: '/features/calendar_sync_reminder', description: '本地演示：配置日历同步与多渠道提醒规则。', titles: ['邮箱日历同步配置演示', '开庭前三天提醒规则'] },
  { module: 'calendar', code: 'calendar_time_link', name: '日历与计费联动', route: '/features/calendar_time_link', description: '将日程与计时、账单关联，避免漏记工时。', titles: ['庭审日程关联工时记录', '会议时长自动计费配置'] },

  { module: 'draft', code: 'draft_storage', name: '文档存储与管理', route: '/documents', description: '集中存储合同、证据与函件并维护版本。', titles: ['证据材料目录整理', '合同模板库分类调整'] },
  { module: 'draft', code: 'draft_template', name: '模板自动化', route: '/features/draft_template', description: '维护文书模板与变量替换规则。', titles: ['民事起诉状模板变量配置', '律师函模板批量生成设置'] },
  { module: 'draft', code: 'draft_court_form', name: '法院表格', route: '/features/draft_court_form', description: '本地演示：法院表格填写规范与草稿管理。', titles: ['立案表格填写要点清单', '管辖权异议表格草稿'] },
  { module: 'draft', code: 'draft_esign', name: '电子签名', route: '/features/draft_esign', description: '本地演示：签署流程配置与签署状态跟踪。', titles: ['和解协议签署流程配置', '客户签署待办跟踪'] },
  { module: 'draft', code: 'draft_collaboration', name: '协作与版本', route: '/features/draft_collaboration', description: '管理文档多人协作、批注与版本差异。', titles: ['许可协议第三版批注汇总', '合同修订版本对比记录'] },
  { module: 'draft', code: 'draft_word', name: 'Word集成', route: '/features/draft_word', description: '本地演示：Word 文档导入导出与格式校验。', titles: ['Word 文书导入格式校验', '批量导出文书配置演示'] },

  { module: 'communicate', code: 'comm_unified', name: '统一沟通', route: '/communications', description: '汇总邮件、电话、会议与客户消息形成统一记录。', titles: ['客户邮件往来归档', '案件沟通记录汇总'] },
  { module: 'communicate', code: 'comm_email_archive', name: '邮件归档', route: '/features/comm_email_archive', description: '本地演示：邮件归档规则与留存策略配置。', titles: ['客户邮件归档规则配置', '重要函件留存期限设置'] },
  { module: 'communicate', code: 'comm_client_portal', name: '客户门户', route: '/features/comm_client_portal', description: '本地演示：客户门户可见内容与权限配置。', titles: ['门户展示材料清单配置', '客户可见范围调整'] },
  { module: 'communicate', code: 'comm_auto_followup', name: '自动跟进', route: '/features/comm_auto_followup', description: '本地演示：按阶段触发跟进提醒与话术。', titles: ['结案后回访自动提醒', '线索沉默期跟进规则'] },
  { module: 'communicate', code: 'comm_phone_meeting', name: '电话与会议', route: '/features/comm_phone_meeting', description: '记录电话与会议要点、参会人及后续任务。', titles: ['并购进度会议纪要', '客户来电要点记录'] },
  { module: 'communicate', code: 'comm_self_service', name: '客户自助', route: '/features/comm_self_service', description: '本地演示：客户自助查询与资料下载配置。', titles: ['自助下载资料权限配置', '案件进度查询入口演示'] },

  { module: 'billing', code: 'billing_time', name: '时间记录', route: '/billing?tab=time', description: '记录工时、费率与可计费状态。', titles: ['货款纠纷案件工时补录', '并购尽调工时复核'] },
  { module: 'billing', code: 'billing_expense', name: '费用记录', route: '/billing?tab=expense', description: '登记案件相关支出与报销凭证。', titles: ['差旅费用报销登记', '诉讼费支付凭证归档'] },
  { module: 'billing', code: 'billing_rates', name: '费率与计费模式', route: '/features/billing_rates', description: '维护人员费率与计时、固定、风险代理模式。', titles: ['合伙人收费标准更新', '风险代理计费方案配置'] },
  { module: 'billing', code: 'billing_generate', name: '账单生成', route: '/billing?tab=invoices', description: '从工时与费用生成账单草稿。', titles: ['八月工时账单生成', '阶段服务费账单草稿'] },
  { module: 'billing', code: 'billing_invoice', name: '发票与发送', route: '/billing?tab=invoices', description: '账单审批后开票并记录发送情况。', titles: ['尾款发票开具与发送', '客户发票签收确认'] },
  { module: 'billing', code: 'billing_einvoice', name: '电子账单', route: '/features/billing_einvoice', description: '本地演示：电子账单模板与推送配置。', titles: ['电子账单模板配置演示', '账单推送渠道设置'] },
  { module: 'billing', code: 'billing_ar', name: '应收与催收', route: '/features/billing_ar', description: '跟踪应收账款账龄与催收进度。', titles: ['逾期应收款催收计划', '客户欠款账龄分析'] },
  { module: 'billing', code: 'billing_approval', name: '计费审批', route: '/features/billing_approval', description: '账单与折扣的审批流转记录。', titles: ['大额账单合伙人审批', '折扣申请审批记录'] },

  { module: 'accounting', code: 'payment_online', name: '在线支付', route: '/trust', description: '本地演示：在线支付渠道配置与到账通知。', titles: ['在线支付渠道配置演示', '客户扫码支付到账核对'] },
  { module: 'accounting', code: 'payment_plan', name: '支付计划', route: '/features/payment_plan', description: '制定分期付款计划并跟踪执行。', titles: ['并购服务费分期计划', '分期付款逾期提醒'] },
  { module: 'accounting', code: 'trust_accounting', name: '信托会计', route: '/trust', description: '记录信托账户存取、结转与余额。', titles: ['诉讼保证金存入登记', '律师费结转记账'] },
  { module: 'accounting', code: 'reconciliation', name: '对账', route: '/features/reconciliation', description: '本地演示：银行流水与账务记录核对。', titles: ['银行流水月度对账', '信托账户差异核查'] },
  { module: 'accounting', code: 'general_ledger', name: '总账会计', route: '/features/general_ledger', description: '本地演示：总账科目与凭证管理。', titles: ['月末结转凭证配置', '收入科目余额核对'] },
  { module: 'accounting', code: 'financial_statements', name: '财务报表', route: '/features/financial_statements', description: '本地演示：资产负债与经营报表配置。', titles: ['季度经营报表生成', '律所收入结构分析'] },
  { module: 'accounting', code: 'ap_expense', name: '应付与支出', route: '/features/ap_expense', description: '管理供应商付款与费用支出。', titles: ['专家咨询费付款登记', '供应商发票核对'] },
  { module: 'accounting', code: 'accountant_access', name: '会计协作', route: '/features/accountant_access', description: '本地演示：外部会计协作账号与权限配置。', titles: ['外聘会计只读权限配置', '交接资料清单确认'] },

  { module: 'work_ai', code: 'work_case_analysis', name: '案件分析', route: '/features/work_case_analysis', description: '本地演示：案件要素梳理与争点分析记录。', titles: ['货款纠纷争点分析记录', '竞业限制案件要素梳理'] },
  { module: 'work_ai', code: 'work_legal_research', name: '法律检索', route: '/features/work_legal_research', description: '本地演示：法规与案例检索线索管理。', titles: ['诉讼时效法规检索记录', '类案检索结果整理'] },
  { module: 'work_ai', code: 'work_strategy', name: '策略检验', route: '/features/work_strategy', description: '本地演示：诉讼策略假设与风险检验。', titles: ['和解方案风险评估', '庭审策略备选方案'] },
  { module: 'work_ai', code: 'work_drafting', name: '起草', route: '/features/work_drafting', description: '本地演示：法律文书初稿与修订记录。', titles: ['代理词初稿起草记录', '法律意见书结构提纲'] },
  { module: 'work_ai', code: 'work_doc_review', name: '文档审阅', route: '/features/work_doc_review', description: '本地演示：合同审阅要点与批注记录。', titles: ['许可协议条款审阅要点', '尽职调查文件风险标注'] },
  { module: 'work_ai', code: 'work_citation', name: '引用与验证', route: '/features/work_citation', description: '本地演示：法条与判例引用核对。', titles: ['判决引用条文核验', '案例引文出处确认'] },
  { module: 'work_ai', code: 'work_permission', name: '权限继承', route: '/features/work_permission', description: '本地演示：AI 辅助权限继承与可见范围配置。', titles: ['律师助理继承权限配置', '案件组可见范围调整'] },

  { module: 'reports', code: 'report_dashboard', name: '律所仪表盘', route: '/', description: '汇总案件、客户、财务与任务的关键经营指标。', titles: ['经营指标看板配置', '本月关键指标复盘'] },
  { module: 'reports', code: 'report_metrics', name: '核心经营指标', route: '/reports', description: '定义与跟踪律所核心 KPI 口径。', titles: ['律师创收指标口径确认', '案件转化率月度统计'] },
  { module: 'reports', code: 'report_custom', name: '自定义报告', route: '/features/report_custom', description: '配置自定义报告模板与数据维度。', titles: ['客户行业分布报告模板', '结案周期统计配置'] },
  { module: 'reports', code: 'report_acquisition', name: '获客报告', route: '/features/report_acquisition', description: '分析线索来源、渠道投放与转化效果。', titles: ['线索来源渠道分析', '市场活动转化报告'] },
  { module: 'reports', code: 'report_financial', name: '财务报告', route: '/features/report_financial', description: '汇总营收、应收与信托余额的财务分析。', titles: ['季度营收分析报告', '应收账款结构分析'] },
  { module: 'reports', code: 'report_ai_insight', name: 'AI洞察', route: '/features/report_ai_insight', description: '本地演示：记录业务趋势与风险洞察提示。', titles: ['业务趋势洞察记录', '客户流失风险提示记录'] },
  { module: 'reports', code: 'report_audit', name: '审计与可追溯', route: '/features/report_audit', description: '留存关键操作日志并支持追溯核查。', titles: ['账单修改审计日志核查', '数据导出记录追溯'] },

  { module: 'automation', code: 'auto_workflow', name: '工作流', route: '/features/auto_workflow', description: '配置审批与业务流转规则。', titles: ['立案审批流配置', '合同审阅流转规则'] },
  { module: 'automation', code: 'auto_ai_ops', name: 'AI运营辅助', route: '/features/auto_ai_ops', description: '本地演示：运营待办排序与风险提示。', titles: ['日常待办智能排序演示', '案件风险提示规则配置'] },
  { module: 'automation', code: 'auto_ai_comms', name: 'AI沟通辅助', route: '/features/auto_ai_comms', description: '本地演示：沟通话术与会议纪要辅助。', titles: ['客户回复话术模板配置', '会议纪要生成演示'] },
  { module: 'automation', code: 'auto_task', name: '任务自动化', route: '/features/auto_task', description: '按事件与期限自动创建和触发任务。', titles: ['立案后任务自动生成', '期限临近任务触发规则'] },
  { module: 'automation', code: 'auto_billing', name: '计费自动化', route: '/features/auto_billing', description: '按规则自动生成工时计费与账单。', titles: ['超时工时自动计费规则', '月度账单自动生成设置'] },
  { module: 'automation', code: 'auto_marketing', name: '营销自动化', route: '/features/auto_marketing', description: '本地演示：活动线索分配与推送规则。', titles: ['活动线索自动分配规则', '节假日祝福推送配置'] },

  { module: 'integrations', code: 'integration_email_calendar', name: '邮件与日历', route: '/features/integration_email_calendar', description: '本地演示：邮箱与日历同步参数配置。', titles: ['邮箱日历同步参数配置', '会议邀请同步测试'] },
  { module: 'integrations', code: 'integration_accounting', name: '会计', route: '/features/integration_accounting', description: '本地演示：财务软件对接与凭证推送配置。', titles: ['财务软件对接参数配置', '凭证推送测试记录'] },
  { module: 'integrations', code: 'integration_docs', name: '文档与存储', route: '/features/integration_docs', description: '本地演示：外部文档存储同步与导入。', titles: ['云盘同步目录配置', '外部文档导入测试'] },
  { module: 'integrations', code: 'integration_comms', name: '沟通与会议', route: '/features/integration_comms', description: '本地演示：会议平台与通话记录同步配置。', titles: ['会议平台账号配置', '通话记录同步演示'] },
  { module: 'integrations', code: 'integration_automation', name: '自动化与开放API', route: '/features/integration_automation', description: '本地演示：开放 API 密钥与 Webhook 回调配置。', titles: ['开放 API 密钥配置', 'Webhook 回调测试'] },
  { module: 'integrations', code: 'integration_practice', name: '执业领域应用', route: '/features/integration_practice', description: '本地演示：执业领域工具与应用接入配置。', titles: ['知识产权工具配置', '合规审查插件启用'] },
  { module: 'integrations', code: 'integration_bank', name: '银行与信用卡同步', route: '/features/integration_bank', description: '本地演示：银行与信用卡流水同步配置。', titles: ['银行账户同步配置', '信用卡支出导入测试'] },

  { module: 'security', code: 'security_auth', name: '认证与加密', route: '/features/security_auth', description: '本地演示：认证策略与敏感字段加密配置。', titles: ['双因素认证策略配置', '敏感字段加密规则'] },
  { module: 'security', code: 'security_compliance', name: '合规框架', route: '/features/security_compliance', description: '本地演示：合规检查清单与自评记录。', titles: ['数据合规检查清单', '年度合规自评记录'] },
  { module: 'security', code: 'security_ai_policy', name: 'AI数据政策', route: '/features/security_ai_policy', description: '本地演示：AI 输入数据脱敏与禁止上传规则。', titles: ['AI 输入数据脱敏规则', '禁止上传资料清单'] },
  { module: 'security', code: 'security_access', name: '访问控制', route: '/features/security_access', description: '配置角色权限与案件数据可见范围。', titles: ['案件组访问权限矩阵', '外部协作者访问期限'] },
  { module: 'security', code: 'security_account', name: '账户安全', route: '/features/security_account', description: '管理账号有效期、密码策略与停用记录。', titles: ['离职账号停用记录', '密码有效期策略配置'] },
  { module: 'security', code: 'security_governance', name: '治理', route: '/features/security_governance', description: '本地演示：数据治理决议与定期复核计划。', titles: ['数据治理委员会决议记录', '年度权限复核计划'] },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(MatterStage) private readonly stages: Repository<MatterStage>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
    @InjectRepository(Matter) private readonly matters: Repository<Matter>,
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(ConflictCheck) private readonly conflicts: Repository<ConflictCheck>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(Document) private readonly documents: Repository<Document>,
    @InjectRepository(TimeEntry) private readonly entries: Repository<TimeEntry>,
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(TrustTransaction) private readonly trust: Repository<TrustTransaction>,
    @InjectRepository(Communication) private readonly communications: Repository<Communication>,
    @InjectRepository(Note) private readonly notes: Repository<Note>,
    @InjectRepository(FeatureModuleEntity)
    private readonly featureModules: Repository<FeatureModuleEntity>,
    @InjectRepository(FeatureEntity) private readonly featureEntities: Repository<FeatureEntity>,
    @InjectRepository(FeatureRecord) private readonly featureRecords: Repository<FeatureRecord>,
  ) {}

  async seed() {
    await this.seedFeatures();
    if ((await this.users.count()) > 0) return;

    this.logger.log('首次启动，正在初始化律所演示数据...');

    await this.contacts.createQueryBuilder().delete().execute();
    await this.leads.createQueryBuilder().delete().execute();
    await this.notes.createQueryBuilder().delete().execute();

    const userEntities: User[] = [];
    for (const user of USERS) {
      userEntities.push(await this.users.save(this.users.create({ ...user, active: true, title: user.title })));
    }

    const stageEntities: MatterStage[] = [];
    for (const [index, stage] of STAGES.entries()) {
      stageEntities.push(
        await this.stages.save(
          this.stages.create({
            name: stage.name,
            position: index,
            color: stage.color,
            probability: stage.probability,
            isFinal: stage.isFinal ?? false,
          }),
        ),
      );
    }

    const clientEntities: Client[] = [];
    for (const client of CLIENTS) {
      clientEntities.push(
        await this.clients.save(
          this.clients.create({
            name: client.name,
            type: client.type,
            industry: client.industry,
            contactName: client.contactName,
            email: client.email,
            phone: client.phone,
            address: client.address,
            billingAddress: client.address,
            status: client.status,
            ownerId: userEntities[client.owner].id,
            notes: null,
          }),
        ),
      );
    }

    const contactEntities: Contact[] = [];
    for (const contact of CONTACTS) {
      contactEntities.push(
        await this.contacts.save(
          this.contacts.create({
            name: contact.name,
            clientId: clientEntities[contact.client].id,
            position: contact.position,
            email: contact.email,
            phone: contact.phone,
            mobile: contact.mobile,
            isPrimary: contact.isPrimary ?? false,
            notes: null,
          }),
        ),
      );
    }

    const matterEntities: Matter[] = [];
    for (const [index, matter] of MATTERS.entries()) {
      matterEntities.push(
        await this.matters.save(
          this.matters.create({
            title: matter.title,
            caseNumber: matter.caseNumber,
            clientId: clientEntities[matter.client].id,
            stageId: stageEntities[matter.stage].id,
            practiceArea: matter.practiceArea,
            status: matter.status,
            priority: matter.priority,
            ownerId: userEntities[matter.owner].id,
            description: `${matter.practiceArea}专项法律服务，由${userEntities[matter.owner].name}律师主办。`,
            openDate: this.daysAgo(matter.openDaysAgo),
            closeDate: matter.closeDaysAgo !== undefined ? this.daysAgo(matter.closeDaysAgo) : null,
            value: matter.value,
            position: index,
          }),
        ),
      );
    }

    const leadEntities: Lead[] = [];
    for (const lead of LEADS) {
      leadEntities.push(
        await this.leads.save(
          this.leads.create({
            name: lead.name,
            company: lead.company,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            practiceArea: lead.practiceArea,
            description: lead.description,
            status: lead.status,
            rating: lead.rating,
            conflictChecked: lead.conflictChecked ?? false,
            conflictResult: lead.conflictResult ?? null,
            ownerId: lead.owner !== undefined ? userEntities[lead.owner].id : null,
            convertedClientId: lead.converted ? clientEntities[lead.converted.client].id : null,
            convertedContactId: lead.converted ? contactEntities[lead.converted.contact].id : null,
            convertedMatterId: lead.converted ? matterEntities[lead.converted.matter].id : null,
            convertedAt: lead.converted ? this.daysAgo(lead.converted.daysAgo) : null,
          }),
        ),
      );
    }

    for (const conflict of CONFLICTS) {
      await this.conflicts.save(
        this.conflicts.create({
          name: conflict.name,
          type: conflict.type,
          result: conflict.result,
          details: conflict.details ?? null,
          checkedById: userEntities[conflict.checkedBy].id,
          matterId: conflict.matter !== undefined ? matterEntities[conflict.matter].id : null,
          createdAt: this.daysAgo(conflict.daysAgo),
        }),
      );
    }

    for (const task of TASKS) {
      const dueDate = this.inDays(task.inDays, task.hour);
      await this.tasks.save(
        this.tasks.create({
          title: task.title,
          type: task.type,
          description: task.description,
          dueDate,
          priority: task.priority,
          done: task.done ?? false,
          matterId: task.matter !== undefined ? matterEntities[task.matter].id : null,
          assigneeId: userEntities[task.assignee].id,
          completedAt: task.done ? dueDate : null,
          createdAt: this.daysAgo(Math.max(task.inDays, 0) + 20),
        }),
      );
    }

    const documentEntities: Document[] = [];
    for (const document of DOCUMENTS) {
      documentEntities.push(
        await this.documents.save(
          this.documents.create({
            title: document.title,
            category: document.category,
            fileName: document.fileName,
            version: document.version,
            matterId: document.matter !== undefined ? matterEntities[document.matter].id : null,
            clientId: clientEntities[document.client].id,
            uploadedById: userEntities[document.uploadedBy].id,
            signed: document.signed ?? false,
            description: document.description,
          }),
        ),
      );
    }

    const timeEntities: TimeEntry[] = [];
    for (const entry of TIME_ENTRIES) {
      timeEntities.push(
        await this.entries.save(
          this.entries.create({
            matterId: matterEntities[entry.matter].id,
            userId: userEntities[entry.user].id,
            date: this.daysAgo(entry.daysAgo),
            hours: entry.hours,
            description: entry.description,
            billable: entry.billable ?? true,
            rate: entry.rate,
            amount: Math.round(entry.hours * entry.rate * 100) / 100,
            invoiced: false,
            invoiceId: null,
          }),
        ),
      );
    }

    const expenseEntities: Expense[] = [];
    for (const expense of EXPENSES) {
      expenseEntities.push(
        await this.expenses.save(
          this.expenses.create({
            matterId: matterEntities[expense.matter].id,
            date: this.daysAgo(expense.daysAgo),
            category: expense.category,
            amount: expense.amount,
            description: expense.description,
            billable: expense.billable ?? true,
            invoiced: false,
            invoiceId: null,
            receipt: `receipt-${expense.matter + 1}-${expense.daysAgo}.pdf`,
          }),
        ),
      );
    }

    const invoiceEntities: Invoice[] = [];
    for (const [index, invoice] of INVOICES.entries()) {
      const items: InvoiceItem[] = [];
      for (const timeIndex of invoice.timeIndexes) {
        const entry = timeEntities[timeIndex];
        items.push({
          description: entry.description,
          quantity: entry.hours,
          rate: entry.rate,
          amount: entry.amount,
          type: 'time',
          referenceId: entry.id,
        });
      }
      for (const expenseIndex of invoice.expenseIndexes) {
        const expense = expenseEntities[expenseIndex];
        items.push({
          description: `${expense.category} · ${expense.description}`,
          quantity: 1,
          rate: expense.amount,
          amount: expense.amount,
          type: 'expense',
          referenceId: expense.id,
        });
      }
      if (invoice.manual) {
        items.push({
          description: invoice.manual.description,
          quantity: 1,
          rate: invoice.manual.amount,
          amount: invoice.manual.amount,
          type: 'manual',
        });
      }

      const subtotal = Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
      const tax = Math.round(subtotal * 0.06 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;
      const paidAmount = invoice.status === 'paid' ? total : 0;
      const issueDate = this.daysAgo(invoice.issueDaysAgo);
      const dueDate = this.inDays(invoice.dueInDays, 17);

      const entity = await this.invoices.save(
        this.invoices.create({
          number: `INV-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`,
          clientId: clientEntities[invoice.client].id,
          matterId: matterEntities[invoice.matter].id,
          status: invoice.status,
          issueDate,
          dueDate,
          subtotal,
          taxRate: 0.06,
          tax,
          total,
          paidAmount,
          notes: invoice.notes,
          items,
        }),
      );
      invoiceEntities.push(entity);

      for (const item of items) {
        if (item.type === 'time' && item.referenceId) {
          await this.entries.update(item.referenceId, { invoiced: true, invoiceId: entity.id });
        }
        if (item.type === 'expense' && item.referenceId) {
          await this.expenses.update(item.referenceId, { invoiced: true, invoiceId: entity.id });
        }
      }
    }

    const paymentData: Array<{
      invoice: number;
      amount: (invoice: Invoice) => number;
      daysAgo: number;
      method: Payment['method'];
      reference: string;
      notes: string;
    }> = [
      { invoice: 3, amount: (invoice) => Math.round(invoice.total * 0.5 * 100) / 100, daysAgo: 6, method: 'bank', reference: 'PAY-2026-0001', notes: '第一阶段部分付款' },
      { invoice: 4, amount: (invoice) => invoice.total, daysAgo: 10, method: 'etransfer', reference: 'PAY-2026-0002', notes: '全额结清' },
      { invoice: 5, amount: (invoice) => Math.round(invoice.total * 0.6 * 100) / 100, daysAgo: 12, method: 'card', reference: 'PAY-2026-0003', notes: '部分付款' },
      { invoice: 2, amount: (invoice) => Math.round(invoice.total * 0.3 * 100) / 100, daysAgo: 4, method: 'bank', reference: 'PAY-2026-0004', notes: '预付款' },
    ];
    for (const payment of paymentData) {
      const invoice = invoiceEntities[payment.invoice];
      const amount = payment.amount(invoice);
      await this.payments.save(
        this.payments.create({
          invoiceId: invoice.id,
          amount,
          date: this.daysAgo(payment.daysAgo),
          method: payment.method,
          reference: payment.reference,
          notes: payment.notes,
        }),
      );
      if (invoice.status !== 'paid') {
        invoice.paidAmount = Math.round((invoice.paidAmount + amount) * 100) / 100;
        if (invoice.paidAmount >= invoice.total) invoice.status = 'paid';
        await this.invoices.save(invoice);
      }
    }

    for (const item of TRUST) {
      await this.trust.save(
        this.trust.create({
          clientId: clientEntities[item.client].id,
          matterId: item.matter !== undefined ? matterEntities[item.matter].id : null,
          type: item.type,
          category: item.category,
          amount: item.amount,
          date: this.daysAgo(item.daysAgo),
          description: item.description,
          reference: item.reference,
          reconciled: item.reconciled ?? false,
        }),
      );
    }

    for (const item of COMMUNICATIONS) {
      await this.communications.save(
        this.communications.create({
          matterId: item.matter !== undefined ? matterEntities[item.matter].id : null,
          clientId: clientEntities[item.client].id,
          contactId: item.contact !== undefined ? contactEntities[item.contact].id : null,
          type: item.type,
          direction: item.direction,
          subject: item.subject,
          content: item.content,
          occurredAt: this.daysAgo(item.daysAgo),
          userId: userEntities[item.user].id,
        }),
      );
    }

    const targetIds: Record<Note['targetType'], number[]> = {
      matter: matterEntities.map((item) => item.id),
      client: clientEntities.map((item) => item.id),
      contact: contactEntities.map((item) => item.id),
      lead: leadEntities.map((item) => item.id),
      document: documentEntities.map((item) => item.id),
    };
    for (const note of NOTES) {
      await this.notes.save(
        this.notes.create({
          title: note.title,
          content: note.content,
          targetType: note.targetType,
          targetId: targetIds[note.target.kind][note.target.index],
          authorId: userEntities[note.author].id,
        }),
      );
    }

    this.logger.log('律所演示数据初始化完成。');
  }

  private async seedFeatures() {
    if ((await this.featureModules.count()) > 0) return;

    this.logger.log('首次启动，正在初始化全量功能目录...');

    const moduleEntities: FeatureModuleEntity[] = [];
    for (const [index, item] of FEATURE_MODULES.entries()) {
      moduleEntities.push(
        await this.featureModules.save(
          this.featureModules.create({
            code: item.code,
            name: item.name,
            description: item.description,
            position: index + 1,
          }),
        ),
      );
    }
    const moduleIds = new Map(moduleEntities.map((item) => [item.code, item.id]));

    const modulePositions = new Map<string, number>();
    for (const item of FEATURES) {
      const position = (modulePositions.get(item.module) ?? 0) + 1;
      modulePositions.set(item.module, position);
      await this.featureEntities.save(
        this.featureEntities.create({
          moduleId: moduleIds.get(item.module)!,
          code: item.code,
          name: item.name,
          description: item.description,
          route: item.route,
          position,
          enabled: true,
        }),
      );
    }

    if ((await this.featureRecords.count()) === 0) {
      const statuses: FeatureRecordStatus[] = [
        'draft',
        'active',
        'pending',
        'completed',
        'archived',
      ];
      const priorities: FeatureRecordPriority[] = ['medium', 'high', 'low', 'medium', 'high'];
      let sequence = 0;
      for (const feature of FEATURES) {
        for (const [recordIndex, title] of feature.titles.entries()) {
          const index = sequence++;
          const status = statuses[(index + recordIndex) % statuses.length];
          await this.featureRecords.save(
            this.featureRecords.create({
              featureCode: feature.code,
              title,
              description: `${feature.description}本记录用于跟踪“${title}”的处理进展。`,
              status,
              priority: priorities[index % priorities.length],
              ownerId: index % 3 === 0 ? null : (index % USERS.length) + 1,
              ownerName: index % 3 === 0 ? null : USERS[index % USERS.length].name,
              matterId: index % 4 === 0 ? (index % 12) + 1 : null,
              clientId: index % 4 === 0 ? (index % 6) + 1 : null,
              dueDate: index % 2 === 0 ? this.inDays((index % 14) + 2, 17) : null,
              amount: index % 4 === 1 ? 1200 + (index % 6) * 800 : null,
              data:
                index % 3 === 0
                  ? { source: 'seed', module: feature.module, tags: [feature.name, status] }
                  : null,
            }),
          );
        }
      }
    }

    this.logger.log(
      `功能目录初始化完成：${FEATURE_MODULES.length} 个一级模块、${FEATURES.length} 个二级功能、${FEATURES.length * 2} 条功能记录。`,
    );
  }

  private daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(10, 0, 0, 0);
    return date;
  }

  private inDays(days: number, hour: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date;
  }
}

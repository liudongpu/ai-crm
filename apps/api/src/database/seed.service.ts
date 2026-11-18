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
  ) {}

  async seed() {
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

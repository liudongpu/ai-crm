import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { addDays, computeDeadlineItems, CourtRuleStep, toIsoEndOfDay } from '../common/calendar-rules.util';
import {
  CalendarDraftEvent,
  CalendarReminder,
  Client,
  Communication,
  ConflictCheck,
  Contact,
  CourtHoliday,
  CourtRule,
  DeadlineCalculation,
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
  MatterParty,
  MatterStage,
  MatterCategory,
  MatterCategoryStage,
  MatterTeamMember,
  MessageTemplate,
  Note,
  Payment,
  RolePermission,
  Statute,
  Task,
  TaskTemplate,
  TimeEntry,
  TrustTransaction,
  User,
  WorkspaceItem,
  WorkspaceSetting,
} from './entities';
import { WORKSPACE_DEFINITIONS } from '../modules/platform/workspace/workspace-definitions';

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

const categoryFlow = (names: string[]): MatterCategoryStage[] =>
  names.map((name, index) => {
    const durationDays = index === names.length - 1 ? 3 : 7 + index * 2;
    return {
      name,
      color: STAGES[index % STAGES.length].color,
      probability: Math.round(((index + 1) / names.length) * 100),
      isFinal: index === names.length - 1,
      durationDays,
      tasks: [
        { name: `${name}启动确认`, dueDay: 1, skippable: false },
        { name: `${name}阶段复核`, dueDay: Math.max(2, Math.round(durationDays / 2)), skippable: true },
      ],
    };
  });

/** 案例分类（案件类型）及其默认流程模板，参照 Lex Passage「Matter types · Flows」。 */
const DEFAULT_MATTER_CATEGORIES: Array<{
  code: string;
  name: string;
  color: string;
  description: string;
  stages: string[];
}> = [
  { code: 'contract', name: '合同纠纷', color: '#1b365d', description: '买卖、服务与各类合同履约争议', stages: ['咨询评估', '合同审阅', '证据收集', '谈判/庭审', '结案归档'] },
  { code: 'labor', name: '劳动法律', color: '#3b82f6', description: '竞业限制、用工合规与劳动争议', stages: ['事实梳理', '制度审查', '证据收集', '仲裁/诉讼', '结案归档'] },
  { code: 'merger', name: '并购重组', color: '#6366f1', description: '股权并购、资产重组与专项尽调', stages: ['立项评估', '尽职调查', '交易谈判', '协议签署', '交割归档'] },
  { code: 'ip', name: '知识产权', color: '#8b5cf6', description: '著作权、商标、专利与许可维权', stages: ['权利核查', '侵权取证', '维权方案', '行政/诉讼', '结案归档'] },
  { code: 'medical', name: '医疗纠纷', color: '#ec4899', description: '医疗损害责任与医患争议处理', stages: ['病历调取', '损害评估', '鉴定准备', '调解/庭审', '结案归档'] },
  { code: 'commercial', name: '商事诉讼', color: '#f59e0b', description: '商事合同、运输与货款争议', stages: ['立案评估', '财产保全', '证据交换', '开庭审理', '执行归档'] },
  { code: 'company', name: '公司法', color: '#2c6b8f', description: '股权转让、公司治理与股东争议', stages: ['诉求梳理', '章程审查', '证据收集', '谈判/诉讼', '结案归档'] },
  { code: 'compliance', name: '合规审查', color: '#22c55e', description: '数据、金融与经营合规专项审查', stages: ['范围确认', '资料收集', '风险识别', '整改复核', '报告归档'] },
  { code: 'family', name: '婚姻家庭', color: '#d97706', description: '婚姻财产、继承与家事争议', stages: ['初次面谈', '财产梳理', '调解准备', '庭审/调解', '结案归档'] },
  { code: 'data', name: '数据合规', color: '#0ea5e9', description: '数据出境、隐私与个人信息保护', stages: ['需求确认', '数据盘点', '差距分析', '整改落地', '报告归档'] },
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

/** 法院通知正文样例：供 AI 日历识别页直接选择文档使用。 */
const DOCUMENT_CONTENTS: Record<string, string> = {
  货款催告律师函:
    '北京市海淀区人民法院通知：本案定于2026年12月15日开庭审理，请于2026年12月8日提交证据目录及原件核对材料。',
  证据目录与说明:
    '证据交换会议定于2026年12月2日举行，各方应于2026年11月30日前完成证据清单确认。',
  著作权授权许可协议: '许可协议谈判会议安排在2026年12月5日，届时需确认最终授权范围。',
  起诉状模板: '立案通知书载明：举证期限为2026年12月20日，逾期提交的不利后果由当事人承担。',
  和解协议草案: '调解会谈定于2026年12月12日，请当事人准备财产清单与收入证明。',
  尽职调查报告: '并购项目尽调资料补充截止日期为2026年12月9日，逾期将影响交割安排。',
};



const COURT_RULES: Array<{
  code: string;
  name: string;
  jurisdiction: string;
  description: string;
  steps: CourtRuleStep[];
}> = [
  {
    code: 'civil_first_instance',
    name: '民事一审期限规则',
    jurisdiction: 'CN',
    description: '举证期限、证据交换与开庭准备的标准期限链。',
    steps: [
      { code: 'evidence', label: '举证期限', offsetDays: 15, base: 'trigger', businessDays: true },
      { code: 'exchange', label: '证据交换', offsetDays: 3, base: 'evidence', businessDays: true },
      { code: 'hearing_prep', label: '开庭准备', offsetDays: 10, base: 'exchange', businessDays: true },
    ],
  },
  {
    code: 'appeal',
    name: '上诉期限规则',
    jurisdiction: 'CN',
    description: '判决送达后的上诉期限与被上诉人答辩期限。',
    steps: [
      { code: 'appeal', label: '上诉期限', offsetDays: 15, base: 'trigger' },
      { code: 'reply', label: '答辩期限', offsetDays: 15, base: 'appeal' },
    ],
  },
  {
    code: 'arbitration',
    name: '仲裁期限规则',
    jurisdiction: 'CN',
    description: '仲裁答辩与开庭准备的期限安排。',
    steps: [
      { code: 'answer', label: '答辩书提交', offsetDays: 10, base: 'trigger', businessDays: true },
      { code: 'hearing', label: '仲裁开庭准备', offsetDays: 7, base: 'answer', businessDays: true },
    ],
  },
];

const COURT_HOLIDAYS: Array<{ date: string; name: string }> = [
  { date: '2026-01-01', name: '元旦' },
  { date: '2026-02-17', name: '春节（除夕）' },
  { date: '2026-02-18', name: '春节' },
  { date: '2026-02-19', name: '春节' },
  { date: '2026-04-05', name: '清明节' },
  { date: '2026-05-01', name: '劳动节' },
  { date: '2026-06-19', name: '端午节' },
  { date: '2026-10-01', name: '国庆节' },
];

const CALENDAR_DEADLINES: Array<{
  rule: number;
  title: string;
  matter: number;
  owner: number;
  daysAgo: number;
  note: string;
  status: DeadlineCalculation['status'];
}> = [
  {
    rule: 0,
    title: '货款纠纷一审期限链',
    matter: 0,
    owner: 0,
    daysAgo: 10,
    note: '依据法院送达回证起算，遇节假日顺延。',
    status: 'draft',
  },
  {
    rule: 1,
    title: '物流合同案上诉期限',
    matter: 6,
    owner: 1,
    daysAgo: 4,
    note: '判决送达后起算上诉与答辩期限。',
    status: 'confirmed',
  },
];

const STATUTES_SEED: Array<{
  title: string;
  matter: number;
  causeDaysAgo: number;
  periodDays: number;
  alertDays: number;
  status: Statute['status'];
  owner: number;
  note: string;
}> = [
  {
    title: '软件买卖合同货款纠纷诉讼时效',
    matter: 0,
    causeDaysAgo: 1075,
    periodDays: 1095,
    alertDays: 30,
    status: 'tracking',
    owner: 0,
    note: '临近到期，需确认是否存在时效中断事由。',
  },
  {
    title: '医疗服务责任纠纷侵权时效',
    matter: 4,
    causeDaysAgo: 1200,
    periodDays: 1095,
    alertDays: 45,
    status: 'tracking',
    owner: 1,
    note: '已过期间，核查立案时间与时效中断证据。',
  },
  {
    title: '遗产继承纠纷时效（已结案）',
    matter: 10,
    causeDaysAgo: 1400,
    periodDays: 1095,
    alertDays: 30,
    status: 'completed',
    owner: 0,
    note: '案件已调解结案，时效台账归档。',
  },
];

const CALENDAR_REMINDERS: Array<{
  task: number;
  channel: CalendarReminder['channel'];
  recipient: string | null;
  leadMinutes: number;
  status: CalendarReminder['status'];
  message: string;
}> = [
  { task: 4, channel: 'in_app', recipient: null, leadMinutes: 1440, status: 'pending', message: '物流合同纠纷庭审明日开始，请确认出庭材料。' },
  { task: 5, channel: 'email', recipient: 'li.jing@lexdesk.cn', leadMinutes: 4320, status: 'pending', message: '证据交换会议提醒。' },
  { task: 6, channel: 'sms', recipient: '138 0000 1201', leadMinutes: 60, status: 'sent', message: '提交起诉状期限即将届满。' },
  { task: 8, channel: 'in_app', recipient: null, leadMinutes: 120, status: 'pending', message: '婚姻案件调解准备提醒。' },
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
  unread?: boolean;
  replied?: boolean;
  needsFollowUp?: boolean;
  internal?: boolean;
}> = [
  { matter: 0, client: 0, contact: 0, type: 'email', direction: 'outbound', subject: '关于货款纠纷和解方案', content: '已向对方发送和解方案，请确认可接受范围。', daysAgo: 1, user: 0 },
  { matter: 0, client: 0, contact: 0, type: 'wechat', direction: 'inbound', subject: '客户微信询问进展', content: '陈律师您好，昨天发您的和解方案我方还在内部讨论，请问对方最低能接受多少？', daysAgo: 1, user: 0, unread: true, needsFollowUp: true },
  { matter: 0, client: 0, contact: 0, type: 'call', direction: 'inbound', subject: '客户来电询问进展', content: '客户希望本周内收到庭审排期信息。', daysAgo: 2, user: 3 },
  { matter: 2, client: 1, contact: 2, type: 'meeting', direction: 'outbound', subject: '并购项目进度会', content: '讨论尽调发现的问题及交易价格调整方案。', daysAgo: 3, user: 1 },
  { matter: 4, client: 1, contact: 3, type: 'email', direction: 'inbound', subject: '病历资料补充', content: '王律师您好，我补充了住院期间的护理记录，请问还需要其他材料吗？', daysAgo: 5, user: 1, unread: true },
  { matter: 6, client: 2, contact: 4, type: 'sms', direction: 'outbound', subject: '庭审时间提醒', content: '已提醒客户庭审时间与地点。', daysAgo: 7, user: 2 },
  { matter: 6, client: 2, contact: 4, type: 'meeting', direction: 'inbound', subject: '证据准备会议', content: '确认第二批证据材料清单。', daysAgo: 10, user: 0 },
  { matter: 3, client: 0, contact: 0, type: 'email', direction: 'outbound', subject: '许可协议修订稿', content: '发送第三版许可协议修订稿供审阅。', daysAgo: 12, user: 1 },
  { matter: 3, client: 0, contact: 0, type: 'internal', direction: 'outbound', subject: '内部备注：许可协议风险点', content: '第三版对违约责任条款做了让步，需合伙人确认后再发客户。', daysAgo: 12, user: 1, internal: true },
  { matter: 8, client: 1, contact: 2, type: 'letter', direction: 'outbound', subject: '合规审查阶段报告', content: '寄送数据合规阶段性报告。', daysAgo: 18, user: 2 },
  { matter: 9, client: 4, contact: 6, type: 'call', direction: 'inbound', subject: '调解意向沟通', content: '客户愿意接受调解，需准备财产清单。', daysAgo: 21, user: 1 },
  { matter: 11, client: 3, contact: 5, type: 'message', direction: 'outbound', subject: '案件结果通知', content: '商标异议复审结果已通知客户。', daysAgo: 45, user: 2 },
  { client: 5, type: 'portal', direction: 'inbound', subject: '客户门户留言', content: '请问遗产继承案件的进度如何？上次说的财产清单我已上传。', daysAgo: 2, user: 3, unread: true, needsFollowUp: true },
];

/** M7 消息模板（8 个），从参考文档对齐。 */
const MESSAGE_TEMPLATES: Array<{
  code: string;
  name: string;
  category: string;
  content: string;
}> = [
  { code: 'ack', name: '收到确认', category: '通用', content: '您好，您的消息已收到，我们会尽快核实并回复。如有紧急事项，可直接电话联系主办律师。' },
  { code: 'progress', name: '案件进展同步', category: '案件', content: '您好，关于{案件名称}，目前案件进展为：{进展说明}。下一步我们将{下一步安排}，预计在{时间}向您同步最新情况。' },
  { code: 'doc_request', name: '材料补充请求', category: '案件', content: '您好，为推进{案件名称}，请您补充以下材料：{材料清单}。您可通过客户门户上传，或发送至主办律师邮箱。' },
  { code: 'meeting_notice', name: '会议通知', category: '案件', content: '您好，现约您于{时间}就{案件名称}进行沟通，地点/方式为{地点}。如时间不便，请及时告知我们调整。' },
  { code: 'deadline_reminder', name: '期限提醒', category: '期限', content: '您好，提醒您{案件名称}的相关期限为{日期}。请在此之前准备{所需事项}，以免耽误案件推进。' },
  { code: 'invoice_notice', name: '账单通知', category: '财务', content: '您好，{案件名称}的账单{账单编号}已生成，金额{金额}，请于{到期日}前完成付款。如有疑问欢迎联系财务。' },
  { code: 'payment_received', name: '收款确认', category: '财务', content: '您好，我们已收到您的付款{金额}，感谢配合。收款将记入{案件名称}的账户，明细可随时向我们索取。' },
  { code: 'closing', name: '结案通知', category: '案件', content: '您好，{案件名称}已办结。感谢您的信任，后续如有需要我们随时为您提供法律支持。' },
];

/** 角色权限矩阵（4 类角色 + 管理员）。 */
const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  admin: {
    'dashboard.firm': true, 'matter.all': true, 'invoice.approve': true, 'invoice.send': true,
    'finance.manage': true, 'communication.internal': true, 'user.manage': true, 'ai.use': true,
  },
  partner: {
    'dashboard.firm': true, 'matter.all': true, 'invoice.approve': true, 'invoice.send': true,
    'finance.manage': true, 'communication.internal': true, 'user.manage': true, 'ai.use': true,
  },
  associate: {
    'dashboard.firm': false, 'matter.all': false, 'invoice.approve': false, 'invoice.send': false,
    'finance.manage': false, 'communication.internal': true, 'user.manage': false, 'ai.use': true,
  },
  assistant: {
    'dashboard.firm': false, 'matter.all': false, 'invoice.approve': false, 'invoice.send': false,
    'finance.manage': false, 'communication.internal': true, 'user.manage': false, 'ai.use': false,
  },
  accountant: {
    'dashboard.firm': true, 'matter.all': false, 'invoice.approve': false, 'invoice.send': true,
    'finance.manage': true, 'communication.internal': false, 'user.manage': false, 'ai.use': false,
  },
};

/** 任务模板（办案常用清单）。 */
const TASK_TEMPLATES: Array<{
  name: string;
  category: string;
  title: string;
  type: TaskTemplate['type'];
  priority: TaskTemplate['priority'];
  description: string;
  dueInDays: number;
}> = [
  { name: '案件启动清单', category: '案件', title: '案件启动：核对委托手续与材料清单', type: 'task', priority: 'high', description: '签署委托代理合同、授权委托书，收集案件基础材料。', dueInDays: 3 },
  { name: '证据收集', category: '案件', title: '证据收集：整理证据目录并催要缺失材料', type: 'task', priority: 'high', description: '按证据清单逐项核对，标注缺失项并联系客户补充。', dueInDays: 7 },
  { name: '庭审准备', category: '庭审', title: '庭审准备：完成代理词与证据装订', type: 'hearing', priority: 'high', description: '准备庭审提纲、代理词，整理证据原件与复印件。', dueInDays: 14 },
  { name: '结案归档', category: '结案', title: '结案归档：整理卷宗并通知客户', type: 'task', priority: 'medium', description: '按归档清单整理卷宗，同步结案文书与费用结算。', dueInDays: 30 },
  { name: '客户回访', category: '客户', title: '客户回访：确认满意度与后续需求', type: 'reminder', priority: 'low', description: '结案后回访客户，记录反馈与潜在二次委托机会。', dueInDays: 45 },
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
  { code: 'dashboard', name: '工作台', description: '每天打开就知道要做什么：待办、日程、风险预警、快捷新建与 5 张核心经营报表。' },
  { code: 'acquire', name: '获客客户', description: '线索 → 冲突审查 → 咨询 → 签约 → 客户与案件，不污染案件数据。' },
  { code: 'matters', name: '案件中心', description: '打开案件就能办案：当事人团队、任务、期限、日历、文档与电子签名。' },
  { code: 'legal_ai', name: '法律AI', description: '卷宗智能解析、文书起草审查、合同风控、法规类案检索与行政事务助手；基于本地规则与真实业务数据生成草稿，均需人工核对。' },
  { code: 'legal_toolbox', name: '律师工具箱', description: '诉讼执行费用、利息与赔偿测算、诉讼期限推算、证据文档处理与企业工商失信速查；计算结果可一键结构化保存至当前案件。' },
  { code: 'finance', name: '计费财务', description: '工时 → 费用 → 账单 → 审批 → 发送 → 收款的闭环，含信托与总账对账。' },
  { code: 'settings', name: '设置安全', description: '人员、角色权限、安全合规、数据政策与审计追溯。' },
  { code: 'communication', name: '沟通中心', description: '一个收件箱聚合多渠道沟通，自动归档到案件，模板与 AI 起草需人工确认。' },
  { code: 'other', name: '其他', description: '无法归入上述模块的营销、自动化与第三方集成配置。' },
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
  // ── M1 工作台 ────────────────────────────────────────────────
  { module: 'dashboard', code: 'dash_workbench', name: '我的工作台', route: '/', description: '默认工作台：案件按阶段泳道展示，拖拽卡片即可更新阶段；已归档泳道仅显示最近 10 条。', titles: ['案件阶段看板推进记录', '风险预警处理记录'] },
  { module: 'dashboard', code: 'dash_schedule', name: '日程', route: '/schedule', description: '按日、周、月查看与新建日程，支持按日历、类型、负责人、时间和状态筛选；点击日期或时间格即可快速安排事项。', titles: ['本周日程安排与提醒', '庭审与截止日期日程复核'] },
  { module: 'dashboard', code: 'dash_dashboard', name: '经营仪表盘', route: '/dashboard', description: '待办、今日日程、我的案件、风险预警与快捷新建，掌握律所整体经营情况。', titles: ['本周待办与日程复盘', '风险预警处理记录'] },
  { module: 'dashboard', code: 'dash_reports', name: '核心报表', route: '/reports', description: '收入、应收、工时、案件、客户 5 张核心报表与经营概览。', titles: ['本月收入与应收分析', '律师工时与案件分布复盘'] },
  { module: 'dashboard', code: 'report_custom', name: '自定义报告', route: '/workspace/report_custom', description: '配置自定义报告模板与数据维度。', titles: ['客户行业分布报告模板', '结案周期统计配置'] },

  // ── M2 获客客户 ──────────────────────────────────────────────
  { module: 'acquire', code: 'acq_leads', name: '线索管理', route: '/leads', description: '线索登记、跟进、资格筛查与转化，统一记录客户与跟进历史。', titles: ['星海科技线索分配与跟进', '季度商机转化漏斗复盘'] },
  { module: 'acquire', code: 'acq_clients', name: '客户档案', route: '/clients', description: '客户信息、联系人与历史案件，一个客户可有多个案件。', titles: ['常年法律顾问客户档案完善', '重点客户联系人变更记录'] },
  { module: 'acquire', code: 'acq_contacts', name: '联系人', route: '/contacts', description: '维护客户方联系人、职务与沟通偏好。', titles: ['对方当事人联系人登记', '客户对接人信息更新'] },
  { module: 'acquire', code: 'grow_conflict', name: '冲突审查', route: '/workspace/grow_conflict', description: '委托前检索利益冲突并留存结论，未通过不可签约建案。', titles: ['股权转让案冲突检索记录', '潜在客户同名主体核查'] },
  { module: 'acquire', code: 'grow_appointment', name: '咨询预约', route: '/workspace/grow_appointment', description: '登记初次咨询与预约，形成标准化 intake 记录。', titles: ['并购项目初次面谈预约', '官网咨询 intake 信息补全'] },
  { module: 'acquire', code: 'grow_engagement', name: '签约转化', route: '/workspace/grow_engagement', description: '管理报价、合同签署与委托转正式客户的转化。', titles: ['常年法律顾问报价审批', '委托合同签署与归档'] },
  { module: 'acquire', code: 'comm_client_portal', name: '客户门户', route: '/workspace/comm_client_portal', description: '客户查看进度、交材料、看账单与付款，含自助查询配置。', titles: ['门户展示材料清单配置', '客户自助下载权限调整'] },

  // ── M3 案件中心 ──────────────────────────────────────────────
  { module: 'matters', code: 'mat_cases', name: '案件档案', route: '/matters', description: '案件立卷、当事人与团队、活动时间线及案卷归档。', titles: ['货款纠纷案卷材料清单', '医疗纠纷案件时间轴梳理'] },
  { module: 'matters', code: 'mat_tasks', name: '任务与流程', route: '/tasks', description: '任务分派、进度、截止日期与办案流程模板，一键生成任务。', titles: ['证据交换任务分派', '商事诉讼流程模板启用'] },
  { module: 'matters', code: 'mat_calendar', name: '日历管理', route: '/calendar', description: '按案件组织日历事件，维护可见性与提醒。', titles: ['下周庭审日历排期', '团队共享日历订阅'] },
  { module: 'matters', code: 'mat_deadlines', name: '截止日期计算', route: '/calendar/deadlines', description: '按法院规则生成期限链，支持重算与节假日顺延。', titles: ['上诉期限自动计算规则', '举证期限计算结果复核'] },
  { module: 'matters', code: 'mat_statute', name: '时效管理', route: '/calendar/statutes', description: '诉讼时效台账与到期预警。', titles: ['著作权维权时效预警', '应收账款诉讼时效台账'] },
  { module: 'matters', code: 'mat_calendar_ai', name: 'AI日历辅助', route: '/calendar/assistant', description: '从通知文本识别日期，生成待人工确认的日程草稿。', titles: ['会议纪要日程提取记录', '期限提醒文案生成记录'] },
  { module: 'matters', code: 'mat_sync', name: '同步与提醒', route: '/calendar/sync', description: 'ICS 日历导入导出与提醒队列。', titles: ['日历文件导入导出记录', '开庭前三天提醒规则'] },
  { module: 'matters', code: 'mat_time_link', name: '日历计费联动', route: '/calendar/time-link', description: '未记工时日程与工时记录联动。', titles: ['庭审日程关联工时记录', '会议时长自动计费配置'] },
  { module: 'matters', code: 'mat_documents', name: '文档管理', route: '/documents', description: '文档存储、模板、法院表格与协作版本统一管理。', titles: ['证据材料目录整理', '许可协议第三版批注汇总'] },
  { module: 'matters', code: 'draft_esign', name: '电子签名', route: '/workspace/draft_esign', description: '签署流程配置与签署状态跟踪，保留审计轨迹。', titles: ['和解协议签署流程配置', '客户签署待办跟踪'] },

  // ── M4 法律 AI ───────────────────────────────────────────────
  { module: 'legal_ai', code: 'work_case_analysis', name: '卷宗智能解析', route: '/workspace/work_case_analysis', description: '批量归集卷宗材料，自动提取时间线、当事人关系图谱与核心争议焦点，生成案件初筛摘要。', titles: ['货款纠纷卷宗时间线解析', '竞业限制争点与证据缺口分析'] },
  { module: 'legal_ai', code: 'work_legal_research', name: '法规类案检索', route: '/workspace/work_legal_research', description: '自然语言检索法规与类案，结论强制附精确法条原文及有效状态校验，杜绝模型幻觉。', titles: ['诉讼时效法规原文核验', '货款纠纷类案要旨检索'] },
  { module: 'legal_ai', code: 'work_drafting', name: '智能文书起草', route: '/workspace/work_drafting', description: '结合案件事实与本所历史范本，一键生成起诉状、律师函、答辩状或法律意见书初稿，须人工确认。', titles: ['货款纠纷起诉状初稿', '律师函初稿与人工核对清单'] },
  { module: 'legal_ai', code: 'work_doc_review', name: '合同智能风控', route: '/workspace/work_doc_review', description: '按我方立场标出风险条款与缺失条款，附法条依据及可一键替换的修订建议。', titles: ['许可协议责任限制条款审查', '买卖合同缺失条款补充建议'] },
  { module: 'legal_ai', code: 'report_ai_insight', name: 'AI洞察', route: '/workspace/report_ai_insight', description: '按统计周期读取真实案件/工时/账单/沟通数据，本地规则生成经营趋势对比、待办智能排序、风险提示与客户活跃度，输出为需人工复核的草稿。', titles: ['业务趋势洞察记录', '案件风险提示规则配置'] },
  { module: 'legal_ai', code: 'auto_ai_comms', name: '行政事务助手', route: '/workspace/auto_ai_comms', description: '将办案日志润色为客户案件周报，并从文书识别到期日、建议添加日历提醒，发送与添加均需人工确认。', titles: ['客户案件周报生成记录', '文书到期日识别与提醒确认'] },

  // ── M5 律师工具箱 ────────────────────────────────────────────
  { module: 'legal_toolbox', code: 'tool_fee', name: '诉讼执行计算器', route: '/tools/litigation-fee', description: '诉讼费、保全费、仲裁费分段精确计算，支持各地标准与减半规则；一键保存结果至当前案件。', titles: ['货款纠纷诉讼费测算', '财产保全费与仲裁费估算'] },
  { module: 'legal_toolbox', code: 'tool_interest', name: '利息测算器', route: '/tools/interest', description: '迟延履行期间加倍部分债务利息与 LPR 分段计息（单利/按年/按月复利），一键保存结果至当前案件。', titles: ['货款本金迟延履行利息测算', 'LPR 分段复利计算记录'] },
  { module: 'legal_toolbox', code: 'tool_compensation', name: '赔偿测算器', route: '/tools/compensation', description: '人身损害赔偿、工伤赔偿（含工亡）与劳动经济补偿金 N/N+1/2N 测算，一键保存结果至当前案件。', titles: ['人身损害赔偿项目测算', '违法解除 2N 赔偿金测算'] },
  { module: 'legal_toolbox', code: 'tool_deadline', name: '诉讼期限推算器', route: '/tools/deadline', description: '上诉期、举证期、答辩期、申请执行期推算，自动排除周末与法院法定节假日后顺延。', titles: ['一审判决上诉期截止日推算', '举证期限节假日顺延计算'] },
  { module: 'legal_toolbox', code: 'tool_evidence', name: '证据文档处理', route: '/tools/evidence', description: '敏感信息一键脱敏、证据目录与页码自动编排；OCR 双层 PDF 为本地演示登记，明确标注未真实识别。', titles: ['证据材料身份证号脱敏', '证据目录页码编排生成'] },
  { module: 'legal_toolbox', code: 'tool_company', name: '企业工商失信速查', route: '/tools/company', description: '本地演示主体库查询股权穿透、涉诉、被执行与限高信息，可导入客户或相对方档案；明确标注非实时数据。', titles: ['相对方企业失信信息速查', '客户股权穿透图核对'] },

  // ── M6 计费财务 ──────────────────────────────────────────────
  { module: 'finance', code: 'fin_time', name: '时间记录', route: '/billing?tab=time', description: '当天记工时，支持一键计时器与可计费状态。', titles: ['货款纠纷案件工时补录', '并购尽调工时复核'] },
  { module: 'finance', code: 'fin_expense', name: '费用记录', route: '/billing?tab=expense', description: '登记案件相关支出与报销凭证。', titles: ['差旅费用报销登记', '诉讼费支付凭证归档'] },
  { module: 'finance', code: 'billing_rates', name: '费率与计费模式', route: '/workspace/billing_rates', description: '维护人员费率与计时、固定、分阶段、预付模式。', titles: ['合伙人收费标准更新', '风险代理计费方案配置'] },
  { module: 'finance', code: 'fin_invoices', name: '账单与发送', route: '/billing?tab=invoices', description: '工时生成账单草稿、合伙人审批后发送并记录收款。', titles: ['八月工时账单生成', '尾款发票开具与发送'] },
  { module: 'finance', code: 'billing_ar', name: '应收与催收', route: '/workspace/billing_ar', description: '跟踪应收账款账龄与催收进度。', titles: ['逾期应收款催收计划', '客户欠款账龄分析'] },
  { module: 'finance', code: 'payment_online', name: '收款与支付计划', route: '/workspace/payment_online', description: '在线支付渠道配置、到账通知与分期付款计划。', titles: ['在线支付渠道配置演示', '并购服务费分期计划'] },
  { module: 'finance', code: 'fin_trust', name: '信托会计', route: '/trust', description: '信托账户与运营账户分开，记录存取、结转与余额。', titles: ['诉讼保证金存入登记', '律师费结转记账'] },
  { module: 'finance', code: 'reconciliation', name: '对账', route: '/workspace/reconciliation', description: '银行流水与账务记录核对，信托每月对账。', titles: ['银行流水月度对账', '信托账户差异核查'] },
  { module: 'finance', code: 'general_ledger', name: '总账与报表', route: '/workspace/general_ledger', description: '总账科目、凭证、财务报表、应付支出与会计协作。', titles: ['月末结转凭证配置', '季度经营报表生成'] },

  // ── M7 设置与安全 ────────────────────────────────────────────
  { module: 'settings', code: 'set_users', name: '人员与角色', route: '/settings', description: '员工档案、律师档案与 4 类角色管理。', titles: ['新入职律师账号配置', '角色职责说明更新'] },
  { module: 'settings', code: 'set_permissions', name: '角色权限', route: '/settings?tab=permissions', description: '角色权限矩阵与案件级可见范围，配置持久化。', titles: ['账单审批权限矩阵调整', '案件团队可见范围配置'] },
  { module: 'settings', code: 'set_categories', name: '案件类型', route: '/settings?tab=categories', description: '维护案件类型（对应案件业务领域）及每类案件的阶段、停留时长与阶段任务流程，支持新增、编辑、停用与拖拽排序。', titles: ['合同纠纷分类流程调整', '知识产权分类模板复核'] },
  { module: 'settings', code: 'security_auth', name: '安全与合规', route: '/workspace/security_auth', description: '认证加密、合规框架、账户安全与数据治理。', titles: ['双因素认证策略配置', '年度合规自评记录'] },
  { module: 'settings', code: 'security_access', name: '访问控制', route: '/workspace/security_access', description: '角色权限与案件数据可见范围配置。', titles: ['案件组访问权限矩阵', '外部协作者访问期限'] },
  { module: 'settings', code: 'security_ai_policy', name: 'AI数据政策', route: '/workspace/security_ai_policy', description: 'AI 输入数据脱敏与客户信息禁止外传规则。', titles: ['AI 输入数据脱敏规则', '禁止上传资料清单'] },
  { module: 'settings', code: 'report_audit', name: '审计追溯', route: '/workspace/report_audit', description: '关键操作日志与数据导出记录，支持追溯核查。', titles: ['账单修改审计日志核查', '数据导出记录追溯'] },

  // ── M8 沟通中心 ──────────────────────────────────────────────
  { module: 'communication', code: 'comm_inbox', name: '统一收件箱', route: '/communications', description: '微信、邮件、短信、门户消息聚合归档，模板、AI 起草与内部备注严格隔离。', titles: ['客户邮件往来归档', '案件沟通记录汇总'] },
  { module: 'communication', code: 'comm_phone_meeting', name: '电话与会议', route: '/workspace/comm_phone_meeting', description: '记录电话与会议要点、参会人及后续任务。', titles: ['并购进度会议纪要', '客户来电要点记录'] },
  { module: 'communication', code: 'comm_auto_followup', name: '自动跟进', route: '/workspace/comm_auto_followup', description: '按阶段触发跟进提醒与话术，需跟进消息自动进待办。', titles: ['结案后回访自动提醒', '线索沉默期跟进规则'] },

  // ── 其他 ────────────────────────────────────────────────────
  { module: 'other', code: 'grow_marketing', name: '营销与转介绍', route: '/workspace/grow_marketing', description: '营销活动、渠道素材、口碑与转介绍及营销自动化配置。', titles: ['知识产权主题沙龙策划', '结案客户满意度回访'] },
  { module: 'other', code: 'manage_mobile_access', name: '移动与访问', route: '/workspace/manage_mobile_access', description: '配置移动端访问方式与外出办案权限。', titles: ['外出庭审移动访问配置', '助理移动端权限调整'] },
  { module: 'other', code: 'draft_word', name: 'Word集成', route: '/workspace/draft_word', description: 'Word 文档导入导出与格式校验的本地配置。', titles: ['Word 文书导入格式校验', '批量导出文书配置演示'] },
  { module: 'other', code: 'auto_workflow', name: '工作流', route: '/workspace/auto_workflow', description: '审批与业务流转规则配置。', titles: ['立案审批流配置', '合同审阅流转规则'] },
  { module: 'other', code: 'auto_task', name: '任务自动化', route: '/workspace/auto_task', description: '按事件与期限自动创建和触发任务。', titles: ['立案后任务自动生成', '期限临近任务触发规则'] },
  { module: 'other', code: 'auto_billing', name: '计费自动化', route: '/workspace/auto_billing', description: '按规则自动生成工时计费与账单。', titles: ['超时工时自动计费规则', '月度账单自动生成设置'] },
  { module: 'other', code: 'integration_email_calendar', name: '集成配置', route: '/workspace/integration_email_calendar', description: '邮件、日历、会计、文档与会议等第三方集成参数配置。', titles: ['邮箱日历同步参数配置', '会议平台账号配置'] },
  { module: 'other', code: 'integration_practice', name: '执业领域应用', route: '/workspace/integration_practice', description: '执业领域工具与应用接入配置。', titles: ['知识产权工具配置', '合规审查插件启用'] },
  { module: 'other', code: 'integration_bank', name: '银行同步', route: '/workspace/integration_bank', description: '银行与信用卡流水同步配置。', titles: ['银行账户同步配置', '信用卡支出导入测试'] },
];

/** 真实业务页面无需通用功能记录；仅 /workspace 工作台功能生成演示记录。 */
const NON_WORKSPACE_FEATURE_CODES = FEATURES.filter(
  (feature) => !feature.route.startsWith('/workspace/'),
).map((feature) => feature.code);

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(MatterStage) private readonly stages: Repository<MatterStage>,
    @InjectRepository(MatterCategory)
    private readonly matterCategories: Repository<MatterCategory>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
    @InjectRepository(Matter) private readonly matters: Repository<Matter>,
    @InjectRepository(MatterParty) private readonly matterParties: Repository<MatterParty>,
    @InjectRepository(MatterTeamMember)
    private readonly matterTeams: Repository<MatterTeamMember>,
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(ConflictCheck) private readonly conflicts: Repository<ConflictCheck>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(TaskTemplate) private readonly taskTemplates: Repository<TaskTemplate>,
    @InjectRepository(Document) private readonly documents: Repository<Document>,
    @InjectRepository(TimeEntry) private readonly entries: Repository<TimeEntry>,
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(RolePermission)
    private readonly rolePermissions: Repository<RolePermission>,
    @InjectRepository(TrustTransaction) private readonly trust: Repository<TrustTransaction>,
    @InjectRepository(Communication) private readonly communications: Repository<Communication>,
    @InjectRepository(MessageTemplate)
    private readonly messageTemplates: Repository<MessageTemplate>,
    @InjectRepository(Note) private readonly notes: Repository<Note>,
    @InjectRepository(FeatureModuleEntity)
    private readonly featureModules: Repository<FeatureModuleEntity>,
    @InjectRepository(FeatureEntity) private readonly featureEntities: Repository<FeatureEntity>,
    @InjectRepository(FeatureRecord) private readonly featureRecords: Repository<FeatureRecord>,
    @InjectRepository(CourtRule) private readonly courtRules: Repository<CourtRule>,
    @InjectRepository(CourtHoliday) private readonly courtHolidays: Repository<CourtHoliday>,
    @InjectRepository(DeadlineCalculation)
    private readonly calculations: Repository<DeadlineCalculation>,
    @InjectRepository(Statute) private readonly statutes: Repository<Statute>,
    @InjectRepository(CalendarDraftEvent)
    private readonly calendarDrafts: Repository<CalendarDraftEvent>,
    @InjectRepository(CalendarReminder)
    private readonly calendarReminders: Repository<CalendarReminder>,
    @InjectRepository(WorkspaceItem) private readonly workspaceItems: Repository<WorkspaceItem>,
    @InjectRepository(WorkspaceSetting)
    private readonly workspaceSettings: Repository<WorkspaceSetting>,
  ) {}

  async seed() {
    await this.seedFeatures();
    await this.seedMatterCategories();
    await this.seedWorkspace();
    await this.seedMessageTemplates();
    await this.seedPermissions();
    if ((await this.users.count()) > 0) {
      await this.seedCalendarData();
      return;
    }

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

    // 当事人与案件团队：每个案件 1-3 人，主办 + 协办 + 可选助理。
    for (const [index, matter] of MATTERS.entries()) {
      const currentMatter = matterEntities[index];
      const client = clientEntities[matter.client];
      await this.matterParties.save(
        this.matterParties.create({
          matterId: currentMatter.id,
          role: 'plaintiff',
          name: client.name,
          clientId: client.id,
          contact: client.contactName,
          note: '委托方 / 原告',
        }),
      );
      await this.matterParties.save(
        this.matterParties.create({
          matterId: currentMatter.id,
          role: 'defendant',
          name: index % 2 === 0 ? '北京云启科技有限公司' : '李某某',
          contact: index % 2 === 0 ? '010-88886666' : '138****2200',
          note: '对方当事人',
        }),
      );
      if (index % 3 === 0) {
        await this.matterParties.save(
          this.matterParties.create({
            matterId: currentMatter.id,
            role: 'third_party',
            name: '中山知识产权服务中心',
            note: '第三人（如有）',
          }),
        );
      }

      await this.matterTeams.save(
        this.matterTeams.create({
          matterId: currentMatter.id,
          userId: userEntities[matter.owner].id,
          role: 'lead',
          canViewInternal: true,
        }),
      );
      await this.matterTeams.save(
        this.matterTeams.create({
          matterId: currentMatter.id,
          userId: userEntities[(matter.owner + 1) % 3].id,
          role: 'associate',
          canViewInternal: true,
        }),
      );
      if (index % 2 === 0) {
        await this.matterTeams.save(
          this.matterTeams.create({
            matterId: currentMatter.id,
            userId: userEntities[3].id,
            role: 'assistant',
            canViewInternal: false,
          }),
        );
      }
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
            content: DOCUMENT_CONTENTS[document.title] ?? null,
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
          conversationKey:
            item.matter !== undefined
              ? `matter:${matterEntities[item.matter].id}`
              : `client:${clientEntities[item.client].id}`,
          senderName: item.direction === 'inbound' ? clientEntities[item.client].contactName : null,
          unread: item.unread ?? false,
          replied: item.replied ?? item.direction === 'outbound',
          needsFollowUp: item.needsFollowUp ?? false,
          internal: item.internal ?? false,
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
    await this.seedCalendarData();
  }

  private async seedPermissions() {
    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      for (const [permission, enabled] of Object.entries(permissions)) {
        if ((await this.rolePermissions.count({ where: { role, permission } })) === 0) {
          await this.rolePermissions.save(this.rolePermissions.create({ role, permission, enabled }));
        }
      }
    }
  }

  private async seedMessageTemplates() {
    for (const template of MESSAGE_TEMPLATES) {
      if ((await this.messageTemplates.count({ where: { code: template.code } })) === 0) {
        await this.messageTemplates.save(this.messageTemplates.create(template));
      }
    }
    for (const template of TASK_TEMPLATES) {
      if ((await this.taskTemplates.count({ where: { name: template.name } })) === 0) {
        await this.taskTemplates.save(this.taskTemplates.create(template));
      }
    }
  }

  private async seedFeatures() {
    // 按 code 增量 upsert：首次启动写入全量目录，已有演示库自动补齐新增模块与功能。
    // name 一旦写入不再覆盖，保留用户可能的自定义；route/description/position 每次同步。
    const moduleEntities: FeatureModuleEntity[] = [];
    for (const [index, item] of FEATURE_MODULES.entries()) {
      const existing = await this.featureModules.findOne({ where: { code: item.code } });
      const module =
        existing ??
        this.featureModules.create({ code: item.code, name: item.name });
      module.description = item.description;
      module.position = index + 1;
      moduleEntities.push(await this.featureModules.save(module));
    }
    const moduleIds = new Map(moduleEntities.map((item) => [item.code, item.id]));

    const modulePositions = new Map<string, number>();
    for (const item of FEATURES) {
      const position = (modulePositions.get(item.module) ?? 0) + 1;
      modulePositions.set(item.module, position);
      const existing = await this.featureEntities.findOne({ where: { code: item.code } });
      const feature = existing ?? this.featureEntities.create({ code: item.code, name: item.name });
      feature.moduleId = moduleIds.get(item.module)!;
      feature.description = item.description;
      feature.route = item.route;
      feature.position = position;
      feature.enabled = true;
      await this.featureEntities.save(feature);
    }

    await this.featureRecords.delete({ featureCode: In(NON_WORKSPACE_FEATURE_CODES) });

    const recordFeatures = FEATURES.filter((item) => !NON_WORKSPACE_FEATURE_CODES.includes(item.code));
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
      for (const feature of recordFeatures) {
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
      `功能目录初始化完成：${FEATURE_MODULES.length} 个一级模块、${FEATURES.length} 个二级功能、${recordFeatures.length * 2} 条功能记录。`,
    );
  }

  /** 案例分类按 code 增量补齐；已存在的分类完全保留用户在设置页的修改。 */
  private async seedMatterCategories() {
    let created = 0;
    for (const [index, item] of DEFAULT_MATTER_CATEGORIES.entries()) {
      const existing = await this.matterCategories.findOne({ where: { code: item.code } });
      if (existing) {
        // 升级兼容：旧流程缺少停留时长时按默认模板补齐时长与示例任务；
        // 已升级的流程完全保留用户保存的名称、顺序与任务配置（包括清空的任务）。
        const defaults = categoryFlow(item.stages);
        const normalized = (existing.stages ?? []).map((stage, index) => {
          const fallback = defaults[index] ?? defaults[defaults.length - 1];
          const upgraded = typeof stage.durationDays === 'number';
          return {
            name: stage.name ?? fallback.name,
            color: stage.color ?? fallback.color,
            probability: stage.probability ?? fallback.probability,
            isFinal: Boolean(stage.isFinal),
            durationDays: upgraded ? stage.durationDays : fallback.durationDays,
            tasks: (upgraded ? stage.tasks ?? [] : fallback.tasks).map((task) => ({
              name: task.name ?? '未命名任务',
              dueDay: typeof task.dueDay === 'number' ? task.dueDay : 0,
              skippable: Boolean(task.skippable),
            })),
          };
        });
        if (JSON.stringify(normalized) !== JSON.stringify(existing.stages ?? [])) {
          existing.stages = normalized;
          await this.matterCategories.save(existing);
        }
        continue;
      }
      await this.matterCategories.save(
        this.matterCategories.create({
          code: item.code,
          name: item.name,
          description: item.description,
          color: item.color,
          position: index,
          enabled: true,
          stages: categoryFlow(item.stages),
        }),
      );
      created += 1;
    }
    this.logger.log(`案例分类初始化完成：${DEFAULT_MATTER_CATEGORIES.length} 个分类（新增 ${created}）。`);
  }

  /**
   * 32 个二级功能的可扩展工作台数据：每个功能按专属 schema 生成真实业务记录与本地配置。
   * 幂等：已有记录或配置的功能不重复写入，用户在页面上的编辑不会被覆盖。
   */
  private async seedWorkspace() {
    let sequence = 0;
    for (const definition of WORKSPACE_DEFINITIONS) {
      const itemCount = await this.workspaceItems.count({
        where: { featureCode: definition.code },
      });
      if (itemCount === 0) {
        for (const seed of definition.seeds) {
          const index = sequence++;
          await this.workspaceItems.save(
            this.workspaceItems.create({
              featureCode: definition.code,
              title: seed.title,
              summary: seed.summary,
              status: seed.status,
              ownerName: index % 3 === 0 ? null : USERS[index % USERS.length].name,
              dueDate: index % 2 === 0 ? this.inDays((index % 20) + 3, 17) : null,
              amount: index % 4 === 1 ? 2000 + (index % 6) * 1500 : null,
              data: seed.data,
            }),
          );
        }
      }

      if (definition.settings.length > 0) {
        const settingCount = await this.workspaceSettings.count({
          where: { featureCode: definition.code },
        });
        if (settingCount === 0) {
          for (const setting of definition.settings) {
            await this.workspaceSettings.save(
              this.workspaceSettings.create({
                featureCode: definition.code,
                key: setting.key,
                value: setting.defaultValue,
              }),
            );
          }
        }
      }
    }
    this.logger.log(`功能工作台初始化完成：${WORKSPACE_DEFINITIONS.length} 个功能域。`);
  }

  /** 日程管理真实功能所需的规则、节假日、期限链、时效、提醒与文档正文。 */
  private async seedCalendarData() {
    let ruleEntities: CourtRule[] = [];
    if ((await this.courtRules.count()) === 0) {
      for (const [index, rule] of COURT_RULES.entries()) {
        ruleEntities.push(
          await this.courtRules.save(
            this.courtRules.create({
              code: rule.code,
              name: rule.name,
              jurisdiction: rule.jurisdiction,
              description: rule.description,
              active: true,
              position: index,
              steps: rule.steps,
            }),
          ),
        );
      }
    } else {
      ruleEntities = await this.courtRules.find({ order: { position: 'ASC' } });
    }

    let holidayEntities: CourtHoliday[] = [];
    if ((await this.courtHolidays.count()) === 0) {
      for (const holiday of COURT_HOLIDAYS) {
        holidayEntities.push(
          await this.courtHolidays.save(
            this.courtHolidays.create({ ...holiday, jurisdiction: 'CN' }),
          ),
        );
      }
    } else {
      holidayEntities = await this.courtHolidays.find({ order: { date: 'ASC' } });
    }

    const [matters, users, tasks] = await Promise.all([
      this.matters.find({ order: { id: 'ASC' } }),
      this.users.find({ order: { id: 'ASC' } }),
      this.tasks.find({ order: { id: 'ASC' } }),
    ]);

    if ((await this.calculations.count()) === 0) {
      for (const seed of CALENDAR_DEADLINES) {
        const rule = ruleEntities[seed.rule];
        if (!rule) continue;
        const triggerDate = this.daysAgo(seed.daysAgo);
        triggerDate.setHours(9, 0, 0, 0);
        const items = computeDeadlineItems(rule, triggerDate, [], holidayEntities);
        await this.calculations.save(
          this.calculations.create({
            title: seed.title,
            ruleId: rule.id,
            matterId: matters[seed.matter]?.id ?? null,
            ownerId: users[seed.owner]?.id ?? null,
            triggerDate,
            status: seed.status,
            note: seed.note,
            items,
          }),
        );
      }
    }

    if ((await this.statutes.count()) === 0) {
      for (const seed of STATUTES_SEED) {
        const causeDate = this.daysAgo(seed.causeDaysAgo);
        causeDate.setHours(9, 0, 0, 0);
        await this.statutes.save(
          this.statutes.create({
            title: seed.title,
            matterId: matters[seed.matter]?.id ?? null,
            causeDate,
            periodDays: seed.periodDays,
            dueDate: new Date(toIsoEndOfDay(addDays(causeDate, seed.periodDays))),
            alertDays: seed.alertDays,
            status: seed.status,
            ownerId: users[seed.owner]?.id ?? null,
            note: seed.note,
          }),
        );
      }
    }

    if ((await this.calendarReminders.count()) === 0) {
      for (const seed of CALENDAR_REMINDERS) {
        const task = tasks[seed.task];
        if (!task?.dueDate) continue;
        const dueDate = new Date(task.dueDate);
        await this.calendarReminders.save(
          this.calendarReminders.create({
            taskId: task.id,
            channel: seed.channel,
            recipient: seed.recipient,
            leadMinutes: seed.leadMinutes,
            sendAt: new Date(dueDate.getTime() - seed.leadMinutes * 60 * 1000),
            status: seed.status,
            message: seed.message,
            sentAt: seed.status === 'sent' ? dueDate : null,
          }),
        );
      }
    }

    for (const [title, content] of Object.entries(DOCUMENT_CONTENTS)) {
      await this.documents.update({ title, content: IsNull() }, { content });
    }
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

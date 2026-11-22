/**
 * 可扩展工作台的功能定义。
 *
 * 每个二级功能都有一份独立 schema：专属字段、状态机、统计维度、配置开关与种子数据。
 * 前端通过 /api/workspace/definitions 获取定义，结合功能目录渲染专属页面。
 */

export type WorkspaceFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'currency';
export type WorkspaceSettingType = 'switch' | 'text' | 'select' | 'number';
export type WorkspaceKind = 'business' | 'config' | 'analytics';

export interface WorkspaceFieldDef {
  key: string;
  label: string;
  type: WorkspaceFieldType;
  options?: string[];
}

export interface WorkspaceStatusDef {
  value: string;
  label: string;
  color: string;
}

export interface WorkspaceSettingDef {
  key: string;
  label: string;
  type: WorkspaceSettingType;
  defaultValue: string;
  options?: string[];
  description?: string;
}

type FieldTuple = [key: string, label: string, type?: WorkspaceFieldType, options?: string[]];
type SettingTuple = [key: string, label: string, defaultValue: string, type?: WorkspaceSettingType, options?: string[]];
type SeedTuple = [title: string, summary: string, status: string, values: string[]];

export interface WorkspaceDefinition {
  code: string;
  kind: WorkspaceKind;
  statuses: WorkspaceStatusDef[];
  fields: WorkspaceFieldDef[];
  settings: WorkspaceSettingDef[];
  seeds: Array<{ title: string; summary: string; status: string; data: Record<string, string> }>;
}

const STATUS_COLORS = ['default', 'info', 'warning', 'success', 'secondary', 'error', 'primary'];

function statuses(spec: string): WorkspaceStatusDef[] {
  return spec.split('/').map((part, index) => {
    const [label, color] = part.split(':');
    return { value: label, label, color: color ?? STATUS_COLORS[index % STATUS_COLORS.length] };
  });
}

function fields(tuples: FieldTuple[]): WorkspaceFieldDef[] {
  return tuples.map(([key, label, type = 'text', options]) => ({ key, label, type, options }));
}

function settings(tuples: SettingTuple[] = []): WorkspaceSettingDef[] {
  return tuples.map(([key, label, defaultValue, type = 'switch', options]) => ({
    key,
    label,
    type,
    defaultValue,
    options,
    description: `${label}（本地配置，仅影响当前演示库）`,
  }));
}

function seeds(tuples: SeedTuple[], fieldDefs: WorkspaceFieldDef[]) {
  return tuples.map(([title, summary, status, values]) => {
    const data: Record<string, string> = {};
    fieldDefs.forEach((field, index) => {
      if (values[index] !== undefined) data[field.key] = values[index];
    });
    return { title, summary, status, data };
  });
}

/** 紧凑定义：[功能编码, 类型, 状态串, 字段, 种子, 配置开关] */
type DefinitionTuple = [string, WorkspaceKind, string, FieldTuple[], SeedTuple[], SettingTuple[]?];

const DEFINITIONS: DefinitionTuple[] = [
  // ── 合并精简后的 32 个可扩展工作台（按功能目录 code 对齐）──
  ['grow_conflict', 'business', '待检索/检索中:info/无冲突:success/有冲突:error', [
    ['subject', '检索主体'], ['opponent', '对方当事人'], ['scope', '检索范围', 'select', ['客户库', '案件库', '联系人库', '全平台']],
    ['reviewer', '审查人'], ['result', '检索结论', 'select', ['无冲突', '有冲突', '待复核']],
  ], [
    ['股权转让案冲突检索', '对交易对手进行全平台利益冲突检索', '无冲突', ['星海科技', '未知第三方', '全平台', '李静', '无冲突']],
    ['同名主体核查', '发现潜在同名主体，转人工复核', '有冲突', ['汇通金服', '同名公司', '客户库', '陈浩', '有冲突']],
  ]],
  ['grow_appointment', 'business', '待确认/已预约:info/已完成:success/已取消:default', [
    ['client', '客户名称'], ['time', '预约时间', 'date'], ['method', '咨询方式', 'select', ['到所面谈', '视频会议', '电话']],
    ['topic', '咨询主题'], ['owner', '跟进人'],
  ], [
    ['并购项目初次面谈', '与远景能源预约到所面谈', '已预约', ['远景能源', '2026-11-24', '到所面谈', '股权并购方案', '王建国']],
    ['客户回访计划', '结案客户满意度回访已完成', '已完成', ['周雅琴', '2026-11-12', '电话', '案件进展反馈', '陈浩']],
  ]],
  ['grow_engagement', 'business', '报价中/待签署:warning/已签署:success/已转客户:info', [
    ['client', '客户名称'], ['quote', '报价金额', 'currency'], ['agreement', '协议类型', 'select', ['常年顾问', '专项委托', '风险代理']],
    ['signStatus', '签署状态', 'select', ['未发送', '已发送', '已签署']], ['owner', '负责人'],
  ], [
    ['常年法律顾问报价', '星海科技年度顾问服务报价已发出', '待签署', ['星海科技', '180000', '常年顾问', '已发送', '王建国']],
    ['并购专项委托签约', '远景能源并购专项委托协议已签署', '已转客户', ['远景能源', '320000', '专项委托', '已签署', '李静']],
  ]],
  ['grow_marketing', 'business', '策划中/进行中:info/已结束:success', [
    ['campaign', '活动名称'], ['channel', '渠道', 'select', ['公众号', '沙龙', '广告投放', '邮件营销']],
    ['budget', '预算', 'currency'], ['leads', '获取线索', 'number'], ['owner', '负责人'],
  ], [
    ['知识产权主题沙龙', '线下沙龙已完成，收集有效线索 18 条', '已结束', ['知识产权主题沙龙', '沙龙', '25000', '18', '刘洋']],
    ['公众号专业文章排期', '季度专业文章排期执行中', '进行中', ['公众号专业文章排期', '公众号', '8000', '7', '刘洋']],
  ]],
  ['manage_mobile_access', 'config', '待配置/已启用:success/已停用:default', [
    ['user', '用户'], ['device', '设备'], ['scope', '访问范围', 'select', ['全部案件', '本人案件', '案件组']], ['status', '状态', 'select', ['启用', '停用']],
  ], [
    ['外出庭审移动访问', '律师外出庭审期间的移动访问配置', '已启用', ['王建国', 'iPad Pro', '本人案件', '启用']],
    ['助理移动端权限', '律师助理移动端仅可访问授权案件', '已启用', ['刘洋', 'iPhone 15', '案件组', '启用']],
  ], [
    ['mobileEnabled', '允许移动端访问', 'true'], ['offlineCache', '允许离线缓存文档', 'false'],
    ['biometric', '启用生物识别登录', 'true'], ['sessionHours', '会话有效期（小时）', '8', 'number'],
  ]],
  ['draft_esign', 'business', '待发送/待签署:warning/已签署:success/已过期:error', [
    ['document', '文档名称'], ['signer', '签署方'], ['method', '签署方式', 'select', ['移动端', '网页端', '免注册链接']],
    ['deadline', '签署截止', 'date'], ['status', '状态', 'select', ['待发送', '待签署', '已签署']],
  ], [
    ['和解协议签署', '和解协议签署流程配置并发送', '待签署', ['医疗纠纷和解协议', '远景医药集团', '网页端', '2026-11-30', '待签署']],
    ['客户签署待办', '客户签署已完成并归档', '已签署', ['委托代理协议', '周雅琴', '移动端', '2026-11-08', '已签署']],
  ]],
  ['draft_word', 'config', '待配置/已启用:success/已停用:default', [
    ['name', '配置项'], ['value', '当前值'], ['status', '状态', 'select', ['启用', '停用']],
  ], [
    ['Word 文书导入格式校验', 'Word 文档导入时的格式校验规则', '已启用', ['格式校验规则', '严格模式', '启用']],
    ['批量导出文书配置', '批量导出为 Word 的默认目录', '已启用', ['导出目录', '/exports/word', '启用']],
  ], [
    ['wordPlugin', '启用 Word 插件', 'true'], ['autoSave', '自动保存草稿', 'true'],
    ['formatCheck', '导入时校验格式', 'true'], ['exportFormat', '默认导出格式', 'docx', 'select', ['docx', 'pdf']],
  ]],
  ['comm_client_portal', 'config', '待配置/已启用:success/已停用:default', [
    ['name', '门户配置项'], ['scope', '可见范围', 'select', ['文档', '账单', '预约', '案件进度']], ['status', '状态', 'select', ['启用', '停用']],
  ], [
    ['门户展示材料清单', '配置客户门户可见材料清单', '已启用', ['材料清单', '文档', '启用']],
    ['客户可见范围调整', '限制客户查看内部工作底稿', '已启用', ['可见范围', '案件进度', '启用']],
  ], [
    ['portalEnabled', '启用客户门户', 'true'], ['billVisible', '客户可见账单', 'true'],
    ['docDownload', '允许文档下载', 'true'], ['progressVisible', '客户可见案件进度', 'true'],
  ]],
  ['comm_auto_followup', 'config', '待配置/已启用:success/已停用:default', [
    ['name', '跟进规则'], ['trigger', '触发节点', 'select', ['结案后', '线索沉默', '账单逾期']], ['template', '话术模板'],
  ], [
    ['结案后回访自动提醒', '结案 30 天后自动提醒回访', '已启用', ['结案回访', '结案后', '满意度回访话术']],
    ['线索沉默期跟进', '线索 7 天无响应自动提醒', '已启用', ['沉默线索跟进', '线索沉默', '首次联系话术']],
  ], [
    ['autoFollowup', '启用自动跟进', 'true'], ['silentDays', '沉默天数阈值', '7', 'number'],
    ['aiDraft', 'AI 起草客户更新', 'false'], ['reviewRequired', '发送前人工审核', 'true'],
  ]],
  ['comm_phone_meeting', 'business', '待进行/已记录:success/已取消:default', [
    ['topic', '主题'], ['type', '类型', 'select', ['电话', '视频会议', '现场会议']],
    ['participants', '参与人', 'textarea'], ['time', '时间', 'date'], ['minutes', '纪要', 'textarea'],
  ], [
    ['并购进度会议纪要', '并购项目周会，记录下一步分工', '已记录', ['并购进度周会', '视频会议', '王建国;李静;客户法务', '2026-11-17', '尽调材料于周五前提交']],
    ['客户来电要点', '客户来电咨询账单问题', '已记录', ['账单咨询来电', '电话', '赵敏;客户财务', '2026-11-14', '确认尾款发票开具时间']],
  ]],
  ['billing_rates', 'business', '草稿/生效中:success/已停用:default', [
    ['person', '人员'], ['role', '角色', 'select', ['合伙人', '主办律师', '律师', '律师助理', '财务']],
    ['rate', '小时费率', 'currency'], ['mode', '计费模式', 'select', ['计时', '固定费用', '风险代理']],
  ], [
    ['合伙人收费标准更新', '王建国律师小时费率调整', '生效中', ['王建国', '合伙人', '2800', '计时']],
    ['风险代理计费方案', '知识产权维权风险代理方案', '生效中', ['李静', '主办律师', '1800', '风险代理']],
  ]],
  ['billing_ar', 'business', '未到期/已逾期:error/催收中:warning/已收回:success', [
    ['client', '客户'], ['matter', '案件'], ['amount', '应收金额', 'currency'],
    ['aging', '账龄', 'select', ['30 天内', '31-60 天', '61-90 天', '90 天以上']], ['status', '状态', 'select', ['未到期', '已逾期', '催收中', '已收回']],
  ], [
    ['逾期应收款催收', '恒信物流服务费逾期 45 天', '催收中', ['恒信物流', '物流运输合同商事诉讼', '96000', '31-60 天', '催收中']],
    ['客户欠款账龄分析', '蓝山文化尾款账龄超过 90 天', '已逾期', ['蓝山文化传播', '影视作品著作权维权', '48000', '90 天以上', '已逾期']],
  ]],
  ['payment_online', 'config', '待配置/已启用:success/已停用:default', [
    ['channel', '支付渠道'], ['status', '状态', 'select', ['启用', '停用']], ['note', '说明', 'textarea'],
  ], [
    ['在线支付渠道配置', '配置信用卡与借记卡收款渠道', '已启用', ['信用卡/借记卡', '启用', '客户门户与账单链接支付']],
    ['扫码支付到账核对', '扫码支付到账通知与核对', '已启用', ['扫码支付', '启用', '到账后自动匹配账单']],
  ], [
    ['cardEnabled', '启用银行卡支付', 'true'], ['echeckEnabled', '启用 eCheck', 'false'],
    ['portalPay', '客户门户支付', 'true'], ['invoiceLink', '账单链接支付', 'true'],
  ]],
  ['reconciliation', 'business', '待对账/对账中:info/已平衡:success/有差异:error', [
    ['account', '账户'], ['period', '期间'], ['bankBalance', '银行余额', 'currency'],
    ['ledgerBalance', '账面余额', 'currency'], ['status', '状态', 'select', ['待对账', '已平衡', '有差异']],
  ], [
    ['银行流水月度对账', '10 月运营账户银行流水对账', '已平衡', ['运营账户', '2026-10', '486200', '486200', '已平衡']],
    ['信托账户差异核查', '信托账户存在一笔未匹配流水', '有差异', ['信托账户 IOLTA', '2026-10', '1250000', '1248500', '有差异']],
  ]],
  ['general_ledger', 'business', '草稿/已过账:success/已作废:default', [
    ['voucher', '凭证号'], ['summary', '摘要'], ['account', '科目'],
    ['debit', '借方', 'currency'], ['credit', '贷方', 'currency'], ['status', '状态', 'select', ['草稿', '已过账']],
  ], [
    ['月末结转凭证', '月末收入科目结转凭证', '已过账', ['PV-2026-1031', '月末收入结转', '主营业务收入', '286740', '286740', '已过账']],
    ['收入科目余额核对', '律师费收入科目余额核对', '已过账', ['PV-2026-1032', '律师费收入确认', '应收账款', '180000', '180000', '已过账']],
  ]],
  ['work_case_analysis', 'business', '待分析/分析中:info/已完成:success', [
    ['matter', '案件'], ['focus', '分析要点', 'textarea'], ['finding', '关键发现', 'textarea'], ['owner', '负责人'],
    ['analysis', '完整解析结果（摘要/时间线/关系/争点）', 'textarea'],
  ], [
    ['货款纠纷争点分析', '梳理合同成立与付款义务争点', '已完成', ['软件买卖合同货款纠纷', '合同效力与验收标准', '验收记录缺失为主要风险', '李静']],
    ['竞业限制案件要素', '整理竞业限制协议要素与抗辩', '分析中', ['员工竞业限制争议', '协议范围与补偿', '补偿金支付记录待核实', '陈浩']],
  ]],
  ['work_legal_research', 'business', '待检索/检索中:info/已完成:success', [
    ['topic', '检索主题'], ['keywords', '关键词', 'textarea'], ['source', '来源', 'select', ['法规', '判例', '实务文章']], ['result', '结果摘要', 'textarea'],
  ], [
    ['诉讼时效法规检索', '整理诉讼时效相关法规', '已完成', ['诉讼时效', '民法典 188 条;时效中断', '法规', '普通时效三年，自知道权利受损起算']],
    ['类案检索结果', '检索同类货款纠纷判决', '已完成', ['货款纠纷类案', '买卖合同;验收', '判例', '已整理 6 篇类案要点']],
  ]],
  ['work_drafting', 'business', '草稿/修订中:warning/已定稿:success', [
    ['name', '文书名称'], ['type', '类型', 'select', ['代理词', '法律意见书', '起诉状', '合同']], ['version', '版本'], ['note', '备注', 'textarea'],
    ['content', '初稿全文（人工编辑）', 'textarea'],
  ], [
    ['代理词初稿', '货款纠纷代理词初稿', '修订中', ['货款纠纷代理词', '代理词', 'v0.3', '待补充证据引用']],
    ['法律意见书结构', '数据合规法律意见书提纲', '草稿', ['数据合规法律意见书', '法律意见书', 'v0.1', '已完成结构提纲']],
  ]],
  ['work_doc_review', 'business', '待审阅/审阅中:info/已完成:success', [
    ['document', '文档名称'], ['focus', '审阅重点', 'textarea'], ['risk', '风险标注', 'textarea'], ['reviewer', '审阅人'],
    ['revision', '修订稿全文（人工确认）', 'textarea'],
  ], [
    ['许可协议条款审阅', '软件许可协议条款审阅要点', '已完成', ['软件许可协议', '授权范围与责任限制', '第 7 条责任限制过宽', '李静']],
    ['尽职调查文件标注', '并购尽调文件风险标注', '审阅中', ['并购尽调资料包', '股权瑕疵与或有负债', '发现 2 项待核实事项', '王建国']],
  ]],
  ['report_custom', 'business', '草稿/已发布:success/已归档:default', [
    ['name', '报告名称'], ['dataset', '数据集', 'select', ['案件', '客户', '工时', '账单', '收款']],
    ['dimension', '分组维度', 'select', ['按案件类型', '按人员', '按月份', '按客户']], ['schedule', '定时发送', 'select', ['不发送', '每周', '每月']],
  ], [
    ['客户行业分布报告', '按行业统计客户分布', '已发布', ['客户行业分布', '客户', '按案件类型', '每月']],
    ['结案周期统计', '按月份统计案件结案周期', '已发布', ['结案周期统计', '案件', '按月份', '不发送']],
  ]],
  ['report_ai_insight', 'business', '待查看/已确认:success/已忽略:default', [
    ['topic', '洞察主题'], ['detail', '洞察内容', 'textarea'], ['level', '级别', 'select', ['提示', '预警', '风险']], ['status', '状态', 'select', ['待查看', '已确认', '已忽略']],
  ], [
    ['业务趋势洞察', '本月工时记录量较上月增长', '已确认', ['工时增长', '本月工时记录量环比增长 18%', '提示', '已确认']],
    ['客户流失风险提示', '某客户近 60 天无沟通记录', '待查看', ['客户活跃度', '蓝山文化近 60 天无沟通记录', '预警', '待查看']],
  ]],
  ['report_audit', 'analytics', '记录中/已归档:success', [
    ['target', '操作对象'], ['action', '操作类型', 'select', ['新建', '修改', '删除', '导出', '审批']],
    ['actor', '操作人'], ['time', '时间', 'date'], ['detail', '详情', 'textarea'],
  ], [
    ['账单修改审计日志', '账单 INV-2026-005 金额修改留痕', '已归档', ['INV-2026-005', '修改', '赵敏', '2026-11-15', '金额由 86000 调整为 88000']],
    ['数据导出记录', '客户清单导出操作追溯', '已归档', ['客户清单', '导出', '王建国', '2026-11-12', '导出 6 条客户记录']],
  ]],
  ['auto_workflow', 'business', '草稿/已启用:success/已停用:default', [
    ['name', '流程名称'], ['trigger', '触发事件', 'select', ['案件创建', '阶段变更', '账单审批', '文档上传']],
    ['steps', '步骤数', 'number'], ['approver', '审批人'], ['status', '状态', 'select', ['草稿', '已启用', '已停用']],
  ], [
    ['立案审批流', '案件创建后自动触发立案审批', '已启用', ['立案审批流', '案件创建', '3', '王建国', '已启用']],
    ['合同审阅流转', '合同上传后流转至负责人审阅', '已启用', ['合同审阅流转', '文档上传', '2', '李静', '已启用']],
  ]],
  ['auto_ai_comms', 'config', '待配置/已启用:success/已停用:default', [
    ['name', '模板名称'], ['type', '类型', 'select', ['跟进邮件', '客户信函', '会议纪要']], ['status', '状态', 'select', ['启用', '停用']],
  ], [
    ['客户回复话术模板', '常见客户问题的回复话术', '已启用', ['客户回复话术', '跟进邮件', '启用']],
    ['会议纪要生成', '会议录音生成纪要草稿', '已启用', ['会议纪要生成', '会议纪要', '启用']],
  ], [
    ['followupDraft', 'AI 起草跟进邮件', 'true'], ['letterDraft', 'AI 起草信函', 'false'],
    ['meetingTranscript', '会议转录与摘要', 'true'], ['reviewRequired', '发送前人工审核', 'true'],
  ]],
  ['auto_task', 'business', '草稿/已启用:success/已停用:default', [
    ['name', '规则名称'], ['trigger', '触发条件', 'select', ['立案后', '期限临近', '案件结案']],
    ['taskType', '任务类型', 'select', ['任务', '截止日期', '提醒']], ['owner', '负责人'], ['status', '状态', 'select', ['草稿', '已启用', '已停用']],
  ], [
    ['立案后任务自动生成', '立案后自动生成证据收集任务', '已启用', ['立案后任务', '立案后', '任务', '刘洋', '已启用']],
    ['期限临近任务触发', '期限前 7 天自动创建提醒任务', '已启用', ['期限提醒', '期限临近', '提醒', '陈浩', '已启用']],
  ]],
  ['auto_billing', 'business', '草稿/已启用:success/已停用:default', [
    ['name', '规则名称'], ['trigger', '触发条件', 'select', ['工时超时', '月末', '案件结案']],
    ['action', '动作', 'select', ['生成工时', '生成账单草稿', '发送催款']], ['status', '状态', 'select', ['草稿', '已启用', '已停用']],
  ], [
    ['超时工时自动计费', '单日工时超过 8 小时自动标记可计费', '已启用', ['超时工时计费', '工时超时', '生成工时', '已启用']],
    ['月度账单自动生成', '每月末自动生成账单草稿', '已启用', ['月度账单', '月末', '生成账单草稿', '已启用']],
  ]],
  ['integration_email_calendar', 'config', '待连接/已连接:success/已断开:default', [
    ['provider', '服务'], ['account', '账号'], ['status', '状态', 'select', ['待连接', '已连接', '已断开']],
  ], [
    ['邮箱日历同步参数', '邮箱与日历双向同步参数配置', '已连接', ['邮件服务', 'legal@lexdesk.cn', '已连接']],
    ['会议邀请同步测试', '会议邀请同步至日历测试', '已连接', ['日历服务', 'firm-calendar', '已连接']],
  ], [
    ['emailSync', '启用邮件同步', 'false'], ['calendarSync', '启用日历双向同步', 'false'],
    ['syncInterval', '同步间隔（分钟）', '15', 'number'], ['meetingInvite', '同步会议邀请', 'false'],
  ]],
  ['integration_practice', 'config', '待连接/已连接:success/已断开:default', [
    ['app', '应用'], ['area', '案件类型', 'select', ['知识产权', '合规审查', '诉讼', '家事']], ['status', '状态', 'select', ['待连接', '已连接', '已断开']],
  ], [
    ['知识产权工具配置', '知识产权领域工具接入', '待连接', ['知识产权工具', '知识产权', '待连接']],
    ['合规审查插件启用', '合规审查辅助插件', '待连接', ['合规插件', '合规审查', '待连接']],
  ], [
    ['ipTool', '启用知识产权工具', 'false'], ['compliancePlugin', '启用合规插件', 'false'],
    ['litigationTool', '启用诉讼工具', 'false'], ['familyTool', '启用家事工具', 'false'],
  ]],
  ['integration_bank', 'config', '待连接/已连接:success/已断开:default', [
    ['provider', '银行'], ['account', '账号'], ['status', '状态', 'select', ['待连接', '已连接', '已断开']],
  ], [
    ['银行账户同步配置', '银行账户流水同步配置', '待连接', ['合作银行', '未配置', '待连接']],
    ['信用卡支出导入', '信用卡支出流水导入测试', '待连接', ['信用卡', '未配置', '待连接']],
  ], [
    ['bankSync', '启用银行同步', 'false'], ['cardSync', '启用信用卡同步', 'false'],
    ['autoMatch', '自动匹配交易', 'false'], ['syncHours', '同步间隔（小时）', '24', 'number'],
  ]],
  ['security_auth', 'config', '草稿/已启用:success/复核中:warning', [
    ['policy', '策略项'], ['value', '当前值'], ['status', '状态', 'select', ['草稿', '已启用', '复核中']],
  ], [
    ['双因素认证策略', '强制管理员启用双因素认证', '已启用', ['双因素认证', '强制', '已启用']],
    ['敏感字段加密规则', '身份证与银行卡字段加密存储', '已启用', ['字段加密', 'AES-256', '已启用']],
  ], [
    ['mfa', '启用多因素认证', 'true'], ['encryption', '静态数据加密', 'true'],
    ['tls', '传输层加密', 'true'], ['audit', '独立审计', 'false'],
  ]],
  ['security_ai_policy', 'config', '草稿/已启用:success/复核中:warning', [
    ['policy', '策略项'], ['value', '当前值'], ['status', '状态', 'select', ['草稿', '已启用', '复核中']],
  ], [
    ['AI 输入数据脱敏规则', '客户敏感信息输入 AI 前脱敏', '已启用', ['输入脱敏', '开启', '已启用']],
    ['禁止上传资料清单', '禁止上传至第三方 AI 的资料类型', '已启用', ['禁止上传', '身份凭证;银行卡', '已启用']],
  ], [
    ['noTraining', '客户数据不用于模型训练', 'true'], ['zeroRetention', '零数据保留协议', 'false'],
    ['maskInput', 'AI 输入脱敏', 'true'], ['permissionScope', 'AI 在权限内工作', 'true'],
  ]],
  ['security_access', 'business', '草稿/已启用:success/复核中:warning', [
    ['role', '角色'], ['resource', '资源'], ['permission', '权限', 'select', ['只读', '编辑', '管理', '无']], ['scope', '范围', 'select', ['本人', '案件组', '全所']],
  ], [
    ['案件组访问权限矩阵', '案件组成员访问权限配置', '已启用', ['案件组成员', '案件文档', '编辑', '案件组']],
    ['外部协作者访问期限', '外部会计师访问期限配置', '已启用', ['外部会计', '财务模块', '只读', '本人']],
  ]],
];

export const WORKSPACE_DEFINITIONS: WorkspaceDefinition[] = DEFINITIONS.map(
  ([code, kind, statusSpec, fieldTuples, seedTuples, settingTuples]) => {
    const fieldDefs = fields(fieldTuples);
    return {
      code,
      kind,
      statuses: statuses(statusSpec),
      fields: fieldDefs,
      settings: settings(settingTuples),
      seeds: seeds(seedTuples, fieldDefs),
    };
  },
);

export const WORKSPACE_DEFINITION_MAP = new Map(WORKSPACE_DEFINITIONS.map((item) => [item.code, item]));

export function getWorkspaceDefinition(code: string): WorkspaceDefinition | undefined {
  return WORKSPACE_DEFINITION_MAP.get(code);
}

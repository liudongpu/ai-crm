import type { ChipProps } from '@mui/material/Chip';
import type {
  ClientStatus,
  CommunicationType,
  ConflictOutcome,
  DocumentCategory,
  InvoiceStatus,
  LeadRating,
  LeadStatus,
  MatterStatus,
  PaymentMethod,
  Priority,
  TaskType,
  TrustCategory,
  TrustTransactionType,
  UserRole,
} from '@/types';

type ChipColor = NonNullable<ChipProps['color']>;
type Tone = { label: string; color: ChipColor };

const tone = (label: string, color: ChipColor): Tone => ({ label, color });

export const taskTypeMeta: Record<TaskType, Tone & { tint: string }> = {
  task: { label: '任务', color: 'primary', tint: '#e8edf4' },
  deadline: { label: '截止日期', color: 'error', tint: '#fdf0ef' },
  hearing: { label: '庭审', color: 'warning', tint: '#fbf4e2' },
  court: { label: '法院事项', color: 'info', tint: '#edf4f8' },
  reminder: { label: '提醒', color: 'secondary', tint: '#f1f5f9' },
};

export const matterStatusMeta: Record<MatterStatus, Tone> = {
  open: tone('进行中', 'info'),
  on_hold: tone('暂停', 'warning'),
  closed: tone('已结案', 'default'),
  won: tone('胜诉', 'success'),
  lost: tone('败诉', 'error'),
};

export const clientStatusMeta: Record<ClientStatus, Tone> = {
  active: tone('活跃', 'success'),
  inactive: tone('停用', 'default'),
  prospect: tone('潜在', 'info'),
};

export const priorityMeta: Record<Priority, Tone> = {
  low: tone('低', 'default'),
  medium: tone('中', 'warning'),
  high: tone('高', 'error'),
};

export const leadStatusMeta: Record<LeadStatus, Tone> = {
  new: tone('新建', 'info'),
  contacted: tone('已联系', 'primary'),
  qualified: tone('已评估', 'warning'),
  converted: tone('已转换', 'success'),
  lost: tone('已流失', 'error'),
};

export const leadRatingMeta: Record<LeadRating, { label: string; color: string }> = {
  hot: { label: '高意向', color: '#b4443c' },
  warm: { label: '中意向', color: '#b8860b' },
  cold: { label: '低意向', color: '#2c6b8f' },
};

export const invoiceStatusMeta: Record<InvoiceStatus, Tone> = {
  draft: tone('草稿', 'default'),
  pending_approval: tone('待审批', 'warning'),
  approved: tone('已审批', 'info'),
  sent: tone('已发送', 'primary'),
  paid: tone('已收款', 'success'),
  void: tone('已作废', 'error'),
};

export const documentCategoryMeta: Record<DocumentCategory, Tone> = {
  contract: tone('合同', 'primary'),
  pleading: tone('诉讼文书', 'error'),
  evidence: tone('证据', 'warning'),
  correspondence: tone('往来函件', 'info'),
  template: tone('模板', 'secondary'),
  other: tone('其他', 'default'),
};

export const communicationTypeMeta: Record<CommunicationType, Tone> = {
  email: tone('邮件', 'primary'),
  sms: tone('短信', 'default'),
  call: tone('电话', 'info'),
  meeting: tone('会议', 'success'),
  message: tone('消息', 'secondary'),
  letter: tone('函件', 'warning'),
  wechat: tone('微信', 'success'),
  whatsapp: tone('WhatsApp', 'success'),
  portal: tone('客户门户', 'info'),
  internal: tone('内部备注', 'error'),
};

export const trustTypeMeta: Record<TrustTransactionType, Tone> = {
  deposit: tone('存入', 'success'),
  withdrawal: tone('支出', 'error'),
  transfer_in: tone('转入', 'info'),
  transfer_out: tone('转出', 'warning'),
  refund: tone('退款', 'secondary'),
};

export const trustCategoryMeta: Record<TrustCategory, string> = {
  retainer: '律师费预付款',
  earned_fee: '已赚取费用',
  refund: '退款',
  cost: '代垫费用',
  other: '其他',
};

export const paymentMethodMeta: Record<PaymentMethod, string> = {
  card: '银行卡',
  bank: '银行转账',
  cash: '现金',
  check: '支票',
  etransfer: '电子转账',
};

export const conflictResultMeta: Record<ConflictOutcome, Tone> = {
  clear: tone('无冲突', 'success'),
  potential: tone('潜在冲突', 'warning'),
  conflict: tone('存在冲突', 'error'),
};

export const userRoleMeta: Record<UserRole, string> = {
  admin: '系统管理员',
  partner: '合伙律师',
  associate: '律师',
  assistant: '律师助理',
  accountant: '会计',
};

export function taskTypeLabel(type: string) {
  return taskTypeMeta[type as TaskType]?.label ?? type;
}

export function taskTypeTint(type: string) {
  return taskTypeMeta[type as TaskType]?.tint ?? '#f1f5f9';
}

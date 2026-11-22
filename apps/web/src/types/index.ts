/** Shared domain types for LexDesk. Field names mirror the REST API exactly. */

export interface BaseRecord {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'partner' | 'associate' | 'assistant' | 'accountant';

export interface User extends BaseRecord {
  name: string;
  email: string;
  role: UserRole;
  title?: string | null;
  active: boolean;
}

export type ClientType = 'company' | 'individual';
export type ClientStatus = 'active' | 'inactive' | 'prospect';

export interface Client extends BaseRecord {
  name: string;
  type: ClientType;
  industry?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  billingAddress?: string | null;
  status: ClientStatus;
  ownerId?: number | null;
  notes?: string | null;
  owner?: User | null;
}

export interface Contact extends BaseRecord {
  name: string;
  clientId?: number | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  isPrimary: boolean;
  notes?: string | null;
  client?: Client | null;
}

export interface MatterStage extends BaseRecord {
  name: string;
  position: number;
  color: string;
  probability: number;
  isFinal: boolean;
}

export interface MatterStageTask {
  name: string;
  /** 进入阶段后第几天到期。 */
  dueDay: number;
  /** 是否允许跳过该任务。 */
  skippable: boolean;
}

export interface MatterCategoryStage {
  name: string;
  probability: number;
  isFinal: boolean;
  /** 该阶段预计停留天数。 */
  durationDays: number;
  tasks: MatterStageTask[];
}

/** 案件类型：与案件的 practiceArea 对应，并携带该类型的阶段与任务流程模板。 */
export interface MatterCategory extends BaseRecord {
  code: string;
  name: string;
  description?: string | null;
  position: number;
  enabled: boolean;
  stages: MatterCategoryStage[];
}

export type MatterCategoryInput = {
  code: string;
  name: string;
  description?: string | null;
  enabled?: boolean;
  position?: number;
  stages: MatterCategoryStage[];
};

export type MatterStatus = 'open' | 'on_hold' | 'closed' | 'won' | 'lost';
export type Priority = 'low' | 'medium' | 'high';

export interface Matter extends BaseRecord {
  title: string;
  caseNumber?: string | null;
  clientId: number;
  stageId: number;
  practiceArea: string;
  status: MatterStatus;
  priority: Priority;
  ownerId?: number | null;
  description?: string | null;
  openDate: string;
  closeDate?: string | null;
  value: number;
  position: number;
  client?: Client | null;
  stage?: MatterStage | null;
  owner?: User | null;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadRating = 'hot' | 'warm' | 'cold';
export type ConflictResult = 'clear' | 'conflict';

export interface Lead extends BaseRecord {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  practiceArea?: string | null;
  description?: string | null;
  status: LeadStatus;
  rating: LeadRating;
  conflictChecked: boolean;
  conflictResult?: ConflictResult | null;
  ownerId?: number | null;
  convertedClientId?: number | null;
  convertedContactId?: number | null;
  convertedMatterId?: number | null;
  convertedAt?: string | null;
  owner?: User | null;
}

export type ConflictTargetType = 'client' | 'contact' | 'matter' | 'lead';
export type ConflictOutcome = 'clear' | 'potential' | 'conflict';

export interface ConflictCheck extends BaseRecord {
  name: string;
  type: ConflictTargetType;
  result: ConflictOutcome;
  details?: string | null;
  checkedById?: number | null;
  matterId?: number | null;
}

export interface ConflictMatch {
  type: ConflictTargetType;
  id: number;
  name: string;
  detail: string;
}

export interface ConflictCheckResult {
  name: string;
  hasConflict: boolean;
  matches: ConflictMatch[];
  record: ConflictCheck;
}

export type TaskType = 'task' | 'deadline' | 'hearing' | 'court' | 'reminder';

export interface TaskTemplate extends BaseRecord {
  name: string;
  category: string;
  title: string;
  type: TaskType;
  priority: Priority;
  description?: string | null;
  dueInDays?: number | null;
  enabled: boolean;
}

export interface Task extends BaseRecord {
  title: string;
  type: TaskType;
  description?: string | null;
  dueDate?: string | null;
  priority: Priority;
  done: boolean;
  matterId?: number | null;
  assigneeId?: number | null;
  completedAt?: string | null;
  calendarId: string;
  visibility: 'firm' | 'team' | 'personal';
  startDate?: string | null;
  endDate?: string | null;
  allDay: boolean;
  reminderMinutes: number;
  sourceType?: string | null;
  sourceId?: number | null;
  sourceDetail?: string | null;
  matter?: Matter | null;
  assignee?: User | null;
}

export type PartyRole = 'plaintiff' | 'defendant' | 'third_party' | 'other';

export interface MatterParty extends BaseRecord {
  matterId: number;
  role: PartyRole;
  name: string;
  idNumber?: string | null;
  contact?: string | null;
  clientId?: number | null;
  note?: string | null;
}

export type MatterTeamRole = 'lead' | 'associate' | 'assistant' | 'viewer';

export interface MatterTeamMember extends BaseRecord {
  matterId: number;
  userId: number;
  role: MatterTeamRole;
  canViewInternal: boolean;
  userName: string;
  userRole?: string | null;
  title?: string | null;
}

export type DocumentCategory = 'contract' | 'pleading' | 'evidence' | 'correspondence' | 'template' | 'other';

export interface Document extends BaseRecord {
  title: string;
  category: DocumentCategory;
  fileName?: string | null;
  version: string;
  matterId?: number | null;
  clientId?: number | null;
  uploadedById?: number | null;
  signed: boolean;
  description?: string | null;
  content?: string | null;
  matter?: Matter | null;
  client?: Client | null;
  uploadedBy?: User | null;
}

export interface TimeEntry extends BaseRecord {
  matterId: number;
  userId: number;
  date: string;
  timerStartedAt?: string | null;
  hours: number;
  description: string;
  billable: boolean;
  rate: number;
  amount: number;
  invoiced: boolean;
  invoiceId?: number | null;
  sourceTaskId?: number | null;
  task?: Task | null;
  matter?: Matter | null;
  user?: User | null;
}

export interface Expense extends BaseRecord {
  matterId: number;
  date: string;
  category: string;
  amount: number;
  description?: string | null;
  billable: boolean;
  invoiced: boolean;
  invoiceId?: number | null;
  receipt?: string | null;
  matter?: Matter | null;
}

export type InvoiceStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'paid' | 'void';
export type InvoiceItemType = 'time' | 'expense' | 'manual';

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  type: InvoiceItemType;
  referenceId?: number;
}

export interface Invoice extends BaseRecord {
  number: string;
  clientId: number;
  matterId?: number | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  paidAmount: number;
  notes?: string | null;
  items: InvoiceItem[];
  client?: Client | null;
  matter?: Matter | null;
}

export type PaymentMethod = 'card' | 'bank' | 'cash' | 'check' | 'etransfer';

export interface Payment extends BaseRecord {
  invoiceId: number;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  invoice?: Invoice | null;
}

export type TrustTransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'refund';
export type TrustCategory = 'retainer' | 'earned_fee' | 'refund' | 'cost' | 'other';

export interface TrustTransaction extends BaseRecord {
  clientId: number;
  matterId?: number | null;
  type: TrustTransactionType;
  category: TrustCategory;
  amount: number;
  date: string;
  description?: string | null;
  reference?: string | null;
  reconciled: boolean;
  client?: Client | null;
  matter?: Matter | null;
}

export type CommunicationType =
  | 'email'
  | 'sms'
  | 'call'
  | 'meeting'
  | 'message'
  | 'letter'
  | 'wechat'
  | 'whatsapp'
  | 'portal'
  | 'internal';
export type CommunicationDirection = 'inbound' | 'outbound';

export interface CommunicationAttachment {
  name: string;
  kind: string;
  refId?: number;
}

export interface Communication extends BaseRecord {
  matterId?: number | null;
  clientId?: number | null;
  contactId?: number | null;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject?: string | null;
  content: string;
  occurredAt: string;
  userId?: number | null;
  conversationKey?: string | null;
  senderName?: string | null;
  unread?: boolean;
  replied?: boolean;
  needsFollowUp?: boolean;
  internal?: boolean;
  aiDraft?: boolean;
  approved?: boolean;
  templateId?: number | null;
  attachments?: CommunicationAttachment[] | null;
  matter?: Matter | null;
  client?: Client | null;
  contact?: Contact | null;
  user?: User | null;
}

/** M7 会话聚合（左侧会话列表）。 */
export interface InboxConversation {
  key: string;
  clientId: number | null;
  clientName: string | null;
  matterId: number | null;
  matterTitle: string | null;
  lastMessage: string;
  lastAt: string;
  lastDirection: string;
  lastType: string;
  count: number;
  unread: number;
  needsFollowUp: number;
  unreplied: number;
  channels: string[];
}

/** M7 消息模板。 */
export interface MessageTemplate extends BaseRecord {
  code: string;
  name: string;
  category: string;
  content: string;
  enabled: boolean;
}

/** 沟通中心本地 AI 起草结果：模板 + 案件真实数据，发送前必须人工确认。 */
export interface AiDraftResult {
  content: string;
  source: string;
  needsHumanReview: boolean;
  template: { code: string; name: string } | null;
  context: {
    matterTitle: string | null;
    caseNumber: string | null;
    clientName: string;
    stage: string | null;
    recentCommunications: number;
    openTasks: number;
    topic: string;
  };
  disclaimer: string;
}

export type NoteTargetType = 'matter' | 'client' | 'contact' | 'lead' | 'document';

export interface Note extends BaseRecord {
  title?: string | null;
  content: string;
  targetType: NoteTargetType;
  targetId: number;
  authorId?: number | null;
  author?: User | null;
}

/** 5 张核心报表：收入、应收、工时、案件、客户。 */
export interface CoreReports {
  revenue: {
    collectedThisMonth: number;
    collectedThisQuarter: number;
    collectedTotal: number;
    billedThisMonth: number;
    outstanding: number;
    byMonth: Array<{ month: string; value: number }>;
  };
  receivables: {
    total: number;
    count: number;
    aging: { current: number; days1to30: number; days31to60: number; over60: number };
    rows: Array<{
      invoiceId: number;
      number: string;
      clientId: number;
      clientName: string;
      remaining: number;
      dueDate: string;
      agingDays: number;
      status: string;
    }>;
  };
  time: {
    rows: Array<{
      name: string;
      monthHours: number;
      weekHours: number;
      billableHours: number;
      nonBillableHours: number;
      amount: number;
    }>;
  };
  matters: {
    open: number;
    closed: number;
    byArea: Array<{ area: string; count: number }>;
    byOwner: Array<{ name: string; count: number }>;
  };
  clients: {
    newThisMonth: number;
    newThisQuarter: number;
    revenueByClient: Array<{ clientId: number; name: string; value: number }>;
  };
}

export interface RolePermission extends BaseRecord {
  role: string;
  permission: string;
  enabled: boolean;
}

export interface UserPermissions {
  role: string | null;
  permissions: Record<string, boolean>;
}

export interface DashboardSummary {
  metrics: {
    openMatters: number;
    closedMatters: number;
    activeClients: number;
    leads: number;
    tasksDue: number;
    unbilledHours: number;
    unbilledAmount: number;
    outstandingInvoices: number;
    outstandingAmount: number;
    trustBalance: number;
    revenueThisMonth: number;
    unrepliedMessages: number;
    followUpMessages: number;
    upcomingDeadlines: number;
    overdueInvoices: number;
  };
  riskAlerts: Array<{
    type: string;
    level: 'high' | 'medium' | 'low';
    label: string;
    detail: string;
    route: string;
  }>;
  mattersByStage: Array<{ id: number; name: string; color: string; count: number; value: number }>;
  tasksByType: Array<{ type: string; count: number }>;
  recentMatters: Matter[];
  upcomingTasks: Task[];
  revenueByMonth: Array<{ month: string; value: number; count: number }>;
}

export interface ReportData {
  metrics: {
    openMatters: number;
    closedMatters: number;
    revenue: number;
    collected: number;
    outstanding: number;
    trustBalance: number;
    realizationRate: number;
    utilizationRate: number;
    collectionRate: number;
    leads: number;
    convertedLeads: number;
  };
  mattersByPracticeArea: Array<{ area: string; count: number; value: number }>;
  revenueByMonth: Array<{ month: string; value: number; count: number }>;
  timeByUser: Array<{ name: string; hours: number; amount: number }>;
  topClients: Array<{ name: string; value: number; matters: number }>;
  leadsBySource: Array<{ source: string; count: number }>;
  tasksByType: Array<{ type: string; count: number }>;
}

export interface SearchResults {
  clients: Client[];
  contacts: Contact[];
  matters: Matter[];
  leads: Lead[];
  documents: Document[];
}

/** Full feature catalog: 12 primary modules with their secondary features. */
export interface FeatureModule {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  position: number;
  features?: Feature[];
}

export interface Feature {
  id: number;
  moduleId: number;
  code: string;
  name: string;
  description?: string | null;
  route: string;
  position: number;
  enabled: boolean;
  module?: FeatureModule | null;
}

/** A module entry returned by GET /api/features/catalog. */
export interface FeatureCatalog extends FeatureModule {
  features: Feature[];
}

export type FeatureStatus = 'draft' | 'active' | 'pending' | 'completed' | 'archived';

export interface FeatureRecord extends BaseRecord {
  featureCode: string;
  title: string;
  description?: string | null;
  status: FeatureStatus;
  priority: Priority;
  ownerId?: number | null;
  ownerName?: string | null;
  matterId?: number | null;
  clientId?: number | null;
  dueDate?: string | null;
  amount?: number | null;
  data?: Record<string, unknown> | null;
}

export interface FeatureStats {
  total: number;
  byStatus: Record<FeatureStatus, number>;
}

/* ---------------------------- Calendar domain --------------------------- */

export interface CourtRuleStep {
  code: string;
  label: string;
  offsetDays: number;
  base?: string;
  businessDays?: boolean;
}

export interface CourtRule extends BaseRecord {
  code: string;
  name: string;
  jurisdiction: string;
  description?: string | null;
  active: boolean;
  position: number;
  steps: CourtRuleStep[];
}

export interface CourtHoliday extends BaseRecord {
  date: string;
  name: string;
  jurisdiction: string;
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

export type DeadlineStatus = 'draft' | 'confirmed' | 'archived';

export interface DeadlineCalculation extends BaseRecord {
  title: string;
  ruleId: number;
  matterId?: number | null;
  ownerId?: number | null;
  triggerDate: string;
  status: DeadlineStatus;
  note?: string | null;
  items: DeadlineItem[];
  rule?: CourtRule | null;
  matter?: Matter | null;
  owner?: User | null;
}

export type StatuteStatus = 'tracking' | 'paused' | 'completed';

export interface Statute extends BaseRecord {
  title: string;
  matterId?: number | null;
  causeDate: string;
  periodDays: number;
  dueDate: string;
  alertDays: number;
  status: StatuteStatus;
  ownerId?: number | null;
  note?: string | null;
  daysLeft?: number;
  matter?: Matter | null;
  owner?: User | null;
}

export type CalendarDraftStatus = 'draft' | 'confirmed' | 'dismissed';

export interface CalendarDraftEvent extends BaseRecord {
  documentId?: number | null;
  sourceName: string;
  sourceSnippet: string;
  extractedDate: string;
  keyword: string;
  title: string;
  status: CalendarDraftStatus;
  taskId?: number | null;
  document?: Document | null;
}

export type ReminderChannel = 'in_app' | 'email' | 'sms';
export type ReminderStatus = 'pending' | 'sent' | 'cancelled';

export interface CalendarReminder extends BaseRecord {
  taskId: number;
  channel: ReminderChannel;
  recipient?: string | null;
  leadMinutes: number;
  sendAt: string;
  status: ReminderStatus;
  message?: string | null;
  sentAt?: string | null;
  task?: Task | null;
}

export interface CalendarOverview {
  total: number;
  calendars: Array<{ id: string; name: string; eventCount: number }>;
  byType: Array<{ type: string; count: number }>;
  unloggedCount: number;
}

export interface IcsImportResult {
  imported: number;
  skipped: number;
  events: Task[];
}

export interface DeadlineToEventsResult {
  created: number;
  tasks: Task[];
}

/** Request payloads */
export type UserInput = {
  name: string;
  email: string;
  role: UserRole;
  title?: string | null;
  active?: boolean;
};

export type ClientInput = {
  name: string;
  type?: ClientType;
  industry?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  billingAddress?: string | null;
  status?: ClientStatus;
  ownerId?: number | null;
  notes?: string | null;
};

export type ContactInput = {
  name: string;
  clientId?: number | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
};

export type MatterStageInput = {
  name: string;
  position?: number;
  color?: string;
  probability?: number;
  isFinal?: boolean;
};

export type MatterInput = {
  title: string;
  caseNumber?: string | null;
  clientId: number;
  stageId: number;
  practiceArea: string;
  status?: MatterStatus;
  priority?: Priority;
  ownerId?: number | null;
  description?: string | null;
  openDate?: string;
  closeDate?: string | null;
  value?: number;
  position?: number;
};

export type LeadInput = {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  practiceArea?: string | null;
  description?: string | null;
  status?: LeadStatus;
  rating?: LeadRating;
  conflictChecked?: boolean;
  conflictResult?: ConflictResult | null;
  ownerId?: number | null;
};

export type LeadConvertInput = {
  clientName?: string;
  practiceArea?: string;
  value?: number;
  title?: string;
};

export interface LeadConvertResult {
  lead: Lead;
  client: Client;
  contact: Contact;
  matter: Matter;
}

export type ConflictCheckInput = {
  name: string;
  type?: ConflictTargetType;
  matterId?: number;
};

export type TaskInput = {
  title: string;
  type: TaskType;
  description?: string | null;
  dueDate?: string | null;
  priority?: Priority;
  done?: boolean;
  matterId?: number | null;
  assigneeId?: number | null;
  calendarId?: string;
  visibility?: 'firm' | 'team' | 'personal';
  startDate?: string | null;
  endDate?: string | null;
  allDay?: boolean;
  reminderMinutes?: number;
  sourceType?: string | null;
  sourceId?: number | null;
  sourceDetail?: string | null;
};

export type DocumentInput = {
  title: string;
  category: DocumentCategory;
  fileName?: string | null;
  version?: string;
  matterId?: number | null;
  clientId?: number | null;
  uploadedById?: number | null;
  signed?: boolean;
  description?: string | null;
  content?: string | null;
};

export type TimeEntryInput = {
  matterId: number;
  userId: number;
  date: string;
  hours: number;
  description: string;
  billable?: boolean;
  rate?: number;
  amount?: number;
};

export type ExpenseInput = {
  matterId: number;
  date: string;
  category: string;
  amount: number;
  description?: string | null;
  billable?: boolean;
  receipt?: string | null;
};

export type InvoiceInput = {
  clientId: number;
  matterId?: number | null;
  status?: InvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  taxRate?: number;
  notes?: string | null;
  items?: InvoiceItem[];
};

export type PaymentInput = {
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
};

export type TrustTransactionInput = {
  clientId: number;
  matterId?: number | null;
  type: TrustTransactionType;
  category: TrustCategory;
  amount: number;
  date: string;
  description?: string | null;
  reference?: string | null;
  reconciled?: boolean;
};

export type CommunicationInput = {
  matterId?: number | null;
  clientId?: number | null;
  contactId?: number | null;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject?: string | null;
  content: string;
  occurredAt?: string;
  userId?: number | null;
  conversationKey?: string | null;
  senderName?: string | null;
  unread?: boolean;
  replied?: boolean;
  needsFollowUp?: boolean;
  internal?: boolean;
  aiDraft?: boolean;
  approved?: boolean;
  templateId?: number | null;
  attachments?: CommunicationAttachment[] | null;
};

export type NoteInput = {
  title?: string | null;
  content: string;
  targetType: NoteTargetType;
  targetId: number;
  authorId?: number | null;
};

export type FeatureRecordInput = {
  featureCode: string;
  title: string;
  description?: string | null;
  status?: FeatureStatus;
  priority?: Priority;
  ownerId?: number | null;
  ownerName?: string | null;
  matterId?: number | null;
  clientId?: number | null;
  dueDate?: string | null;
  amount?: number | null;
  data?: Record<string, unknown> | null;
};

export type FeatureRecordQuery = {
  featureCode?: string;
  status?: string;
  search?: string;
};

export type FeatureQuery = {
  moduleCode?: string;
};

/* ---------------------------- Workspace domain -------------------------- */

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

export interface WorkspaceSeedDef {
  title: string;
  summary: string;
  status: string;
  data: Record<string, string>;
}

export interface WorkspaceDefinition {
  code: string;
  kind: WorkspaceKind;
  statuses: WorkspaceStatusDef[];
  fields: WorkspaceFieldDef[];
  settings: WorkspaceSettingDef[];
  seeds: WorkspaceSeedDef[];
}

export interface WorkspaceItem extends BaseRecord {
  featureCode: string;
  title: string;
  summary?: string | null;
  status: string;
  ownerName?: string | null;
  dueDate?: string | null;
  amount?: number | null;
  data?: Record<string, string> | null;
}

export interface WorkspaceSetting {
  id: number;
  featureCode: string;
  key: string;
  value: string;
  label?: string;
  type?: WorkspaceSettingType;
  options?: string[];
  description?: string;
  updatedAt?: string | null;
}

export interface WorkspaceStats {
  total: number;
  byStatus: Record<string, number>;
}

export type WorkspaceItemInput = {
  featureCode: string;
  title: string;
  summary?: string | null;
  status?: string;
  ownerName?: string | null;
  dueDate?: string | null;
  amount?: number | null;
  data?: Record<string, string> | null;
};

export type WorkspaceItemQuery = {
  featureCode?: string;
  status?: string;
  search?: string;
};

export type CourtRuleInput = {
  code: string;
  name: string;
  jurisdiction: string;
  description?: string | null;
  active?: boolean;
  position?: number;
  steps: CourtRuleStep[];
};

export type CourtHolidayInput = {
  date: string;
  name: string;
  jurisdiction?: string;
};

export type DeadlineCalculateInput = {
  ruleId: number;
  triggerDate: string;
  matterId?: number | null;
  title?: string;
  note?: string;
  ownerId?: number | null;
};

export type StatuteInput = {
  title: string;
  matterId?: number | null;
  causeDate: string;
  periodDays: number;
  alertDays?: number;
  status?: StatuteStatus;
  ownerId?: number | null;
  note?: string | null;
};

export type DraftExtractInput = {
  text?: string;
  documentId?: number;
  sourceName?: string;
  matterId?: number | null;
};

export type DraftUpdateInput = {
  status: Extract<CalendarDraftStatus, 'confirmed' | 'dismissed'>;
  title?: string;
  dueDate?: string;
};

export type ReminderInput = {
  taskId: number;
  channel: ReminderChannel;
  recipient?: string | null;
  leadMinutes: number;
  message?: string | null;
  status?: ReminderStatus;
};

export type IcsImportInput = {
  content: string;
  calendarId?: string;
};

export type TimeLinkInput = {
  taskId: number;
  hours: number;
  date?: string;
  description?: string;
  billable?: boolean;
  rate?: number;
};

/* ---------------------------- Legal AI domain ---------------------------- */

export interface LegalAiMeta {
  engine: string;
  needsHumanReview: boolean;
  disclaimer: string;
  error?: string;
}

export interface CaseTimelineItem {
  date: string;
  label: string;
  type: 'hearing' | 'deadline' | 'task' | 'fact' | 'filing';
  source: string;
  snippet: string;
}

export interface CaseRelationNode {
  id: string;
  label: string;
  role: string;
  kind: 'party' | 'client';
}

export interface CaseRelationLink {
  from: string;
  to: string;
  relation: string;
}

export interface CaseDispute {
  label: string;
  basis: string;
  support: string;
}

export interface CaseAnalysisResult extends LegalAiMeta {
  matterId: number;
  matterTitle: string;
  caseNumber: string | null;
  evidenceCount: number;
  documents: Array<{ id: number; title: string; category: string }>;
  timeline: CaseTimelineItem[];
  relations: { nodes: CaseRelationNode[]; links: CaseRelationLink[] };
  disputes: CaseDispute[];
  gaps: string[];
  summary: string;
}

export interface StatuteCitation {
  code: string;
  title: string;
  article: string;
  text: string;
  status: string;
  effectiveFrom: string;
  source: string;
  verified: boolean;
  statusValid: boolean;
  statusNote: string;
}

export interface DraftSection {
  heading: string;
  content: string;
}

export interface DraftResult extends LegalAiMeta {
  matterId: number;
  docType: 'complaint' | 'letter' | 'answer' | 'opinion';
  stance: string;
  title: string;
  sections: DraftSection[];
  fullText: string;
  references: Array<{ id: number; title: string; version: string }>;
  citations: StatuteCitation[];
  reviewChecklist: string[];
  pendingTasks: string[];
  noteCount: number;
  sourceCounts: { documents: number; notes: number; parties: number };
}

export interface ContractRisk {
  clause: string;
  label: string;
  level: '高' | '中' | '低';
  category: string;
  advice: string;
  replacement: string;
  statute: StatuteCitation;
}

export interface ContractMissing {
  label: string;
  suggestion: string;
}

export interface ContractReviewResult extends LegalAiMeta {
  documentId: number | null;
  documentTitle: string;
  stance: 'buyer' | 'seller' | 'neutral';
  toughness: 'standard' | 'strong';
  stanceLabel: string;
  clauseCount: number;
  risks: ContractRisk[];
  missing: ContractMissing[];
  summary: string;
}

export interface CaseBrief {
  id: string;
  title: string;
  court: string;
  year: string;
  cause: string;
  holding: string;
  topics: string[];
}

export interface ResearchResult extends LegalAiMeta {
  question: string;
  source: string;
  conclusion: string;
  citations: StatuteCitation[];
  validCitations: StatuteCitation[];
  invalidCitations: StatuteCitation[];
  antiHallucination: string;
  caseBriefs: CaseBrief[];
  trackedStatutes: Array<{ id: number; title: string; dueDate: string | null; status: string; note: string | null }>;
  disclaimer: string;
}

export interface AdminReminder {
  date: string;
  label: string;
  source: string;
  type: string;
}

export interface AdminAssistantResult extends LegalAiMeta {
  periodDays: number;
  weeklyReport: string;
  sourceCounts: { timeEntries: number; completedTasks: number; outbound: number };
  privacyNote: string;
  reminders: AdminReminder[];
  reminderNote: string;
  ownerOptions: Array<{ id: number; name: string }>;
}

export type CaseAnalysisInput = { matterId: number; text?: string; actorId?: number };
export type DraftInput = { matterId: number; docType: 'complaint' | 'letter' | 'answer' | 'opinion'; stance?: string; actorId?: number };
export type ContractReviewInput = {
  documentId?: number;
  text?: string;
  stance: 'buyer' | 'seller' | 'neutral';
  toughness: 'standard' | 'strong';
  actorId?: number;
};
export type LegalResearchInput = { question: string; matterId?: number; actorId?: number };
export type AdminAssistantInput = { matterId?: number; periodDays?: number; actorId?: number };

/** AI 洞察：经营趋势、待办优先级、风险提示与客户活跃度。 */
export interface InsightTrend {
  key: string;
  label: string;
  unit: string;
  detail: string;
  current: number;
  previous: number;
  changePct: number;
  direction: 'up' | 'down' | 'flat';
}

export interface InsightPriority {
  id: number;
  title: string;
  type: string;
  priority: string;
  dueDate: string | null;
  matterTitle: string | null;
  score: number;
  reason: string;
  route: string;
}

export interface InsightRisk {
  type: string;
  level: 'high' | 'medium' | 'low';
  label: string;
  detail: string;
  count: number;
  route: string;
}

export interface InsightClientActivity {
  clientId: number;
  name: string;
  lastContactDate: string | null;
  daysSince: number;
  status: '活跃' | '需关注' | '沉默';
  suggestion: string;
}

export interface InsightResult extends LegalAiMeta {
  period: { days: number; from: string; to: string };
  trends: InsightTrend[];
  priorities: InsightPriority[];
  risks: InsightRisk[];
  clientActivity: InsightClientActivity[];
  summary: string;
  rankingRule: string;
  sourceCounts: {
    matters: number;
    timeEntries: number;
    invoices: number;
    clients: number;
    tasks: number;
    communications: number;
  };
}

export type InsightInput = { periodDays?: number; matterId?: number; actorId?: number };

/* ------------------------- Legal Toolbox domain ------------------------- */

/** 工具箱统一声明：本地规则 + 需人工核对。 */
export interface ToolboxMeta {
  engine: string;
  needsHumanReview: boolean;
  disclaimer: string;
  error?: string;
}

export interface ToolResult<T> extends ToolboxMeta {
  result: T;
}

export interface ToolboxMetaResult extends ToolboxMeta {
  jurisdictions: Array<{ code: string; label: string }>;
  lprHistory: Array<{ from: string; oneYear: number; fiveYear: number }>;
  compensationStats: Record<string, { disposable: number; avgWage: number; label: string }>;
  deadlinePresets: Record<string, { label: string; days: number; basis: string }>;
  feeCaseTypes: Array<{ code: string; label: string }>;
  demoCompanies: Array<{ name: string; riskLevel: string }>;
}

export interface FeeBracketRow {
  label: string;
  base: number;
  rate: number;
  fee: number;
}

export interface LitigationFeeResult {
  caseType: string;
  caseTypeLabel: string;
  jurisdiction: string;
  jurisdictionLabel: string;
  amount: number;
  baseFee: number;
  reduction: string;
  finalFee: number;
  detail: FeeBracketRow[] | null;
  preservationFee: number;
  preservationCapped: boolean;
  arbitration: { table: string; fee: number };
  localFees: { announcement: number; guaranteeService: number; note: string };
  totalEstimate: number;
  disclaimer: string;
}

export interface InterestRow {
  from: string;
  to: string;
  days: number;
  rate: number;
  interest: number;
  principalAfter: number;
}

export interface InterestResult {
  error?: string;
  principal: number;
  paidAmount: number;
  rateSource: string;
  compound: string;
  segments: InterestRow[];
  totalInterest: number;
  delayDays: number;
  delayInterest: number;
  total: number;
  disclaimer: string;
}

export interface CompensationItem {
  label: string;
  amount: number;
  basis: string;
}

export interface CompensationResult {
  type: string;
  region: string;
  items: CompensationItem[];
  total: number;
  disclaimer: string;
}

export interface DeadlineToolResult {
  type: string;
  label: string;
  basis: string;
  triggerDate: string;
  days: number;
  businessDaysOnly: boolean;
  items: DeadlineItem[];
  holidayCount: number;
  disclaimer: string;
}

export interface RedactionHit {
  kind: string;
  raw: string;
  masked: string;
  start: number;
  end: number;
}

export interface RedactResult {
  inputLength: number;
  redactedText: string;
  hitCount: number;
  byKind: Record<string, number>;
  hits: RedactionHit[];
  disclaimer: string;
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

export interface EvidenceCatalogResult {
  caseName: string;
  submitter: string | null;
  rows: CatalogRow[];
  totalGroups: number;
  totalPages: number;
  text: string;
  disclaimer: string;
}

export interface OcrJob {
  id: number;
  name: string;
  size: number | null;
  pages: number;
  fileType: string;
  supported: boolean;
  status: string;
  outputName: string | null;
  confidence: number | null;
}

export interface OcrBatchResult {
  jobs: OcrJob[];
  total: number;
  supported: number;
  mode: string;
  disclaimer: string;
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
  shareholders: Array<{ id: string; name: string; type: 'company' | 'person'; ratio: number }>;
  equityEdges: Array<{ from: string; to: string; label: string }>;
  lawsuits: Array<{ caseNo: string; cause: string; role: string; amount: string; date: string; status: string }>;
  executions: Array<{ caseNo: string; amount: string; date: string; status: string }>;
  restrictions: Array<{ caseNo: string; date: string; reason: string }>;
}

export interface CompanyCheckResponse extends ToolboxMeta {
  found: boolean;
  query: string;
  result: CompanyRecord | null;
  dataSource?: string;
  dataSourceLabel?: string;
  message: string;
}

export interface ToolCalculation extends BaseRecord {
  matterId: number;
  toolCode: string;
  toolName: string;
  title: string;
  input: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  summary: string | null;
  createdById: number | null;
}

export interface ToolCalculationInput {
  matterId: number;
  toolCode: string;
  toolName: string;
  title: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  summary?: string;
}

export type LitigationFeeInput = {
  caseType: string;
  amount?: number;
  jurisdiction?: string;
  reduction?: 'none' | 'half';
};
export type InterestInput = {
  principal: number;
  startDate: string;
  endDate: string;
  compound?: 'single' | 'yearly' | 'monthly';
  rateSource?: '1y' | '5y' | 'manual';
  manualRate?: number;
  segments?: Array<{ from: string; rate: number }>;
  paidAmount?: number;
  doubleDelay?: boolean;
  delayStartDate?: string;
};
export type CompensationInput = {
  type: 'personal' | 'work_injury' | 'work_death' | 'economic';
  region?: string;
  medicalCost?: number;
  lostWageMonths?: number;
  monthlyWage?: number;
  careMonths?: number;
  disabilityGrade?: number;
  otherCost?: number;
  yearsWorked?: number;
  compensationMode?: 'N' | 'N1' | '2N';
  applyTripleCap?: boolean;
  localAverageWage?: number;
};
export type DeadlineToolInput = {
  type: 'appeal' | 'evidence' | 'execution' | 'answer' | 'custom';
  triggerDate: string;
  days?: number;
  label?: string;
  businessDaysOnly?: boolean;
};
export type RedactInput = { text: string; only?: 'idCard' | 'bankCard' | 'phone' | 'email' };
export type EvidenceCatalogInput = {
  caseName: string;
  matterId?: number;
  submitter?: string;
  items: Array<{ name: string; type?: string; source?: string; pages?: number; note?: string }>;
};
export type OcrBatchInput = { files: Array<{ name: string; size?: number; pages?: number }> };
export type CompanyCheckInput = { name: string };

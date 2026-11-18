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

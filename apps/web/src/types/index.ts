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
  matter?: Matter | null;
  assignee?: User | null;
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
  matter?: Matter | null;
  client?: Client | null;
  uploadedBy?: User | null;
}

export interface TimeEntry extends BaseRecord {
  matterId: number;
  userId: number;
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  rate: number;
  amount: number;
  invoiced: boolean;
  invoiceId?: number | null;
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

export type CommunicationType = 'email' | 'sms' | 'call' | 'meeting' | 'message' | 'letter';
export type CommunicationDirection = 'inbound' | 'outbound';

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
  matter?: Matter | null;
  client?: Client | null;
  contact?: Contact | null;
  user?: User | null;
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
  };
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
};

export type NoteInput = {
  title?: string | null;
  content: string;
  targetType: NoteTargetType;
  targetId: number;
  authorId?: number | null;
};

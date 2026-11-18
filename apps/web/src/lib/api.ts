import type {
  Client,
  ClientInput,
  Communication,
  CommunicationInput,
  ConflictCheck,
  ConflictCheckInput,
  ConflictCheckResult,
  Contact,
  ContactInput,
  DashboardSummary,
  Document,
  DocumentInput,
  Expense,
  ExpenseInput,
  Invoice,
  InvoiceInput,
  Lead,
  LeadConvertInput,
  LeadConvertResult,
  LeadInput,
  Matter,
  MatterInput,
  MatterStage,
  MatterStageInput,
  Note,
  NoteInput,
  Payment,
  PaymentInput,
  ReportData,
  SearchResults,
  Task,
  TaskInput,
  TimeEntry,
  TimeEntryInput,
  TrustTransaction,
  TrustTransactionInput,
  User,
  UserInput,
} from '@/types';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('无法连接到服务器，请检查网络或服务是否已启动', 0);
  }

  if (!response.ok) {
    let message = `请求失败 (${response.status})`;
    try {
      const payload = (await response.json()) as { message?: string | string[]; error?: string };
      if (payload.message) {
        message = Array.isArray(payload.message) ? payload.message.join('，') : payload.message;
      } else if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Response body was not JSON; keep the status based message.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function toQuery(params: Record<string, unknown> = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

function send<T>(method: 'POST' | 'PATCH' | 'DELETE', path: string, data?: unknown): Promise<T> {
  return request<T>(path, {
    method,
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
}

function crud<T, TInput>(resource: string) {
  return {
    list: (params: Record<string, unknown> = {}) => request<T[]>(`/${resource}${toQuery(params)}`),
    get: (id: number) => request<T>(`/${resource}/${id}`),
    create: (data: TInput) => send<T>('POST', `/${resource}`, data),
    update: (id: number, data: Partial<TInput>) => send<T>('PATCH', `/${resource}/${id}`, data),
    remove: (id: number) => send<{ id: number }>('DELETE', `/${resource}/${id}`),
  };
}

export const api = {
  users: crud<User, UserInput>('users'),
  clients: crud<Client, ClientInput>('clients'),
  contacts: crud<Contact, ContactInput>('contacts'),
  matterStages: crud<MatterStage, MatterStageInput>('matter-stages'),
  matters: {
    ...crud<Matter, MatterInput>('matters'),
    move: (id: number, stageId: number, position?: number) =>
      send<Matter>('PATCH', `/matters/${id}/stage`, { stageId, position }),
  },
  leads: {
    ...crud<Lead, LeadInput>('leads'),
    convert: (id: number, data?: LeadConvertInput) => send<LeadConvertResult>('POST', `/leads/${id}/convert`, data),
  },
  conflicts: {
    ...crud<ConflictCheck, ConflictCheckInput>('conflicts'),
    check: (data: ConflictCheckInput) => send<ConflictCheckResult>('POST', '/conflicts/check', data),
  },
  tasks: {
    ...crud<Task, TaskInput>('tasks'),
    toggle: (id: number) => send<Task>('PATCH', `/tasks/${id}/toggle`),
  },
  documents: crud<Document, DocumentInput>('documents'),
  timeEntries: crud<TimeEntry, TimeEntryInput>('time-entries'),
  expenses: crud<Expense, ExpenseInput>('expenses'),
  invoices: {
    ...crud<Invoice, InvoiceInput>('invoices'),
    approve: (id: number) => send<Invoice>('POST', `/invoices/${id}/approve`),
    send: (id: number) => send<Invoice>('POST', `/invoices/${id}/send`),
    void: (id: number) => send<Invoice>('POST', `/invoices/${id}/void`),
    pay: (id: number, data: PaymentInput) => send<Invoice>('POST', `/invoices/${id}/payments`, data),
  },
  payments: crud<Payment, PaymentInput>('payments'),
  trustTransactions: {
    ...crud<TrustTransaction, TrustTransactionInput>('trust-transactions'),
    reconcile: (id: number) => send<TrustTransaction>('PATCH', `/trust-transactions/${id}/reconcile`),
  },
  communications: crud<Communication, CommunicationInput>('communications'),
  notes: crud<Note, NoteInput>('notes'),
  search: (query: string) => request<SearchResults>(`/search?q=${encodeURIComponent(query)}`),
  dashboard: {
    summary: () => request<DashboardSummary>('/dashboard/summary'),
    reports: (days = 90) => request<ReportData>(`/dashboard/reports?days=${days}`),
  },
};

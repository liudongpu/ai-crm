import type {
  CalendarDraftEvent,
  CalendarOverview,
  CalendarReminder,
  Client,
  ClientInput,
  Communication,
  CommunicationInput,
  ConflictCheck,
  ConflictCheckInput,
  ConflictCheckResult,
  Contact,
  ContactInput,
  CourtHoliday,
  CourtHolidayInput,
  CourtRule,
  CourtRuleInput,
  DashboardSummary,
  DeadlineCalculateInput,
  DeadlineCalculation,
  DeadlineStatus,
  DeadlineToEventsResult,
  Document,
  DocumentInput,
  DraftExtractInput,
  DraftUpdateInput,
  Expense,
  ExpenseInput,
  Feature,
  FeatureCatalog,
  FeatureQuery,
  FeatureRecord,
  FeatureRecordInput,
  FeatureRecordQuery,
  FeatureStats,
  IcsImportInput,
  IcsImportResult,
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
  ReminderInput,
  ReportData,
  SearchResults,
  Statute,
  StatuteInput,
  Task,
  TaskInput,
  TimeEntry,
  TimeEntryInput,
  TimeLinkInput,
  TrustTransaction,
  TrustTransactionInput,
  User,
  UserInput,
  WorkspaceDefinition,
  WorkspaceItem,
  WorkspaceItemInput,
  WorkspaceItemQuery,
  WorkspaceSetting,
  WorkspaceStats,
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

/** Fetch a non-JSON response (ICS feed) with the same error handling as request(). */
async function requestText(path: string, init?: RequestInit): Promise<string> {
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
      // Non-JSON error body; keep the status based message.
    }
    throw new ApiError(message, response.status);
  }
  return response.text();
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

/** Feature catalog requests (paths mirror the backend feature module exactly). */
export const getFeatureCatalog = () => request<FeatureCatalog[]>('/features/catalog');

export const getFeatures = (params: FeatureQuery = {}) =>
  request<Feature[]>(`/features${toQuery(params)}`);

export const getFeatureRecords = (params: FeatureRecordQuery = {}) =>
  request<FeatureRecord[]>(`/features/records${toQuery(params)}`);

export const getFeatureRecord = (id: number) => request<FeatureRecord>(`/features/records/${id}`);

export const createFeatureRecord = (data: FeatureRecordInput) =>
  send<FeatureRecord>('POST', '/features/records', data);

export const updateFeatureRecord = (id: number, data: Partial<FeatureRecordInput>) =>
  send<FeatureRecord>('PATCH', `/features/records/${id}`, data);

export const deleteFeatureRecord = (id: number) => send<{ id: number }>('DELETE', `/features/records/${id}`);

export const getFeatureStats = (featureCode: string) =>
  request<FeatureStats>(`/features/stats${toQuery({ featureCode })}`);

/** 可扩展工作台：按功能域的 schema 驱动页面。 */
export const getWorkspaceDefinitions = () =>
  request<WorkspaceDefinition[]>('/workspace/definitions');

export const getWorkspaceDefinition = (code: string) =>
  request<WorkspaceDefinition>(`/workspace/definitions/${code}`);

export const getWorkspaceItems = (params: WorkspaceItemQuery = {}) =>
  request<WorkspaceItem[]>(`/workspace/items${toQuery(params)}`);

export const getWorkspaceItem = (id: number) => request<WorkspaceItem>(`/workspace/items/${id}`);

export const createWorkspaceItem = (data: WorkspaceItemInput) =>
  send<WorkspaceItem>('POST', '/workspace/items', data);

export const updateWorkspaceItem = (id: number, data: Partial<WorkspaceItemInput>) =>
  send<WorkspaceItem>('PATCH', `/workspace/items/${id}`, data);

export const deleteWorkspaceItem = (id: number) =>
  send<{ id: number }>('DELETE', `/workspace/items/${id}`);

export const getWorkspaceStats = (featureCode: string) =>
  request<WorkspaceStats>(`/workspace/stats${toQuery({ featureCode })}`);

export const getWorkspaceSettings = (featureCode: string) =>
  request<WorkspaceSetting[]>(`/workspace/settings${toQuery({ featureCode })}`);

export const updateWorkspaceSettings = (
  featureCode: string,
  values: Array<{ key: string; value: string }>,
) => request<WorkspaceSetting[]>(`/workspace/settings/${featureCode}`, {
  method: 'PUT',
  body: JSON.stringify(values),
});

export const api = {
  workspace: {
    definitions: getWorkspaceDefinitions,
    definition: getWorkspaceDefinition,
    items: getWorkspaceItems,
    item: getWorkspaceItem,
    create: createWorkspaceItem,
    update: updateWorkspaceItem,
    remove: deleteWorkspaceItem,
    stats: getWorkspaceStats,
    settings: getWorkspaceSettings,
    updateSettings: updateWorkspaceSettings,
  },
  features: {
    catalog: getFeatureCatalog,
    list: getFeatures,
    records: getFeatureRecords,
    record: getFeatureRecord,
    create: createFeatureRecord,
    update: updateFeatureRecord,
    remove: deleteFeatureRecord,
    stats: getFeatureStats,
  },
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
  calendar: {
    events: {
      list: (params: Record<string, unknown> = {}) =>
        request<Task[]>(`/calendar/events${toQuery(params)}`),
      create: (data: TaskInput) => send<Task>('POST', '/calendar/events', data),
      update: (id: number, data: Partial<TaskInput>) =>
        send<Task>('PATCH', `/calendar/events/${id}`, data),
      remove: (id: number) => send<{ id: number }>('DELETE', `/calendar/events/${id}`),
    },
    overview: (params: Record<string, unknown> = {}) =>
      request<CalendarOverview>(`/calendar/overview${toQuery(params)}`),
    rules: {
      list: () => request<CourtRule[]>('/calendar/rules'),
      create: (data: CourtRuleInput) => send<CourtRule>('POST', '/calendar/rules', data),
    },
    holidays: {
      list: () => request<CourtHoliday[]>('/calendar/holidays'),
      create: (data: CourtHolidayInput) => send<CourtHoliday>('POST', '/calendar/holidays', data),
      remove: (id: number) => send<{ id: number }>('DELETE', `/calendar/holidays/${id}`),
    },
    deadlines: {
      list: (params: Record<string, unknown> = {}) =>
        request<DeadlineCalculation[]>(`/calendar/deadlines${toQuery(params)}`),
      get: (id: number) => request<DeadlineCalculation>(`/calendar/deadlines/${id}`),
      calculate: (data: DeadlineCalculateInput) =>
        send<DeadlineCalculation>('POST', '/calendar/deadlines/calculate', data),
      updateTrigger: (id: number, triggerDate: string) =>
        send<DeadlineCalculation>('PATCH', `/calendar/deadlines/${id}/trigger`, { triggerDate }),
      updateStatus: (id: number, status: DeadlineStatus) =>
        send<DeadlineCalculation>('PATCH', `/calendar/deadlines/${id}/status`, { status }),
      remove: (id: number) => send<{ id: number }>('DELETE', `/calendar/deadlines/${id}`),
      toEvents: (id: number) =>
        send<DeadlineToEventsResult>('POST', `/calendar/deadlines/${id}/to-events`),
    },
    statutes: crud<Statute, StatuteInput>('calendar/statutes'),
    assistant: {
      extract: (data: DraftExtractInput) =>
        send<CalendarDraftEvent[]>('POST', '/calendar/assistant/extract', data),
      drafts: {
        list: (params: Record<string, unknown> = {}) =>
          request<CalendarDraftEvent[]>(`/calendar/assistant/drafts${toQuery(params)}`),
        update: (id: number, data: DraftUpdateInput) =>
          send<CalendarDraftEvent>('PATCH', `/calendar/assistant/drafts/${id}`, data),
        remove: (id: number) => send<{ id: number }>('DELETE', `/calendar/assistant/drafts/${id}`),
      },
    },
    exportIcs: (params: Record<string, unknown> = {}) =>
      requestText(`/calendar/feed.ics${toQuery(params)}`),
    importIcs: (data: IcsImportInput) =>
      send<IcsImportResult>('POST', '/calendar/import', data),
    reminders: {
      ...crud<CalendarReminder, ReminderInput>('calendar/reminders'),
      update: (id: number, data: Partial<ReminderInput>) =>
        send<CalendarReminder>('PATCH', `/calendar/reminders/${id}`, data),
    },
    timeLink: {
      unlogged: (params: Record<string, unknown> = {}) =>
        request<Task[]>(`/calendar/time-link/unlogged${toQuery(params)}`),
      logged: () => request<TimeEntry[]>('/calendar/time-link/logged'),
      create: (data: TimeLinkInput) => send<TimeEntry>('POST', '/calendar/time-link', data),
    },
  },
  search: (query: string) => request<SearchResults>(`/search?q=${encodeURIComponent(query)}`),
  dashboard: {
    summary: () => request<DashboardSummary>('/dashboard/summary'),
    reports: (days = 90) => request<ReportData>(`/dashboard/reports?days=${days}`),
  },
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  api,
  createFeatureRecord,
  deleteFeatureRecord,
  getFeatureCatalog,
  getFeatureRecord,
  getFeatureRecords,
  getFeatureStats,
  getFeatures,
  getWorkspaceDefinition,
  getWorkspaceDefinitions,
  getWorkspaceItem,
  getWorkspaceItems,
  getWorkspaceSettings,
  getWorkspaceStats,
  updateFeatureRecord,
  updateWorkspaceItem,
  updateWorkspaceSettings,
  createWorkspaceItem,
  deleteWorkspaceItem,
} from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import type {
  CalendarDraftEvent,
  ClientInput,
  CourtHolidayInput,
  CourtRuleInput,
  DeadlineCalculateInput,
  DeadlineCalculation,
  DeadlineStatus,
  DeadlineToEventsResult,
  DraftExtractInput,
  DraftUpdateInput,
  FeatureQuery,
  FeatureRecord,
  FeatureRecordInput,
  FeatureRecordQuery,
  FeatureStats,
  FeatureCatalog,
  Feature,
  CommunicationInput,
  ConflictCheckInput,
  ConflictCheckResult,
  ContactInput,
  DocumentInput,
  ExpenseInput,
  IcsImportInput,
  IcsImportResult,
  InvoiceInput,
  LeadConvertInput,
  LeadConvertResult,
  LeadInput,
  MatterInput,
  NoteInput,
  PaymentInput,
  ReminderInput,
  StatuteInput,
  TaskInput,
  TimeEntryInput,
  TimeLinkInput,
  TrustTransactionInput,
  UserInput,
  WorkspaceDefinition,
  WorkspaceItemInput,
  WorkspaceItemQuery,
  WorkspaceSetting,
  WorkspaceStats,
} from '@/types';

export const keys = {
  users: ['users'] as const,
  clients: ['clients'] as const,
  contacts: ['contacts'] as const,
  matterStages: ['matterStages'] as const,
  matters: ['matters'] as const,
  leads: ['leads'] as const,
  conflicts: ['conflicts'] as const,
  tasks: ['tasks'] as const,
  documents: ['documents'] as const,
  timeEntries: ['timeEntries'] as const,
  expenses: ['expenses'] as const,
  invoices: ['invoices'] as const,
  payments: ['payments'] as const,
  trustTransactions: ['trustTransactions'] as const,
  communications: ['communications'] as const,
  notes: ['notes'] as const,
  calendar: {
    all: ['calendar'] as const,
    events: ['calendar', 'events'] as const,
    overview: ['calendar', 'overview'] as const,
    rules: ['calendar', 'rules'] as const,
    holidays: ['calendar', 'holidays'] as const,
    deadlines: ['calendar', 'deadlines'] as const,
    statutes: ['calendar', 'statutes'] as const,
    drafts: ['calendar', 'drafts'] as const,
    reminders: ['calendar', 'reminders'] as const,
    unlogged: ['calendar', 'time-link', 'unlogged'] as const,
    logged: ['calendar', 'time-link', 'logged'] as const,
  },
  featureCatalog: ['featureCatalog'] as const,
  features: ['features'] as const,
  featureRecords: ['featureRecords'] as const,
  featureStats: ['featureStats'] as const,
  workspace: {
    definitions: ['workspace', 'definitions'] as const,
    definition: ['workspace', 'definition'] as const,
    items: ['workspace', 'items'] as const,
    stats: ['workspace', 'stats'] as const,
    settings: ['workspace', 'settings'] as const,
  },
  dashboard: ['dashboard'] as const,
  reports: ['reports'] as const,
  search: ['search'] as const,
};

type Params = Record<string, unknown>;
type UpdateArgs<T> = { id: number; data: Partial<T> };

function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries();
  };
}

function useNotifyError() {
  const toast = useToast();
  return (error: Error) => toast.error(`操作失败：${error.message}`);
}

function useCreateMutation<TInput>(fn: (data: TInput) => Promise<unknown>, success: string) {
  const refresh = useRefresh();
  const toast = useToast();
  const onError = useNotifyError();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      refresh();
      toast.success(success);
    },
    onError,
  });
}

function useUpdateMutation<TInput>(fn: (args: UpdateArgs<TInput>) => Promise<unknown>, success: string) {
  const refresh = useRefresh();
  const toast = useToast();
  const onError = useNotifyError();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      refresh();
      toast.success(success);
    },
    onError,
  });
}

function useDeleteMutation(fn: (id: number) => Promise<unknown>, success: string) {
  const refresh = useRefresh();
  const toast = useToast();
  const onError = useNotifyError();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      refresh();
      toast.success(success);
    },
    onError,
  });
}

function useActionMutation<TArgs, TResult = unknown>(fn: (args: TArgs) => Promise<TResult>, success?: string) {
  const refresh = useRefresh();
  const toast = useToast();
  const onError = useNotifyError();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      refresh();
      if (success) toast.success(success);
    },
    onError,
  });
}

/* ------------------------------- Queries -------------------------------- */

function useList<T>(key: readonly unknown[], fn: () => Promise<T[]>, params: Params = {}) {
  return useQuery({ queryKey: [...key, params], queryFn: fn });
}

function useDetail<T>(key: readonly unknown[], id: number | undefined, fn: () => Promise<T>) {
  return useQuery({ queryKey: [...key, 'detail', id], queryFn: fn, enabled: id !== undefined });
}

export const useUsers = () => useList(keys.users, () => api.users.list());
export const useUser = (id?: number) => useDetail(keys.users, id, () => api.users.get(id!));

export const useClients = (params: Params = {}) => useList(keys.clients, () => api.clients.list(params), params);
export const useClient = (id?: number) => useDetail(keys.clients, id, () => api.clients.get(id!));

export const useContacts = (params: Params = {}) => useList(keys.contacts, () => api.contacts.list(params), params);
export const useContact = (id?: number) => useDetail(keys.contacts, id, () => api.contacts.get(id!));

export const useMatterStages = () => useList(keys.matterStages, () => api.matterStages.list());
export const useMatters = (params: Params = {}) => useList(keys.matters, () => api.matters.list(params), params);
export const useMatter = (id?: number) => useDetail(keys.matters, id, () => api.matters.get(id!));

export const useLeads = (params: Params = {}) => useList(keys.leads, () => api.leads.list(params), params);
export const useLead = (id?: number) => useDetail(keys.leads, id, () => api.leads.get(id!));

export const useConflicts = () => useList(keys.conflicts, () => api.conflicts.list());
export const useTasks = (params: Params = {}) => useList(keys.tasks, () => api.tasks.list(params), params);
export const useDocuments = (params: Params = {}) => useList(keys.documents, () => api.documents.list(params), params);
export const useTimeEntries = (params: Params = {}) => useList(keys.timeEntries, () => api.timeEntries.list(params), params);
export const useExpenses = (params: Params = {}) => useList(keys.expenses, () => api.expenses.list(params), params);
export const useInvoices = (params: Params = {}) => useList(keys.invoices, () => api.invoices.list(params), params);
export const useInvoice = (id?: number) => useDetail(keys.invoices, id, () => api.invoices.get(id!));
export const usePayments = (params: Params = {}) => useList(keys.payments, () => api.payments.list(params), params);
export const useTrustTransactions = (params: Params = {}) =>
  useList(keys.trustTransactions, () => api.trustTransactions.list(params), params);
export const useCommunications = (params: Params = {}) =>
  useList(keys.communications, () => api.communications.list(params), params);
export const useNotes = (params: Params = {}) => useList(keys.notes, () => api.notes.list(params), params);

export const useCalendarEvents = (params: Params = {}) =>
  useList(keys.calendar.events, () => api.calendar.events.list(params), params);

export const useCalendarOverview = (params: Params = {}) =>
  useQuery({
    queryKey: [...keys.calendar.overview, params],
    queryFn: () => api.calendar.overview(params),
  });

export const useCourtRules = () => useList(keys.calendar.rules, () => api.calendar.rules.list());
export const useCourtHolidays = () => useList(keys.calendar.holidays, () => api.calendar.holidays.list());

export const useDeadlines = (params: Params = {}) =>
  useList(keys.calendar.deadlines, () => api.calendar.deadlines.list(params), params);

export const useDeadline = (id?: number) =>
  useDetail(keys.calendar.deadlines, id, () => api.calendar.deadlines.get(id!));

export const useStatutes = (params: Params = {}) =>
  useList(keys.calendar.statutes, () => api.calendar.statutes.list(params), params);

export const useAssistantDrafts = (params: Params = {}) =>
  useList(keys.calendar.drafts, () => api.calendar.assistant.drafts.list(params), params);

export const useCalendarReminders = (params: Params = {}) =>
  useList(keys.calendar.reminders, () => api.calendar.reminders.list(params), params);

export const useUnloggedEvents = (params: Params = {}) =>
  useList(keys.calendar.unlogged, () => api.calendar.timeLink.unlogged(params), params);

export const useLoggedTimeEntries = () =>
  useList(keys.calendar.logged, () => api.calendar.timeLink.logged());

export const useFeatureCatalog = () =>
  useQuery<FeatureCatalog[]>({ queryKey: keys.featureCatalog, queryFn: getFeatureCatalog });

export const useFeatures = (params: FeatureQuery = {}) =>
  useList<Feature>(keys.features, () => getFeatures(params), params);

export const useFeatureRecords = (params: FeatureRecordQuery = {}) =>
  useList(keys.featureRecords, () => getFeatureRecords(params), params);

export const useFeatureRecord = (id?: number) =>
  useDetail<FeatureRecord>(keys.featureRecords, id, () => getFeatureRecord(id!));

export const useFeatureStats = (featureCode?: string) =>
  useQuery<FeatureStats>({
    queryKey: [...keys.featureStats, featureCode],
    queryFn: () => getFeatureStats(featureCode ?? ''),
    enabled: Boolean(featureCode),
  });

export const useWorkspaceDefinitions = () =>
  useQuery<WorkspaceDefinition[]>({
    queryKey: keys.workspace.definitions,
    queryFn: getWorkspaceDefinitions,
  });

export const useWorkspaceDefinition = (code?: string) =>
  useQuery<WorkspaceDefinition>({
    queryKey: [...keys.workspace.definition, code],
    queryFn: () => getWorkspaceDefinition(code ?? ''),
    enabled: Boolean(code),
  });

export const useWorkspaceItems = (params: WorkspaceItemQuery = {}) =>
  useList(keys.workspace.items, () => getWorkspaceItems(params), params);

export const useWorkspaceItem = (id?: number) =>
  useDetail(keys.workspace.items, id, () => getWorkspaceItem(id!));

export const useWorkspaceStats = (featureCode?: string) =>
  useQuery<WorkspaceStats>({
    queryKey: [...keys.workspace.stats, featureCode],
    queryFn: () => getWorkspaceStats(featureCode ?? ''),
    enabled: Boolean(featureCode),
  });

export const useWorkspaceSettings = (featureCode?: string) =>
  useQuery<WorkspaceSetting[]>({
    queryKey: [...keys.workspace.settings, featureCode],
    queryFn: () => getWorkspaceSettings(featureCode ?? ''),
    enabled: Boolean(featureCode),
  });

export function useDashboard() {
  return useQuery({ queryKey: keys.dashboard, queryFn: api.dashboard.summary });
}

export function useReports(days: number) {
  return useQuery({ queryKey: [...keys.reports, days], queryFn: () => api.dashboard.reports(days) });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: [...keys.search, query],
    queryFn: () => api.search(query),
    enabled: query.trim().length > 0,
  });
}

/* ------------------------------ Mutations ------------------------------- */

export const useCreateUser = () => useCreateMutation<UserInput>(api.users.create, '用户已创建');
export const useUpdateUser = () => useUpdateMutation<UserInput>((args) => api.users.update(args.id, args.data), '用户已更新');
export const useDeleteUser = () => useDeleteMutation(api.users.remove, '用户已删除');

export const useCreateClient = () => useCreateMutation<ClientInput>(api.clients.create, '客户已创建');
export const useUpdateClient = () => useUpdateMutation<ClientInput>((args) => api.clients.update(args.id, args.data), '客户已更新');
export const useDeleteClient = () => useDeleteMutation(api.clients.remove, '客户已删除');

export const useCreateContact = () => useCreateMutation<ContactInput>(api.contacts.create, '联系人已创建');
export const useUpdateContact = () => useUpdateMutation<ContactInput>((args) => api.contacts.update(args.id, args.data), '联系人已更新');
export const useDeleteContact = () => useDeleteMutation(api.contacts.remove, '联系人已删除');

export const useCreateMatter = () => useCreateMutation<MatterInput>(api.matters.create, '案件已创建');
export const useUpdateMatter = () => useUpdateMutation<MatterInput>((args) => api.matters.update(args.id, args.data), '案件已更新');
export const useDeleteMatter = () => useDeleteMutation(api.matters.remove, '案件已删除');
export const useMoveMatter = () =>
  useActionMutation<{ id: number; stageId: number; position?: number }>((args) =>
    api.matters.move(args.id, args.stageId, args.position),
  );

export const useCreateLead = () => useCreateMutation<LeadInput>(api.leads.create, '咨询线索已创建');
export const useUpdateLead = () => useUpdateMutation<LeadInput>((args) => api.leads.update(args.id, args.data), '咨询线索已更新');
export const useDeleteLead = () => useDeleteMutation(api.leads.remove, '咨询线索已删除');
export const useConvertLead = () =>
  useActionMutation<{ id: number; data?: LeadConvertInput }, LeadConvertResult>(
    (args) => api.leads.convert(args.id, args.data),
    '已转换为客户、联系人和案件',
  );

export const useCheckConflict = () =>
  useActionMutation<ConflictCheckInput, ConflictCheckResult>((args) => api.conflicts.check(args));
export const useDeleteConflict = () => useDeleteMutation(api.conflicts.remove, '检查记录已删除');

export const useCreateTask = () => useCreateMutation<TaskInput>(api.tasks.create, '任务已创建');
export const useUpdateTask = () => useUpdateMutation<TaskInput>((args) => api.tasks.update(args.id, args.data), '任务已更新');
export const useDeleteTask = () => useDeleteMutation(api.tasks.remove, '任务已删除');
export const useToggleTask = () =>
  useActionMutation<number>((id) => api.tasks.toggle(id));

export const useCreateDocument = () => useCreateMutation<DocumentInput>(api.documents.create, '文档已创建');
export const useUpdateDocument = () =>
  useUpdateMutation<DocumentInput>((args) => api.documents.update(args.id, args.data), '文档已更新');
export const useDeleteDocument = () => useDeleteMutation(api.documents.remove, '文档已删除');

export const useCreateTimeEntry = () => useCreateMutation<TimeEntryInput>(api.timeEntries.create, '时间记录已创建');
export const useUpdateTimeEntry = () =>
  useUpdateMutation<TimeEntryInput>((args) => api.timeEntries.update(args.id, args.data), '时间记录已更新');
export const useDeleteTimeEntry = () => useDeleteMutation(api.timeEntries.remove, '时间记录已删除');

export const useCreateExpense = () => useCreateMutation<ExpenseInput>(api.expenses.create, '费用已创建');
export const useUpdateExpense = () => useUpdateMutation<ExpenseInput>((args) => api.expenses.update(args.id, args.data), '费用已更新');
export const useDeleteExpense = () => useDeleteMutation(api.expenses.remove, '费用已删除');

export const useCreateInvoice = () => useCreateMutation<InvoiceInput>(api.invoices.create, '账单已创建');
export const useUpdateInvoice = () =>
  useUpdateMutation<InvoiceInput>((args) => api.invoices.update(args.id, args.data), '账单已更新');
export const useDeleteInvoice = () => useDeleteMutation(api.invoices.remove, '账单已删除');
export const useApproveInvoice = () => useActionMutation<number>((id) => api.invoices.approve(id), '账单已审批');
export const useSendInvoice = () => useActionMutation<number>((id) => api.invoices.send(id), '账单已发送');
export const useVoidInvoice = () => useActionMutation<number>((id) => api.invoices.void(id), '账单已作废');
export const usePayInvoice = () =>
  useActionMutation<{ id: number; data: PaymentInput }>(
    (args) => api.invoices.pay(args.id, args.data),
    '收款已记录',
  );

export const useCreatePayment = () => useCreateMutation<PaymentInput>(api.payments.create, '收款已创建');
export const useUpdatePayment = () =>
  useUpdateMutation<PaymentInput>((args) => api.payments.update(args.id, args.data), '收款已更新');
export const useDeletePayment = () => useDeleteMutation(api.payments.remove, '收款已删除');

export const useCreateTrustTransaction = () =>
  useCreateMutation<TrustTransactionInput>(api.trustTransactions.create, '信托交易已创建');
export const useUpdateTrustTransaction = () =>
  useUpdateMutation<TrustTransactionInput>((args) => api.trustTransactions.update(args.id, args.data), '信托交易已更新');
export const useDeleteTrustTransaction = () => useDeleteMutation(api.trustTransactions.remove, '信托交易已删除');
export const useReconcileTrust = () =>
  useActionMutation<number>((id) => api.trustTransactions.reconcile(id), '对账状态已切换');

export const useCreateCommunication = () =>
  useCreateMutation<CommunicationInput>(api.communications.create, '沟通记录已创建');
export const useUpdateCommunication = () =>
  useUpdateMutation<CommunicationInput>((args) => api.communications.update(args.id, args.data), '沟通记录已更新');
export const useDeleteCommunication = () => useDeleteMutation(api.communications.remove, '沟通记录已删除');

export const useCreateNote = () => useCreateMutation<NoteInput>(api.notes.create, '备注已添加');
export const useUpdateNote = () => useUpdateMutation<NoteInput>((args) => api.notes.update(args.id, args.data), '备注已更新');
export const useDeleteNote = () => useDeleteMutation(api.notes.remove, '备注已删除');

/* ---------------------------- Calendar hooks ---------------------------- */

export const useCreateCalendarEvent = () =>
  useCreateMutation<TaskInput>(api.calendar.events.create, '日程已创建');
export const useUpdateCalendarEvent = () =>
  useUpdateMutation<TaskInput>((args) => api.calendar.events.update(args.id, args.data), '日程已更新');
export const useDeleteCalendarEvent = () =>
  useDeleteMutation(api.calendar.events.remove, '日程已删除');

export const useCreateCourtRule = () =>
  useCreateMutation<CourtRuleInput>(api.calendar.rules.create, '法院规则已新增');
export const useCreateCourtHoliday = () =>
  useCreateMutation<CourtHolidayInput>(api.calendar.holidays.create, '法院假期已新增');
export const useDeleteCourtHoliday = () =>
  useDeleteMutation(api.calendar.holidays.remove, '法院假期已删除');

export const useCalculateDeadline = () =>
  useActionMutation<DeadlineCalculateInput, DeadlineCalculation>(
    api.calendar.deadlines.calculate,
    '期限链已计算',
  );
export const useUpdateDeadlineTrigger = () =>
  useActionMutation<{ id: number; triggerDate: string }>(
    (args) => api.calendar.deadlines.updateTrigger(args.id, args.triggerDate),
    '触发日期已更新，期限链已重算',
  );
export const useUpdateDeadlineStatus = () =>
  useActionMutation<{ id: number; status: DeadlineStatus }>(
    (args) => api.calendar.deadlines.updateStatus(args.id, args.status),
    '期限记录状态已更新',
  );
export const useDeleteDeadline = () =>
  useDeleteMutation(api.calendar.deadlines.remove, '期限计算记录已删除');
export const useGenerateDeadlineEvents = () =>
  useActionMutation<number, DeadlineToEventsResult>((id) => api.calendar.deadlines.toEvents(id));

export const useCreateStatute = () =>
  useCreateMutation<StatuteInput>(api.calendar.statutes.create, '时效记录已创建');
export const useUpdateStatute = () =>
  useUpdateMutation<StatuteInput>((args) => api.calendar.statutes.update(args.id, args.data), '时效记录已更新');
export const useDeleteStatute = () =>
  useDeleteMutation(api.calendar.statutes.remove, '时效记录已删除');

export const useExtractDates = () =>
  useActionMutation<DraftExtractInput, CalendarDraftEvent[]>(api.calendar.assistant.extract);
export const useUpdateDraft = () =>
  useActionMutation<{ id: number; data: DraftUpdateInput }>(
    (args) => api.calendar.assistant.drafts.update(args.id, args.data),
    '草稿状态已更新',
  );
export const useDeleteDraft = () =>
  useDeleteMutation(api.calendar.assistant.drafts.remove, '草稿已删除');

export const useImportIcs = () =>
  useActionMutation<IcsImportInput, IcsImportResult>(api.calendar.importIcs);
export const useCreateReminder = () =>
  useCreateMutation<ReminderInput>(api.calendar.reminders.create, '提醒已创建');
export const useUpdateReminder = () =>
  useUpdateMutation<ReminderInput>((args) => api.calendar.reminders.update(args.id, args.data), '提醒已更新');
export const useDeleteReminder = () =>
  useDeleteMutation(api.calendar.reminders.remove, '提醒已删除');
export const useMarkReminderSent = () =>
  useActionMutation<number>((id) => api.calendar.reminders.update(id, { status: 'sent' }), '已标记为已发送');

export const useCreateTimeLink = () =>
  useActionMutation<TimeLinkInput>(api.calendar.timeLink.create, '工时已记录');

export const useCreateFeatureRecord = () =>
  useCreateMutation<FeatureRecordInput>(createFeatureRecord, '功能记录已创建');
export const useUpdateFeatureRecord = () =>
  useUpdateMutation<FeatureRecordInput>((args) => updateFeatureRecord(args.id, args.data), '功能记录已更新');
export const useDeleteFeatureRecord = () => useDeleteMutation(deleteFeatureRecord, '功能记录已删除');

export const useCreateWorkspaceItem = () =>
  useCreateMutation<WorkspaceItemInput>(createWorkspaceItem, '记录已创建');
export const useUpdateWorkspaceItem = () =>
  useUpdateMutation<WorkspaceItemInput>(
    (args) => updateWorkspaceItem(args.id, args.data),
    '记录已更新',
  );
export const useDeleteWorkspaceItem = () => useDeleteMutation(deleteWorkspaceItem, '记录已删除');

export const useUpdateWorkspaceSettings = (featureCode: string) => {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (values: Array<{ key: string; value: string }>) =>
      updateWorkspaceSettings(featureCode, values),
    onSuccess: () => {
      refresh();
      toast.success('本地配置已保存');
    },
    onError: useNotifyError(),
  });
};

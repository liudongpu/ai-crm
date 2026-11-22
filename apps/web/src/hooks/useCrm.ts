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
  AdminAssistantInput,
  AdminAssistantResult,
  AiDraftResult,
  CaseAnalysisInput,
  CaseAnalysisResult,
  ContractReviewInput,
  ContractReviewResult,
  DraftInput,
  DraftResult,
  InsightInput,
  InsightResult,
  LegalResearchInput,
  ResearchResult,
  CompanyCheckInput,
  CompanyCheckResponse,
  CompensationInput,
  CompensationResult,
  DeadlineToolInput,
  DeadlineToolResult,
  EvidenceCatalogInput,
  EvidenceCatalogResult,
  InterestInput,
  InterestResult,
  LitigationFeeInput,
  LitigationFeeResult,
  OcrBatchInput,
  OcrBatchResult,
  RedactInput,
  RedactResult,
  ToolCalculationInput,
  ToolResult,
  MatterInput,
  MatterCategoryInput,
  MatterParty,
  MatterTeamMember,
  MessageTemplate,
  NoteInput,
  PaymentInput,
  ReminderInput,
  StatuteInput,
  TaskInput,
  TaskTemplate,
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
  permissions: ['permissions'] as const,
  clients: ['clients'] as const,
  contacts: ['contacts'] as const,
  matterStages: ['matterStages'] as const,
  matterCategories: ['matterCategories'] as const,
  matters: ['matters'] as const,
  matterParties: ['matterParties'] as const,
  matterTeam: ['matterTeam'] as const,
  leads: ['leads'] as const,
  conflicts: ['conflicts'] as const,
  tasks: ['tasks'] as const,
  taskTemplates: ['taskTemplates'] as const,
  documents: ['documents'] as const,
  timeEntries: ['timeEntries'] as const,
  runningTimer: ['runningTimer'] as const,
  expenses: ['expenses'] as const,
  invoices: ['invoices'] as const,
  payments: ['payments'] as const,
  trustTransactions: ['trustTransactions'] as const,
  communications: ['communications'] as const,
  inbox: ['inbox'] as const,
  messageTemplates: ['messageTemplates'] as const,
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
  legalToolbox: {
    meta: ['legalToolbox', 'meta'] as const,
    calculations: ['legalToolbox', 'calculations'] as const,
  },
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
export const usePermissions = () => useQuery({ queryKey: keys.permissions, queryFn: api.permissions.list });
/** 当前用户权限（由登录用户 id 决定；渠道与审批权限在后端强制校验）。 */
export const useMyPermissions = (userId?: number) =>
  useQuery({
    queryKey: [...keys.permissions, 'me', userId],
    queryFn: () => api.permissions.me(userId),
  });
export const useUpdatePermission = () =>
  useActionMutation<{ id: number; enabled: boolean }>(
    (args) => api.permissions.update(args.id, args.enabled),
    '权限已更新',
  );
export const useUser = (id?: number) => useDetail(keys.users, id, () => api.users.get(id!));

export const useClients = (params: Params = {}) => useList(keys.clients, () => api.clients.list(params), params);
export const useClient = (id?: number) => useDetail(keys.clients, id, () => api.clients.get(id!));

export const useContacts = (params: Params = {}) => useList(keys.contacts, () => api.contacts.list(params), params);
export const useContact = (id?: number) => useDetail(keys.contacts, id, () => api.contacts.get(id!));

export const useMatterStages = () => useList(keys.matterStages, () => api.matterStages.list());
export const useMatterCategories = () => useList(keys.matterCategories, () => api.matterCategories.list());
export const useCreateMatterCategory = () =>
  useCreateMutation<MatterCategoryInput>(api.matterCategories.create, '案件类型已创建');
export const useUpdateMatterCategory = () =>
  useUpdateMutation<MatterCategoryInput>((args) => api.matterCategories.update(args.id, args.data), '案件类型已更新');
export const useDeleteMatterCategory = () =>
  useDeleteMutation(api.matterCategories.remove, '案件类型已删除');
export const useMatters = (params: Params = {}) => useList(keys.matters, () => api.matters.list(params), params);
export const useMatter = (id?: number) => useDetail(keys.matters, id, () => api.matters.get(id!));
export const useMatterParties = (matterId: number) =>
  useQuery({ queryKey: [...keys.matterParties, matterId], queryFn: () => api.matterPeople.parties(matterId), enabled: Number.isFinite(matterId) });
export const useMatterTeam = (matterId: number) =>
  useQuery({ queryKey: [...keys.matterTeam, matterId], queryFn: () => api.matterPeople.team(matterId), enabled: Number.isFinite(matterId) });

export const useLeads = (params: Params = {}) => useList(keys.leads, () => api.leads.list(params), params);
export const useLead = (id?: number) => useDetail(keys.leads, id, () => api.leads.get(id!));

export const useConflicts = () => useList(keys.conflicts, () => api.conflicts.list());
export const useTasks = (params: Params = {}) => useList(keys.tasks, () => api.tasks.list(params), params);
export const useTaskTemplates = () =>
  useQuery({ queryKey: keys.taskTemplates, queryFn: () => api.tasks.templates.list() });
export const useDocuments = (params: Params = {}) => useList(keys.documents, () => api.documents.list(params), params);
export const useTimeEntries = (params: Params = {}) => useList(keys.timeEntries, () => api.timeEntries.list(params), params);
export const useRunningTimer = () => useQuery({ queryKey: keys.runningTimer, queryFn: () => api.timeEntries.running() });
export const useExpenses = (params: Params = {}) => useList(keys.expenses, () => api.expenses.list(params), params);
export const useInvoices = (params: Params = {}) => useList(keys.invoices, () => api.invoices.list(params), params);
export const useInvoice = (id?: number) => useDetail(keys.invoices, id, () => api.invoices.get(id!));
export const usePayments = (params: Params = {}) => useList(keys.payments, () => api.payments.list(params), params);
export const useTrustTransactions = (params: Params = {}) =>
  useList(keys.trustTransactions, () => api.trustTransactions.list(params), params);
export const useCommunications = (params: Params = {}) =>
  useList(keys.communications, () => api.communications.list(params), params);
export const useInbox = () => useQuery({ queryKey: keys.inbox, queryFn: () => api.communications.inbox() });
export const useMessageTemplates = () =>
  useQuery({ queryKey: keys.messageTemplates, queryFn: () => api.communications.templates.list() });
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

export function useCoreReports() {
  return useQuery({ queryKey: [...keys.reports, 'core'], queryFn: api.dashboard.coreReports });
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
export const useAddMatterParty = () =>
  useActionMutation<{ matterId: number; data: Partial<MatterParty> }>(
    (args) => api.matterPeople.addParty(args.matterId, args.data),
    '当事人已添加',
  );
export const useUpdateMatterParty = () =>
  useActionMutation<{ id: number; data: Partial<MatterParty> }>(
    (args) => api.matterPeople.updateParty(args.id, args.data),
    '当事人已更新',
  );
export const useDeleteMatterParty = () =>
  useActionMutation<number>((id) => api.matterPeople.removeParty(id), '当事人已删除');
export const useAddMatterTeamMember = () =>
  useActionMutation<{ matterId: number; data: { userId: number; role: MatterTeamMember['role']; canViewInternal?: boolean } }>(
    (args) => api.matterPeople.addMember(args.matterId, args.data),
    '团队成员已添加',
  );
export const useDeleteMatterTeamMember = () =>
  useActionMutation<number>((id) => api.matterPeople.removeMember(id), '团队成员已移除');
export const useUpdateMatter = () => useUpdateMutation<MatterInput>((args) => api.matters.update(args.id, args.data), '案件已更新');
export const useDeleteMatter = () => useDeleteMutation(api.matters.remove, '案件已删除');
export const useMoveMatter = (success?: string) =>
  useActionMutation<{ id: number; stageId: number; position?: number }>((args) =>
    api.matters.move(args.id, args.stageId, args.position),
    success,
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
export const useCreateTaskFromTemplate = () =>
  useActionMutation<{ id: number; data: { matterId?: number; assigneeId?: number; dueDate?: string } }>(
    (args) => api.tasks.templates.createTask(args.id, args.data),
    '已从模板创建任务',
  );
export const useCreateTaskTemplate = () =>
  useCreateMutation<Partial<TaskTemplate>>(api.tasks.templates.create, '任务模板已创建');
export const useUpdateTaskTemplate = () =>
  useUpdateMutation<Partial<TaskTemplate>>(
    (args) => api.tasks.templates.update(args.id, args.data),
    '任务模板已更新',
  );
export const useDeleteTaskTemplate = () =>
  useDeleteMutation(api.tasks.templates.remove, '任务模板已删除');

export const useCreateDocument = () => useCreateMutation<DocumentInput>(api.documents.create, '文档已创建');
export const useUpdateDocument = () =>
  useUpdateMutation<DocumentInput>((args) => api.documents.update(args.id, args.data), '文档已更新');
export const useDeleteDocument = () => useDeleteMutation(api.documents.remove, '文档已删除');

export const useCreateTimeEntry = () => useCreateMutation<TimeEntryInput>(api.timeEntries.create, '时间记录已创建');
export const useUpdateTimeEntry = () =>
  useUpdateMutation<TimeEntryInput>((args) => api.timeEntries.update(args.id, args.data), '时间记录已更新');
export const useDeleteTimeEntry = () => useDeleteMutation(api.timeEntries.remove, '时间记录已删除');
export const useStartTimer = () => useCreateMutation<TimeEntryInput>(api.timeEntries.startTimer, '计时已开始');
export const useStopTimer = () => useActionMutation<number>(api.timeEntries.stopTimer, '计时已停止并保存');

export const useCreateExpense = () => useCreateMutation<ExpenseInput>(api.expenses.create, '费用已创建');
export const useUpdateExpense = () => useUpdateMutation<ExpenseInput>((args) => api.expenses.update(args.id, args.data), '费用已更新');
export const useDeleteExpense = () => useDeleteMutation(api.expenses.remove, '费用已删除');

export const useCreateInvoice = () => useCreateMutation<InvoiceInput>(api.invoices.create, '账单已创建');
export const useUpdateInvoice = () =>
  useUpdateMutation<InvoiceInput>((args) => api.invoices.update(args.id, args.data), '账单已更新');
export const useDeleteInvoice = () => useDeleteMutation(api.invoices.remove, '账单已删除');
export const useApproveInvoice = () =>
  useActionMutation<{ id: number; actorId?: number }>(
    (args) => api.invoices.approve(args.id, args.actorId),
    '账单已审批',
  );
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

/** M7 统一收件箱动作。 */
export const useArchiveCommunication = () =>
  useActionMutation<{ id: number; data: { matterId: number; clientId?: number } }>(
    (args) => api.communications.archive(args.id, args.data),
    '已归档到案件',
  );
export const useArchiveConversation = () =>
  useActionMutation<{ conversationKey: string; matterId: number; clientId?: number }>(
    (args) => api.communications.archiveConversation(args),
    '会话已归档到案件',
  );
export const useMarkCommunicationRead = () =>
  useActionMutation<number>((id) => api.communications.markRead(id));
export const useMarkCommunicationReplied = () =>
  useActionMutation<number>((id) => api.communications.markReplied(id), '已标记为已回复');
export const useToggleCommunicationFollowUp = () =>
  useActionMutation<number>((id) => api.communications.toggleFollowUp(id));
export const useAiDraft = () =>
  useActionMutation<{ matterId?: number; intent?: string }, AiDraftResult>((args) =>
    api.communications.aiDraft(args),
  );
export const useCreateMessageTemplate = () =>
  useCreateMutation<Partial<MessageTemplate>>(api.communications.templates.create, '消息模板已创建');
export const useUpdateMessageTemplate = () =>
  useUpdateMutation<Partial<MessageTemplate>>(
    (args) => api.communications.templates.update(args.id, args.data),
    '消息模板已更新',
  );
export const useDeleteMessageTemplate = () =>
  useDeleteMutation(api.communications.templates.remove, '消息模板已删除');

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

/* ---------------------------- Legal AI hooks ---------------------------- */

/** 生成动作均只产出草稿，不写入/发送任何对外数据，故不需 refresh。 */
function useLegalAiMutation<TInput extends { actorId?: number }, TResult>(fn: (data: TInput) => Promise<TResult>) {
  const onError = useNotifyError();
  // 演示环境以第一位用户身份发起请求；后端据此校验「使用法律 AI 辅助」权限。
  const { data: users } = useUsers();
  const actorId = users?.[0]?.id;
  return useMutation({
    mutationFn: (data: TInput) => fn(actorId ? { ...data, actorId } : data),
    onError,
  });
}

export const useCaseAnalysis = () =>
  useLegalAiMutation<CaseAnalysisInput, CaseAnalysisResult>(api.legalAi.caseAnalysis);
export const useDraftDocument = () => useLegalAiMutation<DraftInput, DraftResult>(api.legalAi.draft);
export const useContractReview = () =>
  useLegalAiMutation<ContractReviewInput, ContractReviewResult>(api.legalAi.contractReview);
export const useLegalResearch = () =>
  useLegalAiMutation<LegalResearchInput, ResearchResult>(api.legalAi.research);
export const useAdminAssistant = () =>
  useLegalAiMutation<AdminAssistantInput, AdminAssistantResult>(api.legalAi.adminAssistant);
export const useAiInsights = () => useLegalAiMutation<InsightInput, InsightResult>(api.legalAi.insights);

/* -------------------------- Legal Toolbox hooks -------------------------- */

/** 本地规则计算不写库，不刷新缓存；错误由调用方按需提示。 */
function useToolboxMutation<TInput, TResult>(fn: (data: TInput) => Promise<TResult>) {
  return useMutation({ mutationFn: fn, onError: useNotifyError() });
}

export const useToolboxMeta = () =>
  useQuery({ queryKey: keys.legalToolbox.meta, queryFn: api.legalToolbox.meta });

export const useLitigationFee = () =>
  useToolboxMutation<LitigationFeeInput, ToolResult<LitigationFeeResult>>(api.legalToolbox.litigationFee);
export const useInterest = () =>
  useToolboxMutation<InterestInput, ToolResult<InterestResult>>(api.legalToolbox.interest);
export const useCompensation = () =>
  useToolboxMutation<CompensationInput, ToolResult<CompensationResult>>(api.legalToolbox.compensation);
export const useToolDeadline = () =>
  useToolboxMutation<DeadlineToolInput, ToolResult<DeadlineToolResult>>(api.legalToolbox.deadline);
export const useRedact = () =>
  useToolboxMutation<RedactInput, ToolResult<RedactResult>>(api.legalToolbox.redact);
export const useEvidenceCatalog = () =>
  useToolboxMutation<EvidenceCatalogInput, ToolResult<EvidenceCatalogResult>>(api.legalToolbox.evidenceCatalog);
export const useOcrBatch = () =>
  useToolboxMutation<OcrBatchInput, ToolResult<OcrBatchResult>>(api.legalToolbox.ocrBatch);
export const useCompanyCheck = () =>
  useToolboxMutation<CompanyCheckInput, CompanyCheckResponse>(api.legalToolbox.companyCheck);

export const useToolCalculations = (params: { matterId?: number; toolCode?: string } = {}) =>
  useList(keys.legalToolbox.calculations, () => api.legalToolbox.calculations.list(params), params);
export const useSaveToolCalculation = () =>
  useCreateMutation<ToolCalculationInput>(api.legalToolbox.calculations.create, '计算记录已保存到当前案件');
export const useDeleteToolCalculation = () =>
  useDeleteMutation(api.legalToolbox.calculations.remove, '计算记录已删除');

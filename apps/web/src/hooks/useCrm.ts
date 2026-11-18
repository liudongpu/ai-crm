import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import type {
  ClientInput,
  CommunicationInput,
  ConflictCheckInput,
  ConflictCheckResult,
  ContactInput,
  DocumentInput,
  ExpenseInput,
  InvoiceInput,
  LeadConvertInput,
  LeadConvertResult,
  LeadInput,
  MatterInput,
  NoteInput,
  PaymentInput,
  TaskInput,
  TimeEntryInput,
  TrustTransactionInput,
  UserInput,
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

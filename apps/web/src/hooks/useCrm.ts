import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import type {
  ActivityInput,
  CompanyInput,
  ContactInput,
  DealInput,
  LeadInput,
  NoteInput,
} from '@/types';

export const keys = {
  pipelines: ['pipelines'] as const,
  deals: ['deals'] as const,
  contacts: ['contacts'] as const,
  companies: ['companies'] as const,
  leads: ['leads'] as const,
  notes: ['notes'] as const,
  activities: ['activities'] as const,
  dashboard: ['dashboard'] as const,
  reports: ['reports'] as const,
  search: ['search'] as const,
};

function useRefresh() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

function useNotifyError() {
  const toast = useToast();
  return (error: Error) => toast.error(`操作失败：${error.message}`);
}

export function usePipelines() {
  return useQuery({ queryKey: keys.pipelines, queryFn: api.pipelines.list });
}

export function useDeals(search?: string, pipelineId?: number) {
  return useQuery({
    queryKey: [...keys.deals, search, pipelineId],
    queryFn: () => api.deals.list({ search, pipelineId }),
  });
}

export function useDeal(id: number | undefined) {
  return useQuery({ queryKey: [...keys.deals, 'detail', id], queryFn: () => api.deals.get(id!), enabled: !!id });
}

export function useContacts() {
  return useQuery({ queryKey: keys.contacts, queryFn: api.contacts.list });
}

export function useContact(id: number | undefined) {
  return useQuery({ queryKey: [...keys.contacts, 'detail', id], queryFn: () => api.contacts.get(id!), enabled: !!id });
}

export function useCompanies() {
  return useQuery({ queryKey: keys.companies, queryFn: api.companies.list });
}

export function useCompany(id: number | undefined) {
  return useQuery({ queryKey: [...keys.companies, 'detail', id], queryFn: () => api.companies.get(id!), enabled: !!id });
}

export function useLeads(params: { status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: [...keys.leads, params.status, params.search],
    queryFn: () => api.leads.list(params),
  });
}

export function useLead(id: number | undefined) {
  return useQuery({ queryKey: [...keys.leads, 'detail', id], queryFn: () => api.leads.get(id!), enabled: !!id });
}

export function useActivities(params?: { done?: boolean; limit?: number }) {
  return useQuery({
    queryKey: [...keys.activities, params?.done, params?.limit],
    queryFn: () => api.activities.list(params),
  });
}

export function useNotes(params: { targetType?: string; targetId?: number } = {}) {
  return useQuery({
    queryKey: [...keys.notes, params.targetType, params.targetId],
    queryFn: () => api.notes.list(params),
  });
}

export function useDashboard() {
  return useQuery({ queryKey: keys.dashboard, queryFn: api.dashboard.summary });
}

export function useReports(days: number) {
  return useQuery({ queryKey: [...keys.reports, days], queryFn: () => api.reports(days) });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: [...keys.search, query],
    queryFn: () => api.search(query),
    enabled: query.trim().length > 0,
  });
}

export function useCreateDeal() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: DealInput) => api.deals.create(data),
    onSuccess: () => {
      refresh();
      toast.success('商机已创建');
    },
    onError: useNotifyError(),
  });
}

export function useUpdateDeal() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DealInput> }) => api.deals.update(id, data),
    onSuccess: () => {
      refresh();
      toast.success('商机已更新');
    },
    onError: useNotifyError(),
  });
}

export function useMoveDeal() {
  const refresh = useRefresh();
  const onError = useNotifyError();
  return useMutation({
    mutationFn: ({ id, stageId, position }: { id: number; stageId: number; position?: number }) =>
      api.deals.move(id, stageId, position),
    onSuccess: () => refresh(),
    onError,
  });
}

export function useDeleteDeal() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => api.deals.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('商机已删除');
    },
    onError: useNotifyError(),
  });
}

export function useCreateContact() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: ContactInput) => api.contacts.create(data),
    onSuccess: () => {
      refresh();
      toast.success('联系人已创建');
    },
    onError: useNotifyError(),
  });
}

export function useUpdateContact() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContactInput> }) => api.contacts.update(id, data),
    onSuccess: () => {
      refresh();
      toast.success('联系人已更新');
    },
    onError: useNotifyError(),
  });
}

export function useDeleteContact() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => api.contacts.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('联系人已删除');
    },
    onError: useNotifyError(),
  });
}

export function useCreateCompany() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: CompanyInput) => api.companies.create(data),
    onSuccess: () => {
      refresh();
      toast.success('客户已创建');
    },
    onError: useNotifyError(),
  });
}

export function useUpdateCompany() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CompanyInput> }) => api.companies.update(id, data),
    onSuccess: () => {
      refresh();
      toast.success('客户已更新');
    },
    onError: useNotifyError(),
  });
}

export function useDeleteCompany() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => api.companies.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('客户已删除');
    },
    onError: useNotifyError(),
  });
}

export function useCreateLead() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: LeadInput) => api.leads.create(data),
    onSuccess: () => {
      refresh();
      toast.success('潜在客户已创建');
    },
    onError: useNotifyError(),
  });
}

export function useUpdateLead() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LeadInput> }) => api.leads.update(id, data),
    onSuccess: () => {
      refresh();
      toast.success('潜在客户已更新');
    },
    onError: useNotifyError(),
  });
}

export function useConvertLead() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => api.leads.convert(id),
    onSuccess: () => {
      refresh();
      toast.success('已转换为客户、联系人和商机');
    },
    onError: useNotifyError(),
  });
}

export function useDeleteLead() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => api.leads.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('潜在客户已删除');
    },
    onError: useNotifyError(),
  });
}

export function useCreateActivity() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: ActivityInput) => api.activities.create(data),
    onSuccess: () => {
      refresh();
      toast.success('活动已创建');
    },
    onError: useNotifyError(),
  });
}

export function useUpdateActivity() {
  const refresh = useRefresh();
  const onError = useNotifyError();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ActivityInput> }) => api.activities.update(id, data),
    onSuccess: () => refresh(),
    onError,
  });
}

export function useDeleteActivity() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => api.activities.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('活动已删除');
    },
    onError: useNotifyError(),
  });
}

export function useCreateNote() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: NoteInput) => api.notes.create(data),
    onSuccess: () => {
      refresh();
      toast.success('备注已添加');
    },
    onError: useNotifyError(),
  });
}

export function useUpdateNote() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NoteInput> }) => api.notes.update(id, data),
    onSuccess: () => {
      refresh();
      toast.success('备注已更新');
    },
    onError: useNotifyError(),
  });
}

export function useDeleteNote() {
  const refresh = useRefresh();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => api.notes.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('备注已删除');
    },
    onError: useNotifyError(),
  });
}

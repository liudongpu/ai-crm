import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { ActivityInput, CompanyInput, ContactInput, DealInput } from '@/types';

export const keys = {
  pipelines: ['pipelines'] as const,
  deals: ['deals'] as const,
  contacts: ['contacts'] as const,
  companies: ['companies'] as const,
  activities: ['activities'] as const,
  dashboard: ['dashboard'] as const,
};

function useRefresh() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

function notifyError(error: Error) {
  toast.error('操作失败', { description: error.message });
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

export function useContacts() {
  return useQuery({ queryKey: keys.contacts, queryFn: api.contacts.list });
}

export function useCompanies() {
  return useQuery({ queryKey: keys.companies, queryFn: api.companies.list });
}

export function useActivities(params?: { done?: boolean; limit?: number }) {
  return useQuery({
    queryKey: [...keys.activities, params?.done, params?.limit],
    queryFn: () => api.activities.list(params),
  });
}

export function useDashboard() {
  return useQuery({ queryKey: keys.dashboard, queryFn: api.dashboard.summary });
}

export function useCreateDeal() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (data: DealInput) => api.deals.create(data),
    onSuccess: () => {
      refresh();
      toast.success('交易已创建');
    },
    onError: notifyError,
  });
}

export function useUpdateDeal() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DealInput> }) => api.deals.update(id, data),
    onSuccess: () => {
      refresh();
      toast.success('交易已更新');
    },
    onError: notifyError,
  });
}

export function useMoveDeal() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, stageId, position }: { id: number; stageId: number; position?: number }) =>
      api.deals.move(id, stageId, position),
    onSuccess: () => {
      refresh();
    },
    onError: notifyError,
  });
}

export function useDeleteDeal() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: number) => api.deals.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('交易已删除');
    },
    onError: notifyError,
  });
}

export function useCreateContact() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (data: ContactInput) => api.contacts.create(data),
    onSuccess: () => {
      refresh();
      toast.success('联系人已创建');
    },
    onError: notifyError,
  });
}

export function useUpdateContact() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContactInput> }) => api.contacts.update(id, data),
    onSuccess: () => {
      refresh();
      toast.success('联系人已更新');
    },
    onError: notifyError,
  });
}

export function useDeleteContact() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: number) => api.contacts.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('联系人已删除');
    },
    onError: notifyError,
  });
}

export function useCreateCompany() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (data: CompanyInput) => api.companies.create(data),
    onSuccess: () => {
      refresh();
      toast.success('公司已创建');
    },
    onError: notifyError,
  });
}

export function useUpdateCompany() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CompanyInput> }) => api.companies.update(id, data),
    onSuccess: () => {
      refresh();
      toast.success('公司已更新');
    },
    onError: notifyError,
  });
}

export function useDeleteCompany() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: number) => api.companies.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('公司已删除');
    },
    onError: notifyError,
  });
}

export function useCreateActivity() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (data: ActivityInput) => api.activities.create(data),
    onSuccess: () => {
      refresh();
      toast.success('活动已创建');
    },
    onError: notifyError,
  });
}

export function useUpdateActivity() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ActivityInput> }) => api.activities.update(id, data),
    onSuccess: () => refresh(),
    onError: notifyError,
  });
}

export function useDeleteActivity() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: number) => api.activities.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('活动已删除');
    },
    onError: notifyError,
  });
}

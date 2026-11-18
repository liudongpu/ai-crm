import type {
  Activity,
  ActivityInput,
  Company,
  CompanyInput,
  Contact,
  ContactInput,
  DashboardSummary,
  Deal,
  DealInput,
  Lead,
  LeadInput,
  Note,
  NoteInput,
  Pipeline,
  ReportData,
  SearchResults,
} from '@/types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    let message = `请求失败 (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) message = Array.isArray(body.message) ? body.message.join('，') : body.message;
    } catch {
      // ignore invalid error body
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const body = <T>(value: T) => JSON.stringify(value);

export const api = {
  pipelines: {
    list: () => request<Pipeline[]>('/pipelines'),
  },
  deals: {
    list: (params: { search?: string; pipelineId?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.pipelineId) query.set('pipelineId', String(params.pipelineId));
      const suffix = query.size ? `?${query}` : '';
      return request<Deal[]>(`/deals${suffix}`);
    },
    get: (id: number) => request<Deal>(`/deals/${id}`),
    create: (data: DealInput) => request<Deal>('/deals', { method: 'POST', body: body(data) }),
    update: (id: number, data: Partial<DealInput>) =>
      request<Deal>(`/deals/${id}`, { method: 'PATCH', body: body(data) }),
    move: (id: number, stageId: number, position?: number) =>
      request<Deal>(`/deals/${id}/stage`, { method: 'PATCH', body: body({ stageId, position }) }),
    remove: (id: number) => request<{ id: number }>(`/deals/${id}`, { method: 'DELETE' }),
  },
  contacts: {
    list: () => request<Contact[]>('/contacts'),
    get: (id: number) => request<Contact>(`/contacts/${id}`),
    create: (data: ContactInput) => request<Contact>('/contacts', { method: 'POST', body: body(data) }),
    update: (id: number, data: Partial<ContactInput>) =>
      request<Contact>(`/contacts/${id}`, { method: 'PATCH', body: body(data) }),
    remove: (id: number) => request<{ id: number }>(`/contacts/${id}`, { method: 'DELETE' }),
  },
  companies: {
    list: () => request<Company[]>('/companies'),
    get: (id: number) => request<Company>(`/companies/${id}`),
    create: (data: CompanyInput) => request<Company>('/companies', { method: 'POST', body: body(data) }),
    update: (id: number, data: Partial<CompanyInput>) =>
      request<Company>(`/companies/${id}`, { method: 'PATCH', body: body(data) }),
    remove: (id: number) => request<{ id: number }>(`/companies/${id}`, { method: 'DELETE' }),
  },
  leads: {
    list: (params: { status?: string; search?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      const suffix = query.size ? `?${query}` : '';
      return request<Lead[]>(`/leads${suffix}`);
    },
    get: (id: number) => request<Lead>(`/leads/${id}`),
    create: (data: LeadInput) => request<Lead>('/leads', { method: 'POST', body: body(data) }),
    update: (id: number, data: Partial<LeadInput>) =>
      request<Lead>(`/leads/${id}`, { method: 'PATCH', body: body(data) }),
    convert: (id: number) =>
      request<{ lead: Lead; company: Company; contact: Contact; deal: Deal }>(`/leads/${id}/convert`, {
        method: 'POST',
      }),
    remove: (id: number) => request<{ id: number }>(`/leads/${id}`, { method: 'DELETE' }),
  },
  activities: {
    list: (params: { done?: boolean; limit?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.done !== undefined) query.set('done', String(params.done));
      if (params.limit) query.set('limit', String(params.limit));
      const suffix = query.size ? `?${query}` : '';
      return request<Activity[]>(`/activities${suffix}`);
    },
    get: (id: number) => request<Activity>(`/activities/${id}`),
    create: (data: ActivityInput) => request<Activity>('/activities', { method: 'POST', body: body(data) }),
    update: (id: number, data: Partial<ActivityInput>) =>
      request<Activity>(`/activities/${id}`, { method: 'PATCH', body: body(data) }),
    remove: (id: number) => request<{ id: number }>(`/activities/${id}`, { method: 'DELETE' }),
  },
  notes: {
    list: (params: { targetType?: string; targetId?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.targetType) query.set('targetType', params.targetType);
      if (params.targetId) query.set('targetId', String(params.targetId));
      const suffix = query.size ? `?${query}` : '';
      return request<Note[]>(`/notes${suffix}`);
    },
    create: (data: NoteInput) => request<Note>('/notes', { method: 'POST', body: body(data) }),
    update: (id: number, data: Partial<NoteInput>) =>
      request<Note>(`/notes/${id}`, { method: 'PATCH', body: body(data) }),
    remove: (id: number) => request<{ id: number }>(`/notes/${id}`, { method: 'DELETE' }),
  },
  search: (query: string) => request<SearchResults>(`/search?q=${encodeURIComponent(query)}`),
  reports: (days = 90) => request<ReportData>(`/dashboard/reports?days=${days}`),
  dashboard: {
    summary: () => request<DashboardSummary>('/dashboard/summary'),
  },
};

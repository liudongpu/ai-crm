export interface Company {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  owner: string;
  companyId: number | null;
  company: Company | null;
  createdAt: string;
  updatedAt: string;
}

export interface Stage {
  id: number;
  name: string;
  position: number;
  color: string;
  probability: number;
  pipelineId: number;
}

export interface Pipeline {
  id: number;
  name: string;
  stages: Stage[];
}

export interface Deal {
  id: number;
  title: string;
  value: number;
  currency: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'won' | 'lost';
  source: string | null;
  expectedCloseDate: string | null;
  position: number;
  pipelineId: number;
  stageId: number;
  contactId: number | null;
  companyId: number | null;
  stage: Stage;
  pipeline: Pipeline | null;
  contact: Contact | null;
  company: Company | null;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'deadline';

export interface Activity {
  id: number;
  type: ActivityType;
  subject: string;
  dueDate: string | null;
  done: boolean;
  notes: string | null;
  dealId: number | null;
  contactId: number | null;
  deal: Deal | null;
  contact: Contact | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  metrics: {
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    pipelineValue: number;
    wonValue: number;
    contacts: number;
    companies: number;
    activitiesDue: number;
    winRate: number;
  };
  dealsByStage: Array<{
    id: number;
    name: string;
    color: string;
    probability: number;
    count: number;
    value: number;
  }>;
  activitiesByType: Array<{ type: ActivityType; count: number }>;
  recentDeals: Deal[];
  upcomingActivities: Activity[];
}

export type DealInput = Partial<Pick<Deal,
  'title' | 'value' | 'currency' | 'priority' | 'status' | 'source' | 'expectedCloseDate' |
  'stageId' | 'pipelineId' | 'contactId' | 'companyId'
>> & { title: string; value: number };

export type ContactInput = Partial<Pick<Contact, 'name' | 'email' | 'phone' | 'position' | 'owner' | 'companyId'>> & { name: string };

export type CompanyInput = Partial<Pick<Company, 'name' | 'industry' | 'website' | 'phone' | 'address'>> & { name: string };

export type ActivityInput = {
  type: ActivityType;
  subject: string;
  dueDate?: string | null;
  done?: boolean;
  notes?: string;
  dealId?: number | null;
  contactId?: number | null;
};

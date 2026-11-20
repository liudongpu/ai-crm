import type { ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AssistantPage } from '@/pages/matters/AssistantPage';
import { BillingPage } from '@/pages/finance/BillingPage';
import { CalendarPage } from '@/pages/matters/CalendarPage';
import { ClientDetailPage } from '@/pages/acquire/ClientDetailPage';
import { ClientsPage } from '@/pages/acquire/ClientsPage';
import { CommunicationsPage } from '@/pages/communication/CommunicationsPage';
import { ContactDetailPage } from '@/pages/acquire/ContactDetailPage';
import { ContactsPage } from '@/pages/acquire/ContactsPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SchedulePage } from '@/pages/dashboard/SchedulePage';
import { WorkbenchPage } from '@/pages/dashboard/WorkbenchPage';
import { DeadlinesPage } from '@/pages/matters/DeadlinesPage';
import { DocumentsPage } from '@/pages/matters/DocumentsPage';
import { WorkspacePage } from '@/pages/workspace/WorkspacePage';
import { CaseAnalysisPage } from '@/pages/workspace/legal-ai/CaseAnalysisPage';
import { DraftPage } from '@/pages/workspace/legal-ai/DraftPage';
import { ContractReviewPage } from '@/pages/workspace/legal-ai/ContractReviewPage';
import { LegalResearchPage } from '@/pages/workspace/legal-ai/LegalResearchPage';
import { AdminAssistantPage } from '@/pages/workspace/legal-ai/AdminAssistantPage';
import { AiInsightPage } from '@/pages/workspace/legal-ai/AiInsightPage';
import { LitigationFeePage } from '@/pages/workspace/legal-toolbox/LitigationFeePage';
import { InterestPage } from '@/pages/workspace/legal-toolbox/InterestPage';
import { CompensationPage } from '@/pages/workspace/legal-toolbox/CompensationPage';
import { DeadlinePage } from '@/pages/workspace/legal-toolbox/DeadlinePage';
import { EvidencePage } from '@/pages/workspace/legal-toolbox/EvidencePage';
import { CompanyPage } from '@/pages/workspace/legal-toolbox/CompanyPage';
import { LeadDetailPage } from '@/pages/acquire/LeadDetailPage';
import { LeadsPage } from '@/pages/acquire/LeadsPage';
import { MatterDetailPage } from '@/pages/matters/MatterDetailPage';
import { MattersPage } from '@/pages/matters/MattersPage';
import { ReportsPage } from '@/pages/dashboard/ReportsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { StatutesPage } from '@/pages/matters/StatutesPage';
import { SyncPage } from '@/pages/matters/SyncPage';
import { TasksPage } from '@/pages/matters/TasksPage';
import { TimeLinkPage } from '@/pages/matters/TimeLinkPage';
import { TrustPage } from '@/pages/finance/TrustPage';

/**
 * 合并精简后，32 个二级功能使用各自独立的可扩展工作台页面。
 * 每个功能使用具体路由（非 :param 通配），并由后端功能定义驱动专属字段与状态。
 */
/** 法律 AI 六项能力全部使用独立专用页面，不再复用通用台账。 */
export const LEGAL_AI_ROUTES: Record<string, ComponentType> = {
  work_case_analysis: CaseAnalysisPage,
  work_drafting: DraftPage,
  work_doc_review: ContractReviewPage,
  work_legal_research: LegalResearchPage,
  report_ai_insight: AiInsightPage,
  auto_ai_comms: AdminAssistantPage,
};

/** 律师工具箱六项能力使用独立专用页面与独立 /tools 路由。 */
export const LEGAL_TOOLBOX_ROUTES: Array<{ path: string; component: ComponentType }> = [
  { path: '/tools/litigation-fee', component: LitigationFeePage },
  { path: '/tools/interest', component: InterestPage },
  { path: '/tools/compensation', component: CompensationPage },
  { path: '/tools/deadline', component: DeadlinePage },
  { path: '/tools/evidence', component: EvidencePage },
  { path: '/tools/company', component: CompanyPage },
];

const WORKSPACE_CODES = [
  'report_custom',
  'grow_conflict', 'grow_appointment', 'grow_engagement', 'comm_client_portal',
  'draft_esign',
  'billing_rates', 'billing_ar', 'payment_online', 'reconciliation', 'general_ledger',
  'security_auth', 'security_access', 'security_ai_policy', 'report_audit',
  'comm_phone_meeting', 'comm_auto_followup',
  'grow_marketing', 'manage_mobile_access', 'draft_word', 'auto_workflow', 'auto_task',
  'auto_billing', 'integration_email_calendar', 'integration_practice', 'integration_bank',
] as const;

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<WorkbenchPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/matters" element={<MattersPage />} />
        <Route path="/matters/:id" element={<MatterDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/:id" element={<ContactDetailPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/calendar/deadlines" element={<DeadlinesPage />} />
        <Route path="/calendar/statutes" element={<StatutesPage />} />
        <Route path="/calendar/assistant" element={<AssistantPage />} />
        <Route path="/calendar/sync" element={<SyncPage />} />
        <Route path="/calendar/time-link" element={<TimeLinkPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        {LEGAL_TOOLBOX_ROUTES.map(({ path, component: Page }) => (
          <Route key={path} path={path} element={<Page />} />
        ))}
        {Object.entries(LEGAL_AI_ROUTES).map(([code, Page]) => (
          <Route key={code} path={`/workspace/${code}`} element={<Page />} />
        ))}
        {WORKSPACE_CODES.map((code) => (
          <Route key={code} path={`/workspace/${code}`} element={<WorkspacePage code={code} />} />
        ))}
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/trust" element={<TrustPage />} />
        <Route path="/communications" element={<CommunicationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

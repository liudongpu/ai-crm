import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AssistantPage } from '@/pages/AssistantPage';
import { BillingPage } from '@/pages/BillingPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { ClientDetailPage } from '@/pages/ClientDetailPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { CommunicationsPage } from '@/pages/CommunicationsPage';
import { ContactDetailPage } from '@/pages/ContactDetailPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DeadlinesPage } from '@/pages/DeadlinesPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { LeadDetailPage } from '@/pages/LeadDetailPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { MatterDetailPage } from '@/pages/MatterDetailPage';
import { MattersPage } from '@/pages/MattersPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StatutesPage } from '@/pages/StatutesPage';
import { SyncPage } from '@/pages/SyncPage';
import { TasksPage } from '@/pages/TasksPage';
import { TimeLinkPage } from '@/pages/TimeLinkPage';
import { TrustPage } from '@/pages/TrustPage';

/**
 * 64 个二级功能已由通用记录页升级为各自独立的可扩展工作台页面。
 * 每个功能使用具体路由（非 :param 通配），并由后端功能定义驱动专属字段与状态。
 */
const WORKSPACE_CODES = [
  'grow_intake', 'grow_qualification', 'grow_conflict', 'grow_appointment', 'grow_engagement',
  'grow_marketing', 'grow_referral',
  'manage_custom_data', 'manage_workflow_template', 'manage_conflict_search',
  'manage_activity_timeline', 'manage_mobile_access',
  'draft_template', 'draft_court_form', 'draft_esign', 'draft_collaboration', 'draft_word',
  'comm_email_archive', 'comm_client_portal', 'comm_auto_followup', 'comm_phone_meeting',
  'comm_self_service',
  'billing_rates', 'billing_einvoice', 'billing_ar', 'billing_approval',
  'payment_online', 'payment_plan', 'reconciliation', 'general_ledger', 'financial_statements',
  'ap_expense', 'accountant_access',
  'work_case_analysis', 'work_legal_research', 'work_strategy', 'work_drafting',
  'work_doc_review', 'work_citation', 'work_permission',
  'report_custom', 'report_acquisition', 'report_financial', 'report_ai_insight', 'report_audit',
  'auto_workflow', 'auto_ai_ops', 'auto_ai_comms', 'auto_task', 'auto_billing', 'auto_marketing',
  'integration_email_calendar', 'integration_accounting', 'integration_docs', 'integration_comms',
  'integration_automation', 'integration_practice', 'integration_bank',
  'security_auth', 'security_compliance', 'security_ai_policy', 'security_access',
  'security_account', 'security_governance',
] as const;

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
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

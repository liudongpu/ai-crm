import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { OpportunitiesPage } from '@/pages/OpportunitiesPage';
import { ActivitiesPage } from '@/pages/ActivitiesPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AccountDetailPage } from '@/pages/details/AccountDetailPage';
import { ContactDetailPage } from '@/pages/details/ContactDetailPage';
import { LeadDetailPage } from '@/pages/details/LeadDetailPage';
import { OpportunityDetailPage } from '@/pages/details/OpportunityDetailPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/accounts/:id" element={<AccountDetailPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/:id" element={<ContactDetailPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

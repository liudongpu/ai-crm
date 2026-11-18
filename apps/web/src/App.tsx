import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { BillingPage } from '@/pages/BillingPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { ClientDetailPage } from '@/pages/ClientDetailPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { CommunicationsPage } from '@/pages/CommunicationsPage';
import { ContactDetailPage } from '@/pages/ContactDetailPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { LeadDetailPage } from '@/pages/LeadDetailPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { MatterDetailPage } from '@/pages/MatterDetailPage';
import { MattersPage } from '@/pages/MattersPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TrustPage } from '@/pages/TrustPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/matters" element={<MattersPage />} />
        <Route path="/matters/:id" element={<MatterDetailPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/:id" element={<ContactDetailPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
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

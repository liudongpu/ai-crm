import Box from '@mui/material/Box';
import { PageHeader } from '@/components/common/PageHeader';
import { SettingsWorkspacePanel } from './SettingsWorkspacePanel';

export function AuditTrailPage() {
  return (
    <Box>
      <PageHeader title="审计追溯" subtitle="关键操作日志与数据导出记录的本地留痕，支持追溯核查。" />
      <SettingsWorkspacePanel code="report_audit" />
    </Box>
  );
}

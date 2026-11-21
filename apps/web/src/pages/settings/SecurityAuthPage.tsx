import Box from '@mui/material/Box';
import { PageHeader } from '@/components/common/PageHeader';
import { SettingsWorkspacePanel } from './SettingsWorkspacePanel';

export function SecurityAuthPage() {
  return (
    <Box>
      <PageHeader title="安全与合规" subtitle="认证加密、合规框架、账户安全与数据治理的本地配置与记录。" />
      <SettingsWorkspacePanel code="security_auth" />
    </Box>
  );
}

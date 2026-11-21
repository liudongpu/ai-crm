import Box from '@mui/material/Box';
import { PageHeader } from '@/components/common/PageHeader';
import { SettingsWorkspacePanel } from './SettingsWorkspacePanel';

export function SecurityAccessPage() {
  return (
    <Box>
      <PageHeader title="访问控制" subtitle="角色权限与案件数据可见范围配置；案件团队决定案件与会话的可见范围。" />
      <SettingsWorkspacePanel code="security_access" />
    </Box>
  );
}

import Box from '@mui/material/Box';
import { PageHeader } from '@/components/common/PageHeader';
import { SettingsWorkspacePanel } from './SettingsWorkspacePanel';

export function AiPolicyPage() {
  return (
    <Box>
      <PageHeader title="AI数据政策" subtitle="AI 输入数据脱敏与客户信息禁止外传规则；所有 AI 输出均为需人工复核的草稿。" />
      <SettingsWorkspacePanel code="security_ai_policy" />
    </Box>
  );
}

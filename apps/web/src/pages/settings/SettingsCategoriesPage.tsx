import Box from '@mui/material/Box';
import { PageHeader } from '@/components/common/PageHeader';
import { MatterCategoriesPanel } from './MatterCategoriesPanel';

export function SettingsCategoriesPage() {
  return (
    <Box>
      <PageHeader
        title="案件类型"
        subtitle="维护案件类型及每类案件的阶段、停留时长与阶段任务流程；配置仅作用于之后新建的案件。"
      />
      <MatterCategoriesPanel />
    </Box>
  );
}

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useDeleteToolCalculation, useToolCalculations } from '@/hooks/useCrm';
import { useToast } from '@/components/common/ToastProvider';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/common/States';

/** 案件详情中展示一键保存的工具计算结果，按保存时间倒序。 */
export function ToolCalculationsPanel({ matterId }: { matterId: number }) {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useToolCalculations({ matterId });
  const remove = useDeleteToolCalculation();

  if (isLoading) return <LoadingPanel />;
  if (isError) return <ErrorState message="加载律师工具记录失败" onRetry={() => void refetch()} />;
  if (!data?.length) {
    return <EmptyState title="暂无律师工具记录" description="在「律师工具箱」完成测算后，点击「一键保存到当前案件」即可在此追溯。" />;
  }

  return (
    <Stack spacing={1.25}>
      <Typography variant="body2" color="text.secondary">
        共 {data.length} 条结构化记录。输入参数与结果快照按保存时状态留存，仅供追溯，不作为正式法律意见。
      </Typography>
      {data.map((record) => (
        <Accordion key={record.id} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ width: '100%', pr: 1 }}>
              <Chip size="small" label={record.toolName} color="primary" variant="outlined" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{record.title}</Typography>
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {new Date(record.createdAt).toLocaleString('zh-CN')}
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {record.summary && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {record.summary}
              </Typography>
            )}
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <Box>
                <Typography variant="caption" color="text.secondary">输入参数</Typography>
                <Box
                  component="pre"
                  sx={{ m: 0, mt: 0.5, p: 1.5, maxHeight: 260, overflow: 'auto', bgcolor: 'background.default', borderRadius: 1, fontSize: 12 }}
                >
                  {JSON.stringify(record.input, null, 2)}
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">结果快照</Typography>
                <Box
                  component="pre"
                  sx={{ m: 0, mt: 0.5, p: 1.5, maxHeight: 260, overflow: 'auto', bgcolor: 'background.default', borderRadius: 1, fontSize: 12 }}
                >
                  {JSON.stringify(record.result, null, 2)}
                </Box>
              </Box>
            </Box>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineOutlined />}
                onClick={() =>
                  remove.mutate(record.id, {
                    onSuccess: () => toast.success('已删除该工具记录'),
                  })
                }
                disabled={remove.isPending}
              >
                删除记录
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}

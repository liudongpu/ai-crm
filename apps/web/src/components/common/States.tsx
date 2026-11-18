import type { ReactNode } from 'react';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutline';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

export function LoadingRows({ count = 5, columns = 5 }: { count?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, row) => (
        <TableRow key={row}>
          <TableCell colSpan={columns}>
            <Skeleton variant="rounded" height={26} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function LoadingCards({ count = 4 }: { count?: number }) {
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={104} />
      ))}
    </Box>
  );
}

export function LoadingPanel({ height = 260 }: { height?: number }) {
  return <Skeleton variant="rounded" height={height} />;
}

export function EmptyState({
  title = '暂无数据',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Paper sx={{ borderStyle: 'dashed', textAlign: 'center', py: 6, px: 2 }}>
      <InboxOutlined sx={{ fontSize: 36, color: 'text.disabled' }} />
      <Typography variant="subtitle1" sx={{ mt: 1 }}>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      )}
      {action && <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>{action}</Stack>}
    </Paper>
  );
}

export function EmptyRow({ columns, text = '暂无符合条件的数据' }: { columns: number; text?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} align="center" sx={{ py: 5, color: 'text.secondary' }}>
        {text}
      </TableCell>
    </TableRow>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert
      severity="error"
      icon={<ErrorOutlineOutlined fontSize="small" />}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            重试
          </Button>
        ) : undefined
      }
      sx={{ mb: 2 }}
    >
      {message}
    </Alert>
  );
}

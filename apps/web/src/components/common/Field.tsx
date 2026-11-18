import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function Field({ label, children, span }: { label: string; children?: ReactNode; span?: number }) {
  return (
    <Box sx={{ gridColumn: span ? `span ${span}` : undefined, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
        {children ?? <Box component="span" color="text.disabled">—</Box>}
      </Typography>
    </Box>
  );
}

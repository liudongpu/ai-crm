import { createTheme } from '@mui/material/styles';

/** LexDesk visual language: restrained navy + brass, compact and document-like. */
export const NAVY = '#1b365d';
export const NAVY_DARK = '#142a49';
export const GOLD = '#b8860b';
export const CANVAS = '#f4f6f8';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: NAVY, dark: NAVY_DARK, light: '#e8edf4', contrastText: '#ffffff' },
    secondary: { main: GOLD, dark: '#8a6808', light: '#fbf4e2', contrastText: '#ffffff' },
    background: { default: CANVAS, paper: '#ffffff' },
    text: { primary: '#243247', secondary: '#64748b', disabled: '#a3adba' },
    divider: '#dfe4ea',
    success: { main: '#2f7a55', light: '#eaf5ef' },
    warning: { main: GOLD, light: '#fbf4e2' },
    error: { main: '#b4443c', light: '#fdf0ef' },
    info: { main: '#2c6b8f', light: '#edf4f8' },
  },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif",
    fontSize: 13,
    h1: { fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.2rem', fontWeight: 700 },
    h4: { fontSize: '1.05rem', fontWeight: 700 },
    h5: { fontSize: '1.25rem', fontWeight: 700 },
    h6: { fontSize: '0.95rem', fontWeight: 700 },
    subtitle1: { fontSize: '0.875rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem' },
    button: { fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 7 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          backgroundColor: CANVAS,
          scrollbarColor: '#c6ced8 transparent',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: 8, height: 8 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#c6ced8', borderRadius: 8 },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid #dfe4ea', borderRadius: 8, boxShadow: 'none' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 5, minWidth: 64, padding: '5px 13px' },
        sizeSmall: { padding: '3px 9px' },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 5 } },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#fff', fontSize: '0.8125rem' },
        notchedOutline: { borderColor: '#d7dde5' },
      },
    },
    MuiSelect: {
      styleOverrides: { select: { fontSize: '0.8125rem' } },
    },
    MuiInputLabel: {
      styleOverrides: { root: { fontSize: '0.8125rem' } },
    },
    MuiTableContainer: {
      styleOverrides: { root: { border: '1px solid #dfe4ea', borderRadius: 8, backgroundColor: '#fff' } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: '0.8125rem', padding: '9px 14px', borderBottomColor: '#e9edf2' },
        head: { backgroundColor: '#f8fafc', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { '&:last-child td': { borderBottom: 0 } } },
    },
    MuiChip: {
      styleOverrides: { root: { fontSize: '0.75rem', borderRadius: 4, height: 24 } },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '0.8125rem',
          fontWeight: 600,
          minHeight: 42,
          minWidth: 64,
          padding: '0 13px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: { root: { minHeight: 42 } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: '1.05rem', fontWeight: 700, padding: '18px 24px 8px' } },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: '8px 24px 16px' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '12px 24px 18px', gap: 8 } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 6, alignItems: 'center' } },
    },
  },
});

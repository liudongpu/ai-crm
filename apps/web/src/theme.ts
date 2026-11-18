import { createTheme } from '@mui/material/styles';

// Salesforce Lightning inspired palette: dark navy global bar, bright blue actions,
// neutral gray canvas and compact typography.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0176d3', dark: '#014486', light: '#e8f4ff', contrastText: '#ffffff' },
    secondary: { main: '#032d60', dark: '#021a3a', light: '#eef3fa', contrastText: '#ffffff' },
    background: { default: '#f3f3f3', paper: '#ffffff' },
    text: { primary: '#181818', secondary: '#706e6b', disabled: '#a8a8a8' },
    divider: '#e5e5e5',
    success: { main: '#2e844a', light: '#e7f5ec' },
    warning: { main: '#c75a00', light: '#fff3e0' },
    error: { main: '#ba0517', light: '#fdecef' },
    info: { main: '#0176d3', light: '#e8f4ff' },
  },
  typography: {
    fontFamily:
      "'Salesforce Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif",
    fontSize: 13,
    h1: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.15rem', fontWeight: 600 },
    h4: { fontSize: '1rem', fontWeight: 600 },
    h5: { fontSize: '1.25rem', fontWeight: 700 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    subtitle1: { fontSize: '0.875rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem' },
    button: { fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 6 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          backgroundColor: '#f3f3f3',
          scrollbarColor: '#c7c7c7 transparent',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: 8, height: 8 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#c7c7c7', borderRadius: 8 },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid #e5e5e5', borderRadius: 8 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 4, minWidth: 64, padding: '6px 14px' },
        sizeSmall: { padding: '4px 10px' },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 4 } },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#fff', fontSize: '0.8125rem' },
        notchedOutline: { borderColor: '#dddbd9' },
      },
    },
    MuiSelect: {
      styleOverrides: { select: { fontSize: '0.8125rem' } },
    },
    MuiInputLabel: {
      styleOverrides: { root: { fontSize: '0.8125rem' } },
    },
    MuiTableContainer: {
      styleOverrides: { root: { border: '1px solid #e5e5e5', borderRadius: 8, backgroundColor: '#fff' } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: '0.8125rem', padding: '10px 16px', borderBottomColor: '#ecebea' },
        head: { backgroundColor: '#f7f7f7', color: '#3e3e3c', fontWeight: 700, whiteSpace: 'nowrap' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:last-child td': { borderBottom: 0 } },
      },
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
          minHeight: 44,
          minWidth: 72,
          padding: '0 16px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: { root: { minHeight: 44 } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: '1.125rem', fontWeight: 700, padding: '20px 24px 8px' } },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: '8px 24px 16px' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '12px 24px 20px', gap: 8 } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 6, alignItems: 'center' } },
    },
  },
});

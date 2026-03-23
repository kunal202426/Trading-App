import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4361ee' },
    secondary: { main: '#FF6B35' },
    success: { main: '#16a34a' },
    error: { main: '#dc2626' },
    warning: { main: '#d97706' },
    background: {
      default: '#f5f7ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f1729',
      secondary: '#52637a',
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f5f7ff',
          color: '#0f1729',
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#0f1729',
          boxShadow: '0 2px 12px rgba(15,23,42,0.07)',
          border: '1px solid #e0e6f1',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#0f1729',
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#0f1729',
          boxShadow: '0 2px 12px rgba(15,23,42,0.07)',
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'inherit',
        }
      }
    }
  }
});

export default theme;

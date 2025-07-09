import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b',
      light: '#94a3b8',
      dark: '#475569',
      contrastText: '#ffffff',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    divider: '#404040',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#ffffff',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#ffffff',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#ffffff',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#ffffff',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: '#ffffff',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#ffffff',
    },
    body1: {
      fontSize: '1rem',
      color: '#ffffff',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#cccccc',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          },
        },
        outlined: {
          borderColor: '#8b5cf6',
          color: '#8b5cf6',
          '&:hover': {
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#2d2d2d',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
          border: '1px solid #404040',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#1a1a1a',
            '& fieldset': {
              borderColor: '#404040',
            },
            '&:hover fieldset': {
              borderColor: '#8b5cf6',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#8b5cf6',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#cccccc',
            '&.Mui-focused': {
              color: '#8b5cf6',
            },
          },
          '& .MuiOutlinedInput-input': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: '#404040',
          height: 8,
        },
        bar: {
          borderRadius: 4,
          background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardError: {
          backgroundColor: '#2d1b1b',
          color: '#ffffff',
          '& .MuiAlert-icon': {
            color: '#ef4444',
          },
        },
        standardSuccess: {
          backgroundColor: '#1b2d1b',
          color: '#ffffff',
          '& .MuiAlert-icon': {
            color: '#10b981',
          },
        },
        standardInfo: {
          backgroundColor: '#1b1d2d',
          color: '#ffffff',
          '& .MuiAlert-icon': {
            color: '#3b82f6',
          },
        },
        standardWarning: {
          backgroundColor: '#2d251b',
          color: '#ffffff',
          '& .MuiAlert-icon': {
            color: '#f59e0b',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        filled: {
          backgroundColor: '#404040',
          color: '#ffffff',
          '&.MuiChip-colorPrimary': {
            backgroundColor: '#8b5cf6',
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: '#10b981',
          },
          '&.MuiChip-colorError': {
            backgroundColor: '#ef4444',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#cccccc',
          '&:hover': {
            color: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#404040',
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
      },
    },
  },
});
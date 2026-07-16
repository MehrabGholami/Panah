import { createTheme } from '@mui/material/styles';
import { darkColors } from './tokens/colors';
import { typography } from './tokens/typography';
import { MuiButton } from './components/MuiButton';
import { MuiCard } from './components/MuiCard';
import { MuiAppBar } from './components/MuiAppBar';

export const darkTheme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'dark',
    ...darkColors,
  },
  typography,
  shape: { borderRadius: 12 },
  components: {
    MuiButton,
    MuiCard,
    MuiAppBar,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: darkColors.background.default,
          scrollbarColor: '#334155 transparent',
        },
        '*:focus-visible': {
          outline: '2px solid #22D3EE',
          outlineOffset: 2,
        },
      },
    },
  },
});

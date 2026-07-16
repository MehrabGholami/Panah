import { createTheme } from '@mui/material/styles';
import { lightColors } from './tokens/colors';
import { typography } from './tokens/typography';
import { MuiButton } from './components/MuiButton';
import { MuiCard } from './components/MuiCard';
import { MuiAppBar } from './components/MuiAppBar';

export const lightTheme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    ...lightColors,
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
          backgroundColor: lightColors.background.default,
        },
      },
    },
  },
});

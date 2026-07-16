import { useMemo, type ReactNode } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { useAppSelector } from '@/app/store';
import { darkTheme, lightTheme } from './index';

const createRtlCache = () =>
  createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  });

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const mode = useAppSelector((state) => state.uiPreferences.themeMode);
  const cache = useMemo(() => createRtlCache(), []);

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <CacheProvider value={cache}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </CacheProvider>
  );
}

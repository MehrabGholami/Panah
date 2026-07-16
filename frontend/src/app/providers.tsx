import { useEffect, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { store, useAppDispatch } from './store';
import { fetchMe, setAuthInitialized } from './slices/authSlice';
import { getStoredTokens } from '@/shared/api/axios';
import { queryClient } from '@/shared/api/queryClient';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { JalaliDateLocalizationProvider } from '@/shared/components/ui';
import '@/i18n';

function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const tokens = getStoredTokens();
    if (tokens?.access) {
      void dispatch(fetchMe());
    } else {
      dispatch(setAuthInitialized());
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <JalaliDateLocalizationProvider>
            <BrowserRouter>
              <AuthInitializer>{children}</AuthInitializer>
            </BrowserRouter>
          </JalaliDateLocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalaliV3';
import { faIR as pickersFaIR } from '@mui/x-date-pickers/locales';
import { faIR as dateFnsJalaliFaIR } from 'date-fns-jalali/locale/fa-IR';
import type { ReactNode } from 'react';

interface JalaliDateLocalizationProviderProps {
  children: ReactNode;
}

export function JalaliDateLocalizationProvider({ children }: JalaliDateLocalizationProviderProps) {
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFnsJalali}
      adapterLocale={dateFnsJalaliFaIR}
      localeText={pickersFaIR.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      {children}
    </LocalizationProvider>
  );
}

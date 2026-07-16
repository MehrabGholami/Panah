import type { Components, Theme } from '@mui/material/styles';
import { shadows } from '../tokens/shadows';

export const MuiCard: Components<Theme>['MuiCard'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 16,
      backgroundImage: 'none',
      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'}`,
      boxShadow: shadows.card,
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      '&:hover': {
        boxShadow: shadows.cardHover,
      },
    }),
  },
};

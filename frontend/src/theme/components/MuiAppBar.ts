import type { Components, Theme } from '@mui/material/styles';

export const MuiAppBar: Components<Theme>['MuiAppBar'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundImage: 'none',
      backdropFilter: 'blur(12px)',
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(18, 24, 42, 0.72)' : 'rgba(255, 255, 255, 0.82)',
      borderBottom: `1px solid ${
        theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'
      }`,
      boxShadow: 'none',
    }),
  },
};

import type { Components, Theme } from '@mui/material/styles';
import { gradients } from '../tokens/gradients';
import { shadows } from '../tokens/shadows';

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    gradient: true;
    ghost: true;
  }
}

export const MuiButton: Components<Theme>['MuiButton'] = {
  styleOverrides: {
    root: {
      borderRadius: 12,
      padding: '10px 24px',
      fontWeight: 600,
      boxShadow: 'none',
      '&:focus-visible': {
        outline: '2px solid #22D3EE',
        outlineOffset: 2,
      },
    },
    contained: {
      '&:hover': {
        boxShadow: shadows.glowCyan,
      },
    },
  },
  variants: [
    {
      props: { variant: 'gradient' },
      style: {
        background: gradients.primary,
        color: '#0B0F1A',
        '&:hover': {
          background: gradients.primaryHover,
          boxShadow: shadows.glowCyan,
        },
        '&.Mui-disabled': {
          background: 'rgba(148, 163, 184, 0.2)',
          color: 'rgba(148, 163, 184, 0.5)',
        },
      },
    },
    {
      props: { variant: 'ghost' },
      style: {
        background: 'transparent',
        color: '#94A3B8',
        '&:hover': {
          background: 'rgba(18, 24, 42, 0.6)',
        },
      },
    },
  ],
};

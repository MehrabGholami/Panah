export const darkColors = {
  background: {
    default: '#0B0F1A',
    paper: '#12182A',
    elevated: '#1A2238',
  },
  primary: {
    main: '#22D3EE',
    light: '#67E8F9',
    dark: '#0891B2',
    contrastText: '#0B0F1A',
  },
  secondary: {
    main: '#818CF8',
    light: '#A5B4FC',
    dark: '#6366F1',
    contrastText: '#F8FAFC',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    disabled: '#64748B',
  },
  success: { main: '#34D399' },
  warning: { main: '#FBBF24' },
  error: { main: '#F87171' },
  info: { main: '#38BDF8' },
  divider: 'rgba(148, 163, 184, 0.12)',
  glow: {
    cyan: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)',
    purple: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)',
  },
  glass: {
    appBar: 'rgba(18, 24, 42, 0.72)',
    border: 'rgba(148, 163, 184, 0.1)',
  },
} as const;

export const lightColors = {
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
    elevated: '#F1F5F9',
  },
  primary: {
    main: '#0891B2',
    light: '#22D3EE',
    dark: '#0E7490',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
    contrastText: '#FFFFFF',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    disabled: '#94A3B8',
  },
  success: { main: '#10B981' },
  warning: { main: '#F59E0B' },
  error: { main: '#EF4444' },
  info: { main: '#0EA5E9' },
  divider: 'rgba(15, 23, 42, 0.08)',
  glow: {
    cyan: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
    purple: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)',
  },
  glass: {
    appBar: 'rgba(255, 255, 255, 0.82)',
    border: 'rgba(15, 23, 42, 0.08)',
  },
} as const;

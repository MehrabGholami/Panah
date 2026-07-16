import { Box, Button, Stack, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AppLogo } from './AppLogo';
import { GlassAppBar } from './GlassAppBar';
import { ThemeToggle } from './ThemeToggle';

export function PublicSiteHeader() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const location = useLocation();
  const isDark = theme.palette.mode === 'dark';
  const isAbout = location.pathname === '/about';

  const navButtonSx = (active: boolean) => ({
    borderRadius: 2,
    px: 1.75,
    py: 0.65,
    minWidth: 0,
    fontWeight: 700,
    fontSize: '0.84rem',
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    bgcolor: active
      ? isDark
        ? 'rgba(34, 211, 238, 0.14)'
        : 'rgba(34, 211, 238, 0.1)'
      : isDark
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(255, 255, 255, 0.55)',
    border: `1px solid ${
      active
        ? isDark
          ? 'rgba(34, 211, 238, 0.4)'
          : 'rgba(34, 211, 238, 0.35)'
        : isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(15, 23, 42, 0.08)'
    }`,
    backdropFilter: 'blur(10px)',
    boxShadow: active
      ? isDark
        ? '0 8px 24px rgba(34, 211, 238, 0.12)'
        : '0 8px 20px rgba(34, 211, 238, 0.1)'
      : 'none',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: active
        ? isDark
          ? 'rgba(34, 211, 238, 0.18)'
          : 'rgba(34, 211, 238, 0.14)'
        : isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.78)',
      borderColor: isDark ? 'rgba(34, 211, 238, 0.35)' : 'rgba(34, 211, 238, 0.28)',
      transform: 'translateY(-1px)',
    },
  });

  return (
    <GlassAppBar
      position="static"
      sx={{
        bgcolor: isDark ? 'rgba(8, 18, 38, 0.28)' : 'rgba(255, 255, 255, 0.68)',
        backdropFilter: 'blur(16px)',
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : `1px solid ${theme.palette.divider}`,
        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.18)' : '0 10px 36px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={{ xs: 1, sm: 1.25 }}
        sx={{
          py: 0.25,
          px: { xs: 0.25, sm: 0.5 },
          borderRadius: 2.5,
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.35)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
        }}
      >
        <AppLogo to="/" />
        <Box
          sx={{
            width: '1px',
            alignSelf: 'stretch',
            my: 0.75,
            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)',
            display: { xs: 'none', sm: 'block' },
          }}
        />
        <Button component={RouterLink} to="/about" sx={navButtonSx(isAbout)}>
          {t('nav.about')}
        </Button>
      </Stack>

      <Box sx={{ flex: 1 }} />

      <Box
        sx={{
          p: 0.35,
          borderRadius: 2,
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
        }}
      >
        <ThemeToggle />
      </Box>
    </GlassAppBar>
  );
}

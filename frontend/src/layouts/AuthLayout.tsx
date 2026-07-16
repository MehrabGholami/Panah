import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Container, IconButton, Stack, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppLogo,
  GhostButton,
  GlassAppBar,
  GlassCard,
  GlowBackground,
  ThemeToggle,
} from '@/shared/components/ui';

export function AuthLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const theme = useTheme();

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <GlowBackground>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <GlassAppBar
          position="static"
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(8, 18, 38, 0.18)' : 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(18px)',
            borderBottom:
              theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : `1px solid ${theme.palette.divider}`,
          }}
        >
          <AppLogo to="/" />
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1} alignItems="center">
            <ThemeToggle />
            <GhostButton
              onClick={handleBackHome}
                startIcon={<ArrowBackIcon fontSize="small" />}
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  background: theme.palette.error.main,
                  backgroundColor: theme.palette.error.main,
                  color: theme.palette.common.white,
                  border: '1px solid rgba(255,255,255,0.35)',
                  px: 1.5,
                  '&:hover': {
                    background: theme.palette.error.dark,
                    backgroundColor: theme.palette.error.dark,
                  },
                }}
            >
              {t('backToHome')}
            </GhostButton>
          </Stack>
        </GlassAppBar>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            minHeight: 0,
            overflow: 'hidden',
            px: 2,
            py: { xs: 0.75, md: 1.5 },
          }}
        >
          <Container maxWidth="md" disableGutters>
            <GlassCard
              sx={{
                position: 'relative',
                overflow: 'visible',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 28px 90px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
                    : '0 24px 64px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
                backdropFilter: 'blur(20px)',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(18, 24, 42, 0.88)'
                    : 'rgba(255, 255, 255, 0.94)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  padding: '1px',
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.35), rgba(129, 140, 248, 0.25))',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                },
              }}
            >
              <IconButton
                onClick={handleBackHome}
                aria-label={t('close')}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  zIndex: 2,
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: theme.palette.error.main,
                    color: theme.palette.common.white,
                    border: '1px solid',
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                    boxShadow: '0 10px 24px rgba(239, 68, 68, 0.35)',
                  '&:hover': {
                      bgcolor: theme.palette.error.dark,
                      transform: 'translateY(-1px)',
                      boxShadow: '0 14px 34px rgba(239, 68, 68, 0.45)',
                  },
                }}
              >
                  <ArrowBackIcon fontSize="small" />
              </IconButton>

                <Box
                  sx={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    p: { xs: 2, md: 2.5 },
                    pt: { xs: 2.25, md: 3 },
                  }}
                >
                <Outlet />
              </Box>
            </GlassCard>
          </Container>
        </Box>

        {/* Company credit removed per request */}
      </Box>
    </GlowBackground>
  );
}

import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CrisisAlertOutlinedIcon from '@mui/icons-material/CrisisAlertOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { Box, Button, Container, Stack, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { GlassCard, GradientButton, PublicSiteHeader } from '@/shared/components/ui';

const homeHeroSrc = '/home-hero.png';

const PILLARS = [
  { key: 'mission', icon: ShieldOutlinedIcon, color: '#22D3EE' },
  { key: 'community', icon: GroupsOutlinedIcon, color: '#818CF8' },
  { key: 'trust', icon: HandshakeOutlinedIcon, color: '#34D399' },
  { key: 'coordination', icon: CrisisAlertOutlinedIcon, color: '#F59E0B' },
] as const;

const pillarCardSx = (isDark: boolean) => ({
  p: 2.5,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 3,
  border: 1,
  borderColor: 'divider',
  background: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.82)',
  backdropFilter: 'blur(14px)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 18px 40px rgba(34, 211, 238, 0.12)',
  },
});

export default function AboutPage() {
  const { t } = useTranslation('about');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
        bgcolor: theme.palette.background.default,
      }}
    >
      <Box
        component="img"
        src={homeHeroSrc}
        alt=""
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          background: isDark
            ? 'linear-gradient(180deg, rgba(8,18,38,0.82) 0%, rgba(8,18,38,0.55) 40%, rgba(8,18,38,0.9) 100%)'
            : 'linear-gradient(180deg, rgba(248,250,252,0.88) 0%, rgba(248,250,252,0.72) 42%, rgba(241,245,249,0.95) 100%)',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <PublicSiteHeader />

        <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
          <Stack spacing={{ xs: 3, md: 4 }} sx={{ width: '100%' }}>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.5,
                  mb: 2,
                  borderRadius: 999,
                  bgcolor: isDark ? 'rgba(34, 211, 238, 0.12)' : 'rgba(34, 211, 238, 0.1)',
                  border: '1px solid rgba(34, 211, 238, 0.28)',
                }}
              >
                <AutoAwesomeOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {t('badge')}
                </Typography>
              </Box>

              <Typography
                variant="h3"
                fontWeight={900}
                sx={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: { xs: '2rem', md: '2.75rem' },
                  mb: 1.5,
                  background: isDark
                    ? 'linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 100%)'
                    : 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('title')}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  width: '100%',
                  maxWidth: 760,
                  mx: 'auto',
                  textAlign: 'center',
                  lineHeight: 1.9,
                  px: { xs: 0.5, md: 0 },
                }}
              >
                {t('subtitle')}
              </Typography>
            </Box>

            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: { xs: 2.5, md: 3 } }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: '20px',
                  alignItems: 'stretch',
                }}
              >
                {PILLARS.map(({ key, icon: Icon, color }) => (
                  <GlassCard key={key} sx={pillarCardSx(isDark)}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        mb: 1.5,
                        bgcolor: `${color}18`,
                        color,
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                      {t(`pillars.${key}.title`)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.85, flex: 1 }}>
                      {t(`pillars.${key}.description`)}
                    </Typography>
                  </GlassCard>
                ))}
              </Box>

              <GlassCard
                sx={{
                  width: '100%',
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: 3,
                  border: 1,
                  borderColor: 'divider',
                  textAlign: 'center',
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(34,211,238,0.1) 0%, rgba(129,140,248,0.12) 100%)'
                    : 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(129,140,248,0.06) 100%)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1.25 }}>
                  {t('placeholder.title')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.9, maxWidth: 640, mx: 'auto', mb: 2.5 }}
                >
                  {t('placeholder.description')}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
                  <GradientButton component={RouterLink} to="/register" sx={{ px: 3, minWidth: 160 }}>
                    {t('cta.register')}
                  </GradientButton>
                  <Button component={RouterLink} to="/" variant="outlined" sx={{ borderRadius: 2, minWidth: 160 }}>
                    {t('cta.home')}
                  </Button>
                </Stack>
              </GlassCard>
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

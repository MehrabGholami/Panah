import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { Box, Divider, Stack, Typography, useTheme } from '@mui/material';
import { format } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale/fa-IR';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { toPersianDigits } from '@/shared/utils/persianDigits';
import { AnalogClock } from './AnalogClock';

const fadeUp = {
  animation: 'panahFadeUp 0.7s ease-out both',
  '@keyframes panahFadeUp': {
    from: { opacity: 0, transform: 'translateY(18px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
} as const;

const sidePanelShellSx = {
  width: { xs: '100%', sm: 'auto' },
  maxWidth: { xs: 320, sm: 300 },
} as const;

const sidePanelCardSx = (isDark: boolean, cardBorder: string, cardBg: string) => ({
  p: { xs: 2, sm: 2.5 },
  borderRadius: 3,
  minWidth: { xs: 240, sm: 272, md: 300 },
  bgcolor: cardBg,
  border: `1px solid ${cardBorder}`,
  boxShadow: isDark ? '0 20px 50px rgba(0, 0, 0, 0.4)' : '0 20px 50px rgba(15, 23, 42, 0.12)',
  position: 'relative',
});

function useLiveJalaliDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    now,
    day: toPersianDigits(format(now, 'd', { locale: faIR })),
    month: format(now, 'MMMM', { locale: faIR }),
    year: toPersianDigits(format(now, 'yyyy', { locale: faIR })),
    weekday: format(now, 'EEEE', { locale: faIR }),
    dateLine: `${format(now, 'EEEE', { locale: faIR })} - ${toPersianDigits(format(now, 'd', { locale: faIR }))} ${format(now, 'MMMM', { locale: faIR })} ${toPersianDigits(format(now, 'yyyy', { locale: faIR }))}`,
  };
}

export function LandingAuthPanel() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const cardBg = isDark ? 'rgba(10, 20, 42, 0.94)' : 'rgba(248, 250, 252, 0.88)';
  const cardBorder = isDark ? 'rgba(148, 163, 184, 0.22)' : theme.palette.divider;
  const primaryBg = theme.palette.primary.dark; // dark theme: #0891B2, light theme: #0E7490
  const primaryHover = theme.palette.primary.main; // dark: #22D3EE, light: #0891B2
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const loginBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)';
  const loginBorder = isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(15, 23, 42, 0.12)';
  const loginHoverBg = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.10)';

  return (
    <Box
      sx={{
        ...fadeUp,
        animationDelay: '0.15s',
        ...sidePanelShellSx,
      }}
    >
      <Box sx={sidePanelCardSx(isDark, cardBorder, cardBg)}>
        <Typography
          variant="subtitle2"
          sx={{
            color: textPrimary,
            fontWeight: 700,
            display: 'block',
            mb: 2,
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        >
          {t('landing.getStarted')}
        </Typography>

        <Stack spacing={1.75}>
          <Box>
            <Box
              component={RouterLink}
              to="/register"
              sx={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                py: 1.35,
                px: 2,
                borderRadius: 2,
                bgcolor: primaryBg,
                color: theme.palette.primary.contrastText,
                fontWeight: 700,
                fontSize: '0.95rem',
                border: isDark ? '1px solid rgba(34, 211, 238, 0.45)' : `1px solid rgba(8, 145, 178, 0.25)`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: primaryHover,
                  borderColor: isDark ? 'rgba(103, 232, 249, 0.7)' : 'rgba(34, 211, 238, 0.6)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(8, 145, 178, 0.35)',
                },
              }}
            >
              <PersonAddAltOutlinedIcon sx={{ fontSize: 22 }} />
              {t('landing.cta')}
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: textSecondary,
                mt: 0.85,
                display: 'block',
                lineHeight: 1.55,
                textAlign: 'center',
              }}
            >
              {t('landing.registerDesc')}
            </Typography>
          </Box>

          <Divider sx={{ borderColor: cardBorder }} />

          <Box>
            <Box
              component={RouterLink}
              to="/login"
              sx={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                py: 1.35,
                px: 2,
                borderRadius: 2,
                bgcolor: loginBg,
                color: textPrimary,
                fontWeight: 700,
                fontSize: '0.95rem',
                border: `1px solid ${loginBorder}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: loginHoverBg,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.18)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <LoginOutlinedIcon sx={{ fontSize: 22, color: theme.palette.primary.light }} />
              {t('landing.loginCta')}
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: textSecondary,
                mt: 0.85,
                display: 'block',
                lineHeight: 1.55,
                textAlign: 'center',
              }}
            >
              {t('landing.loginDesc')}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export function LandingDateTimePanel() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { now, dateLine } = useLiveJalaliDateTime();

  const cardBg = isDark ? 'rgba(10, 20, 42, 0.94)' : 'rgba(248, 250, 252, 0.88)';
  const cardBorder = isDark ? 'rgba(148, 163, 184, 0.22)' : theme.palette.divider;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const accentBg = isDark ? 'rgba(34, 211, 238, 0.1)' : 'rgba(34, 211, 238, 0.08)';
  const accentBorder = isDark ? 'rgba(34, 211, 238, 0.35)' : 'rgba(8, 145, 178, 0.2)';

  return (
    <Box
      sx={{
        ...fadeUp,
        animationDelay: '0.1s',
        ...sidePanelShellSx,
      }}
    >
      <Box sx={sidePanelCardSx(isDark, cardBorder, cardBg)}>
        <Stack spacing={1.75}>
          <Box>
            <Box
              sx={{
                py: 0.75,
                px: 0.75,
                borderRadius: 2,
                bgcolor: accentBg,
                border: `1px solid ${accentBorder}`,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <AnalogClock date={now} size={148} />
            </Box>
          </Box>

          <Divider sx={{ borderColor: cardBorder, my: 0.3 }} />

          <Box>
            <Box
              sx={{
                py: 0.8,
                px: 1.25,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(129, 140, 248, 0.06)',
                border: `1px solid ${accentBorder}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: textPrimary,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {dateLine}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export function LandingVersePanel() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const cardBg = isDark ? 'rgba(10, 20, 42, 0.82)' : 'rgba(248, 250, 252, 0.82)';
  const cardBorder = isDark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(15, 23, 42, 0.12)';

  return (
    <Box
      sx={{
        ...fadeUp,
        animationDelay: '0.25s',
        width: { xs: '100%', md: 'auto' },
        maxWidth: { xs: '100%', sm: 560, md: 720, lg: 860 },
        minWidth: { md: 640, lg: 760 },
        display: 'block',
      }}
    >
      <Box
        sx={{
          p: { sm: 2.25, md: 2.75 },
          borderRadius: 3,
          bgcolor: cardBg,
          border: `1px solid ${cardBorder}`,
          backdropFilter: 'blur(16px)',
          boxShadow: isDark
            ? '0 20px 50px rgba(0, 0, 0, 0.35)'
            : '0 20px 50px rgba(15, 23, 42, 0.10)',
        }}
      >
        <Typography
          component="p"
          dir="rtl"
          lang="ar"
          sx={{
            fontFamily: '"Amiri Quran", "Amiri", serif',
            fontSize: { xs: '1.4rem', sm: '1.65rem', md: '1.9rem', lg: '2.05rem' },
            lineHeight: { xs: 2.15, md: 1.9 },
            textAlign: 'center',
            color: isDark ? '#F8FAFC' : '#0F172A',
            mb: 2,
            letterSpacing: '0.01em',
            whiteSpace: { xs: 'normal', md: 'nowrap' },
          }}
        >
          {t('landing.verse.arabic')}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            lineHeight: 1.9,
            textAlign: 'center',
            mb: 1.5,
            fontSize: { xs: '0.98rem', sm: '1.05rem', md: '1.12rem' },
          }}
        >
          {t('landing.verse.translation')}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: theme.palette.primary.main,
            fontWeight: 700,
            fontSize: '0.95rem',
            letterSpacing: '0.02em',
          }}
        >
          {t('landing.verse.reference')}
        </Typography>
      </Box>
    </Box>
  );
}

export function LandingHeroSection() {
  const { t } = useTranslation('common');

  const highlights = [
    { icon: <AccessTimeOutlinedIcon fontSize="small" />, label: t('landing.features.missions') },
    { icon: <ShieldOutlinedIcon fontSize="small" />, label: t('landing.features.approval') },
  ];

  const features = [
    t('landing.features.free'),
    t('landing.features.approval'),
    t('landing.features.missions'),
    t('landing.features.reports'),
  ];

  return (
    <Box
      sx={{
        ...fadeUp,
        display: { xs: 'none', md: 'block' },
        maxWidth: 460,
        width: '100%',
      }}
    >
      <Box
        sx={{
          p: { xs: 2.5, sm: 3, md: 3.5 },
          borderRadius: 4,
          background: 'linear-gradient(160deg, rgba(8, 18, 38, 0.88) 0%, rgba(12, 24, 52, 0.72) 100%)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 28px 72px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            px: 1.75,
            py: 0.5,
            mb: 2,
            borderRadius: 999,
            border: '1px solid rgba(34, 211, 238, 0.35)',
            bgcolor: 'rgba(34, 211, 238, 0.08)',
          }}
        >
          <Typography variant="caption" sx={{ color: '#67E8F9', fontWeight: 600 }}>
            {t('landing.badge')}
          </Typography>
        </Box>

        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.75rem', sm: '3.5rem', md: '4rem' },
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            mb: 1,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
          }}
        >
          {t('landing.title')}
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: 'rgba(34, 211, 238, 0.95)',
            fontWeight: 600,
            fontSize: { xs: '0.95rem', md: '1.1rem' },
            mb: 1.5,
            lineHeight: 1.5,
          }}
        >
          {t('landing.subtitle')}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'rgba(226, 232, 240, 0.88)',
            lineHeight: 1.85,
            mb: 2.5,
            fontSize: { xs: '0.85rem', md: '0.92rem' },
          }}
        >
          {t('landing.heroLead')}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {highlights.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.75,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'rgba(226, 232, 240, 0.92)',
              }}
            >
              <Box sx={{ color: '#22D3EE', display: 'flex' }}>{item.icon}</Box>
              <Typography variant="caption" fontWeight={600}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Typography
          variant="caption"
          sx={{
            color: 'rgba(148, 163, 184, 0.9)',
            fontWeight: 600,
            display: 'block',
            mb: 1,
            textAlign: 'center',
          }}
        >
          {t('landing.featuresTitle')}
        </Typography>

        <Stack spacing={0.75} alignItems="center">
          {features.map((item) => (
            <Box
              key={item}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'center',
                '&::before': {
                  content: '""',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#22D3EE',
                  boxShadow: '0 0 8px rgba(34,211,238,0.6)',
                  flexShrink: 0,
                },
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(203, 213, 225, 0.9)', lineHeight: 1.6 }}>
                {item}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

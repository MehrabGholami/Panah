import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

const fadeUp = {
  animation: 'panahFadeUp 0.75s cubic-bezier(0.22, 1, 0.36, 1) both',
  '@keyframes panahFadeUp': {
    from: { opacity: 0, transform: 'translateY(22px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
} as const;

const sidePanelShellSx = {
  width: { xs: '100%', sm: 'auto' },
  maxWidth: { xs: 320, sm: 300 },
  display: 'flex',
} as const;

function useLandingGlass() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return {
    theme,
    isDark,
    cardBg: isDark ? 'rgba(10, 20, 42, 0.72)' : 'rgba(248, 250, 252, 0.78)',
    cardBorder: isDark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(15, 23, 42, 0.12)',
    textPrimary: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    primaryBg: theme.palette.primary.dark,
    primaryHover: theme.palette.primary.main,
    glassShadow: isDark
      ? '0 24px 56px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)'
      : '0 24px 56px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.75)',
  };
}

function GlassCardShell({
  children,
  delay = '0s',
  accent = 'cyan',
}: {
  children: ReactNode;
  delay?: string;
  accent?: 'cyan' | 'indigo';
}) {
  const { isDark, cardBg, cardBorder, glassShadow } = useLandingGlass();
  const glow =
    accent === 'indigo'
      ? isDark
        ? 'radial-gradient(circle at 18% 12%, rgba(129,140,248,0.28) 0%, transparent 55%)'
        : 'radial-gradient(circle at 18% 12%, rgba(99,102,241,0.16) 0%, transparent 55%)'
      : isDark
        ? 'radial-gradient(circle at 82% 8%, rgba(34,211,238,0.28) 0%, transparent 55%)'
        : 'radial-gradient(circle at 82% 8%, rgba(34,211,238,0.18) 0%, transparent 55%)';

  return (
    <Box sx={{ ...fadeUp, animationDelay: delay, ...sidePanelShellSx }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 1.75, sm: 2 },
          borderRadius: 3,
          width: '100%',
          minWidth: { xs: 240, sm: 268, md: 280 },
          display: 'flex',
          flexDirection: 'column',
          bgcolor: cardBg,
          border: `1px solid ${cardBorder}`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: glassShadow,
        }}
      >
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, background: glow, pointerEvents: 'none' }} />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -40,
            insetInlineEnd: -36,
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(34,211,238,0.22) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(8,145,178,0.16) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

const panelIconSx = (isDark: boolean, tone: 'cyan' | 'indigo') => ({
  width: 42,
  height: 42,
  flexShrink: 0,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  ...(tone === 'cyan'
    ? {
        bgcolor: isDark ? 'rgba(34, 211, 238, 0.14)' : 'rgba(8, 145, 178, 0.1)',
        border: '1px solid',
        borderColor: isDark ? 'rgba(34, 211, 238, 0.4)' : 'rgba(8, 145, 178, 0.28)',
        color: 'primary.main',
        boxShadow: isDark
          ? '0 0 20px rgba(34, 211, 238, 0.18)'
          : '0 6px 16px rgba(8, 145, 178, 0.14)',
      }
    : {
        bgcolor: isDark ? 'rgba(129, 140, 248, 0.16)' : 'rgba(99, 102, 241, 0.1)',
        border: '1px solid',
        borderColor: isDark ? 'rgba(165, 180, 252, 0.4)' : 'rgba(99, 102, 241, 0.28)',
        color: isDark ? '#A5B4FC' : '#4F46E5',
        boxShadow: isDark
          ? '0 0 20px rgba(129, 140, 248, 0.2)'
          : '0 6px 16px rgba(99, 102, 241, 0.12)',
      }),
});

const ctaBaseSx = {
  textDecoration: 'none',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.85,
  py: 1.1,
  px: 1.75,
  borderRadius: 2,
  fontWeight: 800,
  fontSize: '0.9rem',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
  '&:hover': { transform: 'translateY(-1px)' },
  '&:focus-visible': { outline: '2px solid', outlineOffset: 3 },
} as const;

/** Volunteer registration CTA. */
export function LandingRegisterPanel() {
  const { t } = useTranslation('common');
  const { theme, isDark, textPrimary, textSecondary, primaryBg, primaryHover } = useLandingGlass();

  return (
    <GlassCardShell delay="0.12s" accent="cyan">
      <Stack spacing={1.25} alignItems="center">
        <Box sx={panelIconSx(isDark, 'cyan')}>
          <VolunteerActivismOutlinedIcon sx={{ fontSize: 22 }} />
        </Box>

        <Typography
          variant="subtitle2"
          sx={{ color: textPrimary, fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1.3, textAlign: 'center' }}
        >
          {t('landing.getStarted')}
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: textSecondary, lineHeight: 1.5, fontSize: '0.8rem', textAlign: 'center', px: 0.25 }}
        >
          {t('landing.registerLead')}
        </Typography>

        <Box
          component={RouterLink}
          to="/register"
          sx={{
            ...ctaBaseSx,
            bgcolor: primaryBg,
            color: theme.palette.primary.contrastText,
            border: isDark ? '1px solid rgba(34, 211, 238, 0.5)' : '1px solid rgba(8, 145, 178, 0.3)',
            boxShadow: '0 8px 20px rgba(8, 145, 178, 0.24)',
            '&:hover': {
              ...ctaBaseSx['&:hover'],
              bgcolor: primaryHover,
              boxShadow: '0 10px 24px rgba(8, 145, 178, 0.32)',
            },
            '&:focus-visible': { ...ctaBaseSx['&:focus-visible'], outlineColor: 'primary.light' },
          }}
        >
          <PersonAddAltOutlinedIcon sx={{ fontSize: 18 }} />
          {t('landing.cta')}
          <ArrowBackRoundedIcon sx={{ fontSize: 16, opacity: 0.85, mr: -0.25 }} />
        </Box>

        <Typography
          variant="caption"
          sx={{ color: textSecondary, textAlign: 'center', lineHeight: 1.45, display: 'block', px: 0.25, fontSize: '0.7rem' }}
        >
          {t('landing.registerDesc')}
        </Typography>
      </Stack>
    </GlassCardShell>
  );
}

/** Login CTA. */
export function LandingLoginPanel() {
  const { t } = useTranslation('common');
  const { theme, isDark, textPrimary, textSecondary } = useLandingGlass();

  const roles = [
    {
      key: 'admin',
      label: t('landing.loginRoles.admin'),
      icon: <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 13 }} />,
    },
    {
      key: 'coordinator',
      label: t('landing.loginRoles.coordinator'),
      icon: <GroupsOutlinedIcon sx={{ fontSize: 13 }} />,
    },
    {
      key: 'volunteer',
      label: t('landing.loginRoles.volunteer'),
      icon: <VolunteerActivismOutlinedIcon sx={{ fontSize: 13 }} />,
    },
  ] as const;

  return (
    <GlassCardShell delay="0.12s" accent="indigo">
      <Stack spacing={1.25} alignItems="center">
        <Box sx={panelIconSx(isDark, 'indigo')}>
          <LoginOutlinedIcon sx={{ fontSize: 22 }} />
        </Box>

        <Typography
          variant="subtitle2"
          sx={{ color: textPrimary, fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1.3, textAlign: 'center' }}
        >
          {t('landing.loginTitle')}
        </Typography>

        <Stack
          direction="row"
          spacing={0.5}
          useFlexGap
          flexWrap="wrap"
          justifyContent="center"
          alignItems="center"
          sx={{ width: '100%' }}
        >
          {roles.map((role) => (
            <Chip
              key={role.key}
              size="small"
              icon={role.icon}
              label={role.label}
              sx={{
                fontWeight: 700,
                fontSize: '0.68rem',
                height: 24,
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(148,163,184,0.22)' : 'rgba(15,23,42,0.08)',
                color: textPrimary,
                '& .MuiChip-icon': { color: 'primary.main', ml: 0.5, fontSize: 14 },
              }}
            />
          ))}
        </Stack>

        <Box
          component={RouterLink}
          to="/login"
          sx={{
            ...ctaBaseSx,
            background: isDark
              ? 'linear-gradient(135deg, rgba(34,211,238,0.18) 0%, rgba(129,140,248,0.22) 100%)'
              : 'linear-gradient(135deg, rgba(8,145,178,0.12) 0%, rgba(99,102,241,0.14) 100%)',
            color: textPrimary,
            border: '1px solid',
            borderColor: isDark ? 'rgba(165, 180, 252, 0.45)' : 'rgba(99, 102, 241, 0.28)',
            boxShadow: isDark
              ? '0 8px 20px rgba(129, 140, 248, 0.16)'
              : '0 8px 20px rgba(99, 102, 241, 0.1)',
            '&:hover': {
              ...ctaBaseSx['&:hover'],
              borderColor: isDark ? 'rgba(103, 232, 249, 0.55)' : 'rgba(8, 145, 178, 0.45)',
              boxShadow: isDark
                ? '0 10px 24px rgba(34, 211, 238, 0.2)'
                : '0 10px 24px rgba(8, 145, 178, 0.16)',
            },
            '&:focus-visible': { ...ctaBaseSx['&:focus-visible'], outlineColor: 'secondary.main' },
          }}
        >
          <LoginOutlinedIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
          {t('landing.loginCta')}
        </Box>

        <Typography
          variant="caption"
          sx={{ color: textSecondary, textAlign: 'center', lineHeight: 1.45, fontSize: '0.7rem' }}
        >
          {t('landing.loginHint')}
        </Typography>
      </Stack>
    </GlassCardShell>
  );
}

/** @deprecated Use LandingRegisterPanel */
export const LandingAuthPanel = LandingRegisterPanel;

/** @deprecated Use LandingLoginPanel */
export const LandingDateTimePanel = LandingLoginPanel;

export function LandingVersePanel() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const cardBg = isDark ? 'rgba(10, 20, 42, 0.78)' : 'rgba(248, 250, 252, 0.8)';
  const cardBorder = isDark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(15, 23, 42, 0.12)';

  return (
    <Box
      sx={{
        ...fadeUp,
        animationDelay: '0.2s',
        width: { xs: '100%', md: 'auto' },
        maxWidth: { xs: '100%', sm: 560, md: '100%', lg: 860 },
        minWidth: 0,
        flex: { md: '1 1 auto' },
        display: 'block',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { sm: 2.25, md: 2.75 },
          borderRadius: 3.5,
          bgcolor: cardBg,
          border: `1px solid ${cardBorder}`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: isDark
            ? '0 20px 50px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 20px 50px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255,255,255,0.7)',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? 'radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.1) 0%, transparent 55%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 55%)',
            pointerEvents: 'none',
          }}
        />

        <Typography
          component="p"
          dir="rtl"
          lang="ar"
          sx={{
            position: 'relative',
            fontFamily: '"Amiri Quran", "Amiri", serif',
            fontSize: { xs: '1.4rem', sm: '1.65rem', md: '1.9rem', lg: '2.05rem' },
            lineHeight: { xs: 2.15, md: 1.9 },
            textAlign: 'center',
            color: isDark ? '#F8FAFC' : '#0F172A',
            mb: 2,
            letterSpacing: '0.01em',
            whiteSpace: { xs: 'normal', lg: 'nowrap' },
          }}
        >
          {t('landing.verse.arabic')}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            position: 'relative',
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
            position: 'relative',
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

import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import panahLogo from '@/assets/images/panah-logo.png';

interface AppLoadingScreenProps {
  fullScreen?: boolean;
}

export function AppLoadingScreen({ fullScreen = false }: AppLoadingScreenProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        px: 2,
        bgcolor: 'background.default',
        ...(fullScreen
          ? {
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100dvh',
              minHeight: '100dvh',
              zIndex: (theme) => theme.zIndex.modal + 1,
            }
          : {
              position: 'relative',
              minHeight: '100dvh',
              width: '100%',
            }),
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? `
                radial-gradient(ellipse 55% 45% at 18% 22%, rgba(34, 211, 238, 0.14) 0%, transparent 70%),
                radial-gradient(ellipse 50% 40% at 82% 78%, rgba(129, 140, 248, 0.16) 0%, transparent 72%),
                radial-gradient(ellipse 40% 35% at 50% 50%, rgba(34, 211, 238, 0.05) 0%, transparent 70%)
              `
              : `
                radial-gradient(ellipse 55% 45% at 18% 22%, rgba(34, 211, 238, 0.18) 0%, transparent 70%),
                radial-gradient(ellipse 50% 40% at 82% 78%, rgba(129, 140, 248, 0.14) 0%, transparent 72%),
                radial-gradient(ellipse 40% 35% at 50% 50%, rgba(34, 211, 238, 0.08) 0%, transparent 70%)
              `,
        }}
      />

      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          top: '12%',
          right: '8%',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 68%)',
          animation: 'loadingOrbA 7s ease-in-out infinite',
          '@keyframes loadingOrbA': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '50%': { transform: 'translate(-18px, 14px) scale(1.06)' },
          },
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: '50%',
          bottom: '10%',
          left: '6%',
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.14) 0%, transparent 68%)',
          animation: 'loadingOrbB 8s ease-in-out infinite',
          '@keyframes loadingOrbB': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '50%': { transform: 'translate(16px, -12px) scale(1.08)' },
          },
        }}
      />

      <Box
        role="status"
        aria-live="polite"
        aria-label={t('actions.loading')}
        sx={{
          position: 'relative',
          width: 'min(460px, 100%)',
          p: '2px',
          borderRadius: 5,
          background: 'linear-gradient(135deg, #22D3EE 0%, #818CF8 50%, #22D3EE 100%)',
          backgroundSize: '220% 220%',
          animation: 'loadingBorderShift 4s ease infinite',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 48px rgba(34, 211, 238, 0.12)'
              : '0 24px 60px rgba(15, 23, 42, 0.14), 0 0 40px rgba(34, 211, 238, 0.16)',
          '@keyframes loadingBorderShift': {
            '0%, 100%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
          },
        }}
      >
        <Box
          sx={{
            borderRadius: 4.75,
            px: { xs: 3, sm: 4 },
            py: { xs: 3.5, sm: 4.5 },
            textAlign: 'center',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(8, 18, 38, 0.98) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 92,
              height: 92,
              mx: 'auto',
              mb: 2.5,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: 'primary.main',
                borderRightColor: 'rgba(129, 140, 248, 0.85)',
                animation: 'loadingSpin 1.35s linear infinite',
                '@keyframes loadingSpin': {
                  to: { transform: 'rotate(360deg)' },
                },
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 10,
                borderRadius: '50%',
                border: '1px solid',
                borderColor: 'rgba(34, 211, 238, 0.22)',
                animation: 'loadingPulseRing 2.2s ease-in-out infinite',
                '@keyframes loadingPulseRing': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 0.55 },
                  '50%': { transform: 'scale(1.06)', opacity: 1 },
                },
              }}
            />
            <Box
              component="img"
              src={panahLogo}
              alt={t('appName')}
              sx={{
                width: 56,
                height: 56,
                objectFit: 'contain',
                display: 'block',
                filter: isDark ? 'invert(1) brightness(1.05)' : 'none',
                animation: 'loadingLogoFloat 2.8s ease-in-out infinite',
                '@keyframes loadingLogoFloat': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-4px)' },
                },
              }}
            />
          </Box>

          <Typography
            variant="h5"
            fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #22D3EE 0%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('appName')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
            {t('appTagline')}
          </Typography>
          <Typography
            variant="caption"
            color="primary.main"
            sx={{
              display: 'block',
              mt: 1.25,
              fontWeight: 600,
              letterSpacing: '0.04em',
              animation: 'loadingTextPulse 1.8s ease-in-out infinite',
              '@keyframes loadingTextPulse': {
                '0%, 100%': { opacity: 0.55 },
                '50%': { opacity: 1 },
              },
            }}
          >
            {t('actions.loading')}
          </Typography>

          <Box
            sx={{
              mt: 2.5,
              mx: 'auto',
              width: '72%',
              height: 5,
              borderRadius: 99,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.2)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                width: '42%',
                borderRadius: 99,
                background: 'linear-gradient(90deg, transparent, #22D3EE, #818CF8, transparent)',
                animation: 'loadingShimmer 1.5s ease-in-out infinite',
                '@keyframes loadingShimmer': {
                  '0%': { transform: 'translateX(-130%)' },
                  '100%': { transform: 'translateX(330%)' },
                },
              }}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'inline-flex', alignItems: 'center', gap: 0.9 }}>
            {[0, 1, 2].map((dot) => (
              <Box
                key={dot}
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'loadingDot 1.2s infinite ease-in-out',
                  animationDelay: `${dot * 0.18}s`,
                  '@keyframes loadingDot': {
                    '0%, 80%, 100%': { transform: 'translateY(0) scale(0.85)', opacity: 0.35 },
                    '40%': { transform: 'translateY(-5px) scale(1.1)', opacity: 1 },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

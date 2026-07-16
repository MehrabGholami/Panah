import { Box, useTheme } from '@mui/material';
import { PublicSiteHeader } from '@/shared/components/ui';
import { LandingAuthPanel, LandingDateTimePanel, LandingVersePanel } from './components/LandingSections';

const homeHeroSrc = '/home-hero.png';

export default function LandingPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
        position: 'relative',
        bgcolor: theme.palette.background.default,
      }}
    >
      <Box
        component="img"
        src={homeHeroSrc}
        alt=""
        aria-hidden
        fetchPriority="high"
        decoding="async"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          zIndex: 0,
        }}
      />

      {/* Layered overlays for depth and readability */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: isDark
            ? `
            linear-gradient(105deg, rgba(8, 18, 38, 0.15) 0%, transparent 45%),
            linear-gradient(180deg, rgba(8, 18, 38, 0.55) 0%, rgba(8, 18, 38, 0.12) 28%, transparent 58%),
            linear-gradient(0deg, rgba(8, 18, 38, 0.75) 0%, transparent 42%)
          `
            : `
            linear-gradient(105deg, rgba(248, 250, 252, 0.42) 0%, transparent 45%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.12) 28%, transparent 58%),
            linear-gradient(0deg, rgba(15, 23, 42, 0.28) 0%, transparent 42%)
          `,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: isDark
            ? 'radial-gradient(ellipse at 78% 18%, rgba(34, 211, 238, 0.04) 0%, transparent 48%)'
            : 'radial-gradient(ellipse at 78% 18%, rgba(34, 211, 238, 0.10) 0%, transparent 48%)',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <PublicSiteHeader />

        <Box
          sx={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: { xs: 'flex-end', md: 'flex-end' },
            px: { xs: 2, sm: 3, md: 4 },
            pb: { xs: 3, md: 4 },
            pt: { md: 2 },
            minHeight: 0,
            overflow: 'visible',
            width: '100%',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              minHeight: { md: 220 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-start' },
              justifyContent: { xs: 'center', md: 'space-between' },
              gap: { xs: 2, md: 3 },
              direction: { md: 'ltr' },
            }}
          >
            <Box
              sx={{
                order: { xs: 3, md: 1 },
                width: { xs: '100%', md: 'auto' },
                display: 'flex',
                justifyContent: { xs: 'center', md: 'flex-start' },
                alignItems: { md: 'flex-start' },
                flexShrink: 0,
                pl: { md: 1 },
              }}
            >
              <LandingDateTimePanel />
            </Box>

            <Box
              sx={{
                order: { xs: 2, md: 2 },
                width: { xs: '100%', md: 'auto' },
                display: 'flex',
                justifyContent: 'center',
                alignItems: { md: 'flex-start' },
                flex: { md: '1 1 auto' },
                px: { md: 1 },
              }}
            >
              <LandingVersePanel />
            </Box>

            <Box
              sx={{
                order: { xs: 1, md: 3 },
                flexShrink: 0,
                display: 'flex',
                justifyContent: { xs: 'center', md: 'flex-end' },
                alignItems: { md: 'flex-start' },
                pr: { md: 1 },
              }}
            >
              <LandingAuthPanel />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

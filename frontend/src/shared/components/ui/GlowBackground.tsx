import { Box } from '@mui/material';
import { darkColors } from '@/theme/tokens/colors';

interface GlowBackgroundProps {
  children?: React.ReactNode;
}

export function GlowBackground({ children }: GlowBackgroundProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          '@media (prefers-reduced-motion: no-preference)': {
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              borderRadius: '50%',
              filter: 'blur(80px)',
            },
            '&::before': {
              width: 480,
              height: 480,
              bottom: '-10%',
              left: '-5%',
              background: darkColors.glow.cyan,
            },
            '&::after': {
              width: 400,
              height: 400,
              top: '-5%',
              right: '-5%',
              background: darkColors.glow.purple,
            },
          },
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
    </Box>
  );
}

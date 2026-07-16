import { Box, Stack, Typography, useTheme } from '@mui/material';
import investicaLogo from '@/assets/images/investica-logo.png';

interface InvesticaCreditProps {
  compact?: boolean;
}

export function InvesticaCredit({ compact = false }: InvesticaCreditProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const textSize = compact ? '0.9rem' : '1rem';

  return (
    <Box
      component="footer"
      sx={{
        flexShrink: 0,
        py: compact ? 1.1 : 2,
        px: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: isDarkMode ? 'rgba(14, 24, 48, 0.78)' : 'rgba(245, 248, 255, 0.95)',
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        justifyContent="center"
        flexWrap="wrap"
        sx={{ minHeight: compact ? 34 : 40 }}
      >
        <Typography
          variant="caption"
          sx={{
            color: isDarkMode ? 'rgba(208, 222, 240, 0.92)' : 'rgba(21, 42, 73, 0.9)',
            fontWeight: 500,
            fontSize: textSize,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          © 2026 Investica Group - تمامی حقوق محفوظ است.
        </Typography>
        <Box
          component="img"
          src={investicaLogo}
          alt="Investica Group"
          sx={{
            height: compact ? 30 : 34,
            width: 'auto',
            display: 'block',
            objectFit: 'contain',
            alignSelf: 'center',
            filter: isDarkMode ? 'brightness(0) invert(1)' : 'none',
            opacity: 0.98,
          }}
        />
      </Stack>
    </Box>
  );
}

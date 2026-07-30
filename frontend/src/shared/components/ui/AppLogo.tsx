import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import panahLogo from '@/assets/images/panah-logo.png';

interface AppLogoProps {
  to?: string;
  showText?: boolean;
}

export function AppLogo({ to = '/', showText = true }: AppLogoProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const content = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit' }}>
      <Box
        component="img"
        src={panahLogo}
        alt={t('appName')}
        sx={{
          width: 40,
          height: 40,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          filter: isDark ? 'invert(1) brightness(1.05)' : 'none',
        }}
      />
      {showText && (
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            {t('appName')}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: 'none', md: 'block' }, lineHeight: 1.2 }}
          >
            {t('appTagline')}
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (to) {
    return (
      <Box component={RouterLink} to={to} sx={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Box>
    );
  }

  return content;
}

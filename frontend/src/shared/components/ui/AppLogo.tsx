import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

interface AppLogoProps {
  to?: string;
  showText?: boolean;
}

export function AppLogo({ to = '/', showText = true }: AppLogoProps) {
  const { t } = useTranslation('common');

  const content = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit' }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #22D3EE 0%, #818CF8 100%)',
        }}
      >
        <VolunteerActivismIcon sx={{ color: '#0B0F1A', fontSize: 24 }} />
      </Box>
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

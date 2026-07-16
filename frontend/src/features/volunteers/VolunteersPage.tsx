import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MissionApplicationsTab } from './MissionApplicationsTab';

export default function VolunteersPage() {
  const { t } = useTranslation('volunteers');

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t('title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('subtitle')}
      </Typography>
      <MissionApplicationsTab />
    </Box>
  );
}

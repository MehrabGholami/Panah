import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function RegisterProfileInviteCard() {
  const { t } = useTranslation('auth');

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2.5,
        px: 1.5,
        py: 1.25,
        border: 1,
        borderColor: 'rgba(34, 211, 238, 0.28)',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(90deg, rgba(34,211,238,0.1) 0%, rgba(129,140,248,0.12) 100%)'
            : 'linear-gradient(90deg, rgba(34,211,238,0.08) 0%, rgba(129,140,248,0.06) 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -16,
          right: -12,
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: 'rgba(129, 140, 248, 0.1)',
        }}
      />

      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Box
          sx={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, #22D3EE 0%, #818CF8 100%)',
            boxShadow: '0 8px 20px rgba(34, 211, 238, 0.22)',
          }}
        >
          <AutoAwesomeOutlinedIcon sx={{ color: 'common.white', fontSize: 22 }} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.6 }}>
            {t('register.profileInvite.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.7, display: 'block' }}>
            {t('register.profileInvite.description')}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

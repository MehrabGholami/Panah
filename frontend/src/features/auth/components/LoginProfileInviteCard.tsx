import ContactEmergencyOutlinedIcon from '@mui/icons-material/ContactEmergencyOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const HIGHLIGHTS = [
  { key: 'identity', icon: PersonOutlineIcon, color: '#22D3EE' },
  { key: 'emergency', icon: ContactEmergencyOutlinedIcon, color: '#818CF8' },
  { key: 'skills', icon: VolunteerActivismOutlinedIcon, color: '#34D399' },
] as const;

export function LoginProfileInviteCard() {
  const { t } = useTranslation('auth');

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        px: { xs: 1.75, sm: 2 },
        py: { xs: 1.75, sm: 2 },
        mt: 2,
        border: 1,
        borderColor: 'rgba(34, 211, 238, 0.28)',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(129,140,248,0.14) 52%, rgba(15,23,42,0.55) 100%)'
            : 'linear-gradient(135deg, rgba(34,211,238,0.1) 0%, rgba(129,140,248,0.08) 55%, rgba(255,255,255,0.95) 100%)',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 10px 30px rgba(34, 211, 238, 0.08)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -28,
          left: -18,
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: 'rgba(34, 211, 238, 0.14)',
          filter: 'blur(2px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -34,
          right: -10,
          width: 110,
          height: 110,
          borderRadius: '50%',
          bgcolor: 'rgba(129, 140, 248, 0.12)',
        }}
      />

      <Stack
        spacing={1.75}
        alignItems="center"
        textAlign="center"
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Box
          sx={{
            flexShrink: 0,
            width: 72,
            height: 72,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, #22D3EE 0%, #818CF8 100%)',
            boxShadow: '0 12px 28px rgba(34, 211, 238, 0.28)',
          }}
        >
          <FavoriteOutlinedIcon sx={{ color: 'common.white', fontSize: 34 }} />
        </Box>

        <Box sx={{ width: '100%', maxWidth: 520 }}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5, lineHeight: 1.5 }}>
            {t('login.profileInvite.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 1.25 }}>
            {t('login.profileInvite.description')}
          </Typography>

          <Stack
            direction="row"
            spacing={0.75}
            flexWrap="wrap"
            useFlexGap
            justifyContent="center"
          >
            {HIGHLIGHTS.map(({ key, icon: Icon, color }) => (
              <Chip
                key={key}
                size="small"
                icon={<Icon sx={{ fontSize: '16px !important', color: `${color} !important` }} />}
                label={t(`login.profileInvite.items.${key}`)}
                sx={{
                  height: 28,
                  fontWeight: 600,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                }}
              />
            ))}
          </Stack>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.1 }}>
            {t('login.profileInvite.footnote')}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

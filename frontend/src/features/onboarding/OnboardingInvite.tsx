import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Fade,
  IconButton,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface OnboardingInviteProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onStart: () => void;
  onLater: () => void;
}

export function OnboardingInvite({ open, anchorEl, onStart, onLater }: OnboardingInviteProps) {
  const { t } = useTranslation('common');
  const safeAnchor =
    typeof Node !== 'undefined' && anchorEl instanceof HTMLElement && document.contains(anchorEl)
      ? anchorEl
      : null;

  return (
    <Popper
      open={open && Boolean(safeAnchor)}
      anchorEl={safeAnchor}
      placement="right-start"
      transition
      modifiers={[
        { name: 'offset', options: { offset: [0, 12] } },
        { name: 'preventOverflow', options: { padding: 12 } },
        { name: 'flip', options: { fallbackPlacements: ['left-start', 'bottom', 'top'] } },
      ]}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={250}>
          <Paper
            elevation={6}
            role="dialog"
            aria-label={t('onboarding.invite.title')}
            sx={{
              p: 2,
              width: 280,
              maxWidth: 'calc(100vw - 32px)',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                <Typography variant="subtitle2" fontWeight={800}>
                  {t('onboarding.invite.title')}
                </Typography>
                <IconButton size="small" onClick={onLater} aria-label={t('onboarding.invite.later')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {t('onboarding.invite.message')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button size="small" onClick={onLater}>
                  {t('onboarding.invite.later')}
                </Button>
                <Button size="small" variant="contained" onClick={onStart}>
                  {t('onboarding.invite.start')}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
}

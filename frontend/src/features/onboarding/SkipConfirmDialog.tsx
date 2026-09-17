import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface SkipConfirmDialogProps {
  open: boolean;
  onContinue: () => void;
  onConfirmSkip: () => void;
}

export function SkipConfirmDialog({ open, onContinue, onConfirmSkip }: SkipConfirmDialogProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog
      open={open}
      onClose={onContinue}
      maxWidth="xs"
      fullWidth
      aria-labelledby="onboarding-skip-title"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
    >
      <DialogTitle id="onboarding-skip-title">{t('onboarding.skipConfirm.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('onboarding.skipConfirm.message')}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onContinue} variant="outlined">
          {t('onboarding.skipConfirm.continue')}
        </Button>
        <Button onClick={onConfirmSkip} color="error" variant="contained" autoFocus>
          {t('onboarding.skipConfirm.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

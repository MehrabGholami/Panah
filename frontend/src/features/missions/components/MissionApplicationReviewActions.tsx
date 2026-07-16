import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '@/shared/components/ui';
import type { MissionApplication } from '@/shared/types';

type ReviewAction = 'approve' | 'waitlist' | 'reject';

interface MissionApplicationReviewActionsProps {
  application: MissionApplication;
  onReview: (payload: {
    applicationId: string;
    action: ReviewAction;
    reviewNote?: string;
  }) => void;
  isPending?: boolean;
  compact?: boolean;
  iconOnly?: boolean;
}

export function MissionApplicationReviewActions({
  application,
  onReview,
  isPending = false,
  compact = false,
  iconOnly = false,
}: MissionApplicationReviewActionsProps) {
  const { t } = useTranslation('missions');
  const [dialogAction, setDialogAction] = useState<'waitlist' | 'reject' | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const canReview =
    application.status === 'submitted' || application.status === 'waitlist';

  if (!canReview) {
    return null;
  }

  const openDialog = (action: 'waitlist' | 'reject') => {
    setReviewNote('');
    setDialogAction(action);
  };

  const submitDialog = () => {
    if (!dialogAction) return;
    onReview({
      applicationId: application.id,
      action: dialogAction,
      reviewNote: reviewNote.trim() || undefined,
    });
    setDialogAction(null);
    setReviewNote('');
  };

  const buttonSize = compact || iconOnly ? 'small' : 'medium';

  const stopRowClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  if (iconOnly) {
    return (
      <>
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="flex-end"
          onClick={stopRowClick}
        >
          <Tooltip title={t('applications.approve')}>
            <span>
              <IconButton
                size="small"
                color="success"
                disabled={isPending}
                onClick={() => onReview({ applicationId: application.id, action: 'approve' })}
              >
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {application.status === 'submitted' && (
            <Tooltip title={t('applications.waitlist')}>
              <span>
                <IconButton
                  size="small"
                  color="warning"
                  disabled={isPending}
                  onClick={() => openDialog('waitlist')}
                >
                  <HourglassEmptyOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title={t('applications.reject')}>
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={isPending}
                onClick={() => openDialog('reject')}
              >
                <HighlightOffOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Dialog
          open={dialogAction !== null}
          onClose={() => setDialogAction(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {dialogAction === 'reject'
              ? t('applications.rejectDialog.title')
              : t('applications.waitlistDialog.title')}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {dialogAction === 'reject'
                ? t('applications.rejectDialog.subtitle')
                : t('applications.waitlistDialog.subtitle')}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t('applications.reviewNote')}
              placeholder={t('applications.reviewNotePlaceholder')}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogAction(null)}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <GradientButton onClick={submitDialog} disabled={isPending}>
              {dialogAction === 'reject'
                ? t('applications.reject')
                : t('applications.waitlist')}
            </GradientButton>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Box onClick={stopRowClick}>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent="flex-end">
        <Button
          size={buttonSize}
          color="success"
          variant="contained"
          startIcon={<CheckCircleOutlineIcon />}
          onClick={() =>
            onReview({ applicationId: application.id, action: 'approve' })
          }
          disabled={isPending}
        >
          {t('applications.approve')}
        </Button>
        {application.status === 'submitted' && (
          <Button
            size={buttonSize}
            color="warning"
            variant="outlined"
            startIcon={<HourglassEmptyOutlinedIcon />}
            onClick={() => openDialog('waitlist')}
            disabled={isPending}
          >
            {t('applications.waitlist')}
          </Button>
        )}
        <Button
          size={buttonSize}
          color="error"
          variant="outlined"
          startIcon={<HighlightOffOutlinedIcon />}
          onClick={() => openDialog('reject')}
          disabled={isPending}
        >
          {t('applications.reject')}
        </Button>
      </Stack>

      <Dialog
        open={dialogAction !== null}
        onClose={() => setDialogAction(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogAction === 'reject'
            ? t('applications.rejectDialog.title')
            : t('applications.waitlistDialog.title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {dialogAction === 'reject'
              ? t('applications.rejectDialog.subtitle')
              : t('applications.waitlistDialog.subtitle')}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={t('applications.reviewNote')}
            placeholder={t('applications.reviewNotePlaceholder')}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogAction(null)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <GradientButton onClick={submitDialog} disabled={isPending}>
            {dialogAction === 'reject'
              ? t('applications.reject')
              : t('applications.waitlist')}
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

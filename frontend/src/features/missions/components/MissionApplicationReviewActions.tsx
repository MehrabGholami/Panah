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
  alpha,
  type ButtonProps,
  type IconButtonProps,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { GradientButton } from '@/shared/components/ui';
import type { MissionApplication } from '@/shared/types';

type ReviewAction = 'approve' | 'waitlist' | 'reject';
type ActionTone = 'success' | 'warning' | 'error';

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

const TONE_COLORS: Record<ActionTone, string> = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

function ReviewActionButton({
  tone,
  compact,
  children,
  sx,
  ...props
}: ButtonProps & { tone: ActionTone; compact?: boolean }) {
  const color = TONE_COLORS[tone];

  return (
    <Button
      size={compact ? 'small' : 'medium'}
      disableElevation
      {...props}
      sx={{
        minHeight: compact ? 32 : 36,
        minWidth: compact ? 84 : 96,
        px: compact ? 1.25 : 1.5,
        py: 0.5,
        borderRadius: 2,
        fontWeight: 700,
        fontSize: compact ? '0.75rem' : '0.8125rem',
        letterSpacing: 0,
        textTransform: 'none',
        color,
        bgcolor: (theme) =>
          alpha(color, theme.palette.mode === 'dark' ? 0.16 : 0.1),
        border: '1px solid',
        borderColor: (theme) =>
          alpha(color, theme.palette.mode === 'dark' ? 0.4 : 0.28),
        boxShadow: 'none',
        whiteSpace: 'nowrap',
        '& .MuiButton-startIcon': {
          marginInlineEnd: 0.75,
          marginInlineStart: 0,
          '& > *:nth-of-type(1)': { fontSize: compact ? 16 : 18 },
        },
        '&:hover': {
          bgcolor: (theme) =>
            alpha(color, theme.palette.mode === 'dark' ? 0.24 : 0.16),
          borderColor: (theme) =>
            alpha(color, theme.palette.mode === 'dark' ? 0.55 : 0.4),
          boxShadow: 'none',
        },
        '&.Mui-disabled': {
          opacity: 0.45,
          color,
          bgcolor: (theme) =>
            alpha(color, theme.palette.mode === 'dark' ? 0.1 : 0.06),
          borderColor: (theme) => alpha(color, 0.18),
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}

function ReviewIconButton({
  tone,
  children,
  sx,
  ...props
}: IconButtonProps & { tone: ActionTone }) {
  const color = TONE_COLORS[tone];

  return (
    <IconButton
      size="small"
      {...props}
      sx={{
        width: 34,
        height: 34,
        borderRadius: 1.75,
        color,
        bgcolor: (theme) =>
          alpha(color, theme.palette.mode === 'dark' ? 0.16 : 0.1),
        border: '1px solid',
        borderColor: (theme) =>
          alpha(color, theme.palette.mode === 'dark' ? 0.38 : 0.24),
        '&:hover': {
          bgcolor: (theme) =>
            alpha(color, theme.palette.mode === 'dark' ? 0.26 : 0.16),
          borderColor: (theme) =>
            alpha(color, theme.palette.mode === 'dark' ? 0.55 : 0.38),
        },
        '&.Mui-disabled': {
          opacity: 0.45,
          color,
        },
        ...sx,
      }}
    >
      {children}
    </IconButton>
  );
}

function ReviewNoteDialog({
  dialogAction,
  reviewNote,
  setReviewNote,
  onClose,
  onSubmit,
  isPending,
  t,
}: {
  dialogAction: 'waitlist' | 'reject' | null;
  reviewNote: string;
  setReviewNote: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  t: TFunction;
}) {
  return (
    <Dialog open={dialogAction !== null} onClose={onClose} maxWidth="sm" fullWidth>
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
        <Button onClick={onClose}>{t('actions.cancel', { ns: 'common' })}</Button>
        <GradientButton onClick={onSubmit} disabled={isPending}>
          {dialogAction === 'reject' ? t('applications.reject') : t('applications.waitlist')}
        </GradientButton>
      </DialogActions>
    </Dialog>
  );
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

  const showWaitlist = application.status === 'submitted';

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

  const stopRowClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const dialog = (
    <ReviewNoteDialog
      dialogAction={dialogAction}
      reviewNote={reviewNote}
      setReviewNote={setReviewNote}
      onClose={() => setDialogAction(null)}
      onSubmit={submitDialog}
      isPending={isPending}
      t={t}
    />
  );

  if (iconOnly) {
    return (
      <>
        <Stack
          direction="row"
          spacing={0.75}
          justifyContent="flex-end"
          alignItems="center"
          onClick={stopRowClick}
        >
          <Tooltip title={t('applications.approve')}>
            <span>
              <ReviewIconButton
                tone="success"
                disabled={isPending}
                onClick={() => onReview({ applicationId: application.id, action: 'approve' })}
              >
                <CheckCircleOutlineIcon fontSize="small" />
              </ReviewIconButton>
            </span>
          </Tooltip>
          {showWaitlist && (
            <Tooltip title={t('applications.waitlist')}>
              <span>
                <ReviewIconButton
                  tone="warning"
                  disabled={isPending}
                  onClick={() => openDialog('waitlist')}
                >
                  <HourglassEmptyOutlinedIcon fontSize="small" />
                </ReviewIconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title={t('applications.reject')}>
            <span>
              <ReviewIconButton
                tone="error"
                disabled={isPending}
                onClick={() => openDialog('reject')}
              >
                <HighlightOffOutlinedIcon fontSize="small" />
              </ReviewIconButton>
            </span>
          </Tooltip>
        </Stack>
        {dialog}
      </>
    );
  }

  return (
    <Box onClick={stopRowClick}>
      <Stack
        direction="row"
        spacing={0.75}
        flexWrap="nowrap"
        useFlexGap
        justifyContent="flex-end"
        alignItems="center"
        sx={{
          p: 0.5,
          borderRadius: 2.5,
          bgcolor: (theme) =>
            alpha(
              theme.palette.text.primary,
              theme.palette.mode === 'dark' ? 0.04 : 0.03,
            ),
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <ReviewActionButton
          tone="success"
          compact={compact}
          startIcon={<CheckCircleOutlineIcon />}
          onClick={() => onReview({ applicationId: application.id, action: 'approve' })}
          disabled={isPending}
        >
          {t('applications.approve')}
        </ReviewActionButton>
        {showWaitlist && (
          <ReviewActionButton
            tone="warning"
            compact={compact}
            startIcon={<HourglassEmptyOutlinedIcon />}
            onClick={() => openDialog('waitlist')}
            disabled={isPending}
          >
            {t('applications.waitlist')}
          </ReviewActionButton>
        )}
        <ReviewActionButton
          tone="error"
          compact={compact}
          startIcon={<HighlightOffOutlinedIcon />}
          onClick={() => openDialog('reject')}
          disabled={isPending}
        >
          {t('applications.reject')}
        </ReviewActionButton>
      </Stack>
      {dialog}
    </Box>
  );
}

import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard, GradientButton } from '@/shared/components/ui';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type { MissionCoordinatorRequest, PaginatedResponse } from '@/shared/types';
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage';
import { toPersianDigits } from '@/shared/utils/persianDigits';

type ReviewDialogState = {
  request: MissionCoordinatorRequest;
  action: 'approve' | 'reject';
} | null;

export default function CoordinatorRequestsPage() {
  const { t } = useTranslation('missions');
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [dialog, setDialog] = useState<ReviewDialogState>(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['missions', 'coordinator-requests', 'inbox'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<MissionCoordinatorRequest>>(
        endpoints.missions.coordinatorRequestsInbox,
      );
      return response;
    },
    refetchInterval: 30_000,
  });

  const requests = data?.results ?? [];

  const reviewMutation = useMutation({
    mutationFn: async ({
      missionId,
      requestId,
      action,
      review_note,
    }: {
      missionId: string;
      requestId: string;
      action: 'approve' | 'reject';
      review_note?: string;
    }) => {
      const url =
        action === 'approve'
          ? endpoints.missions.approveCoordinatorRequest(missionId, requestId)
          : endpoints.missions.rejectCoordinatorRequest(missionId, requestId);
      const { data: response } = await apiClient.post(url, { review_note: review_note ?? '' });
      return response;
    },
    onSuccess: async () => {
      setFeedback({ type: 'success', text: t('messages.coordinationReviewed') });
      setDialog(null);
      setReviewNote('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['missions'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
      ]);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(error, t('messages.coordinationRequestError')),
      });
    },
  });

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
        <HowToRegOutlinedIcon color="primary" />
        <Typography variant="h4" fontWeight={800}>
          {t('coordination.inboxTitle')}
        </Typography>
        {isFetching && !isLoading && (
          <Chip size="small" label={t('actions.loading', { ns: 'common' })} />
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {t('coordination.inboxSubtitle')}
      </Typography>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.text}
        </Alert>
      )}
      {isError && <Alert severity="error">{t('actions.error', { ns: 'common' })}</Alert>}

      <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>{t('fields.title')}</TableCell>
                <TableCell>{t('fields.disaster')}</TableCell>
                <TableCell>{t('coordination.requester')}</TableCell>
                <TableCell>{t('coordination.currentCoordinator')}</TableCell>
                <TableCell>{t('coordination.message')}</TableCell>
                <TableCell>{t('table.status', { ns: 'common' })}</TableCell>
                <TableCell align="left">{t('table.actions', { ns: 'common' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    {t('actions.loading', { ns: 'common' })}
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">{t('coordination.empty')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography
                        component={RouterLink}
                        to={`/missions/${item.mission}`}
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {item.mission_title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {toPersianDigits(new Date(item.created_at).toLocaleString('fa-IR'))}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.disaster_title ?? '—'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.requester_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.requester_email}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.current_coordinator_name ?? '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" color="text.secondary" noWrap title={item.message}>
                        {item.message || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`coordinatorRequestStatus.${item.status}`)}
                        color={item.status === 'submitted' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {item.status === 'submitted' && (
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            color="success"
                            variant="outlined"
                            disabled={reviewMutation.isPending}
                            onClick={() => setDialog({ request: item, action: 'approve' })}
                          >
                            {t('coordination.approve')}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            disabled={reviewMutation.isPending}
                            onClick={() => setDialog({ request: item, action: 'reject' })}
                          >
                            {t('coordination.reject')}
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      <Dialog
        open={Boolean(dialog)}
        onClose={() => !reviewMutation.isPending && setDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialog?.action === 'approve' ? t('coordination.approve') : t('coordination.reject')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {dialog?.request.mission_title} — {dialog?.request.requester_name}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={t('coordination.reviewNote')}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} disabled={reviewMutation.isPending}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <GradientButton
            disabled={reviewMutation.isPending || !dialog}
            onClick={() => {
              if (!dialog) return;
              reviewMutation.mutate({
                missionId: dialog.request.mission,
                requestId: dialog.request.id,
                action: dialog.action,
                review_note: reviewNote,
              });
            }}
          >
            {dialog?.action === 'approve' ? t('coordination.approve') : t('coordination.reject')}
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

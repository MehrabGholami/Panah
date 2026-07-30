import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard, GradientButton, StatusChip } from '@/shared/components/ui';
import type { Mission } from '@/shared/types';
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage';
import { getMissionLocationDisplay } from '@/shared/utils/locationDisplay';
import { formatMissionEndDate } from '@/shared/utils/formatMissionEndDate';
import { toPersianDigits } from '@/shared/utils/persianDigits';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR'));
}

function MissionInfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
        {text}
      </Typography>
    </Box>
  );
}

export default function AvailableMissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('missions');
  const queryClient = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: mission, isLoading, isError } = useQuery({
    queryKey: ['missions', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Mission>(endpoints.missions.detail(id!));
      return data;
    },
    enabled: Boolean(id),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(endpoints.missions.apply(id!), { message });
      return data;
    },
    onSuccess: async () => {
      setFeedback({ type: 'success', text: t('messages.applySuccess') });
      setApplyOpen(false);
      setMessage('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['missions', id] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    },
    onError: (mutationError) => {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(mutationError, t('messages.applyError')),
      });
    },
  });

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
        <IconButton component={RouterLink} to="/missions/available">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight={800}>
          {t('detail')}
        </Typography>
      </Stack>

      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 2 }}
          onClose={() => setFeedback(null)}
        >
          {feedback.text}
        </Alert>
      )}
      {isError && <Alert severity="error">{t('actions.error', { ns: 'common' })}</Alert>}

      {isLoading ? (
        <Typography>{t('actions.loading', { ns: 'common' })}</Typography>
      ) : mission ? (
        <GlassCard sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800} gutterBottom sx={{ wordBreak: 'break-word' }}>
                {mission.title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <StatusChip status={mission.priority} label={t(`priority.${mission.priority}`)} />
                {mission.user_application_status === 'submitted' && (
                  <StatusChip status="submitted" label={t('applicationStatus.submitted')} />
                )}
                {mission.user_application_status === 'waitlist' && (
                  <StatusChip status="waitlist" label={t('applicationStatus.waitlist')} />
                )}
                {mission.user_application_status === 'approved' && (
                  <StatusChip status="approved" label={t('applicationStatus.approved')} />
                )}
              </Stack>
            </Box>
            {mission.allow_volunteer_applications && !mission.user_has_applied && (
              <GradientButton
                startIcon={<SendOutlinedIcon />}
                onClick={() => setApplyOpen(true)}
                sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, flexShrink: 0 }}
              >
                {t('actions.apply')}
              </GradientButton>
            )}
          </Stack>

          <Box sx={{ mb: 2 }}>
            <MissionInfoBlock
              title={t('fields.description')}
              text={mission.description?.trim() || t('empty.missionDetail')}
            />
          </Box>

          <Stack spacing={1}>
            <Typography variant="body2"><strong>{t('fields.disaster')}:</strong> {mission.disaster_title}</Typography>
            <Typography variant="body2"><strong>{t('fields.location')}:</strong> {getMissionLocationDisplay(mission)}</Typography>
            <Typography variant="body2"><strong>{t('fields.startDate')}:</strong> {formatDate(mission.start_time)}</Typography>
            <Typography variant="body2">
              <strong>{t('fields.endDate')}:</strong>{' '}
              {formatMissionEndDate(mission.end_time, mission.is_end_time_tba, t('fields.endDateTba'))}
            </Typography>
            <Typography variant="body2"><strong>{t('fields.requiredVolunteers')}:</strong> {mission.required_volunteers.toLocaleString('fa-IR')}</Typography>
          </Stack>

          {(mission.required_skills?.length ?? 0) > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                {t('fields.requiredSkills')}
              </Typography>
              <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
                {mission.required_skills?.map((skill) => (
                  <Chip key={skill.id} size="small" label={skill.skill_name} variant="outlined" color="primary" />
                ))}
              </Stack>
            </Box>
          )}

          {(mission.special_considerations ||
            mission.equipment_needed ||
            mission.safety_notes) && (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {mission.special_considerations && (
                <MissionInfoBlock
                  title={t('fields.specialConsiderations')}
                  text={mission.special_considerations}
                />
              )}
              {mission.equipment_needed && (
                <MissionInfoBlock title={t('fields.equipmentNeeded')} text={mission.equipment_needed} />
              )}
              {mission.safety_notes && (
                <MissionInfoBlock title={t('fields.safetyNotes')} text={mission.safety_notes} />
              )}
            </Stack>
          )}
        </GlassCard>
      ) : null}

      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('applyDialog.title')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label={t('applyDialog.message')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApplyOpen(false)}>{t('actions.cancel', { ns: 'common' })}</Button>
          <GradientButton onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
            {t('actions.submitApplication')}
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

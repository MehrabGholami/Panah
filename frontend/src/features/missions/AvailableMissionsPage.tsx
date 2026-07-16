import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
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
  Grid2 as Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard, GradientButton, StatusChip } from '@/shared/components/ui';
import type { Mission, PaginatedResponse } from '@/shared/types';
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage';
import { getMissionLocationDisplay } from '@/shared/utils/locationDisplay';
import { toPersianDigits } from '@/shared/utils/persianDigits';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR'));
}

function getApplicationBadge(
  mission: Mission,
  t: (key: string) => string,
): { label: string; status: 'submitted' | 'waitlist' | 'approved' | 'rejected' } | null {
  const status = mission.user_application_status;
  if (!status || status === 'rejected' || status === 'withdrawn') return null;
  if (status === 'submitted') return { label: t('applicationStatus.submitted'), status: 'submitted' };
  if (status === 'waitlist') return { label: t('badges.waitlisted'), status: 'waitlist' };
  if (status === 'approved') return { label: t('applicationStatus.approved'), status: 'approved' };
  return null;
}

export default function AvailableMissionsPage() {
  const { t } = useTranslation('missions');
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['missions', 'available'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<Mission>>(
        endpoints.missions.list,
        { params: { status: 'published' } },
      );
      return response;
    },
    refetchInterval: 30_000,
  });

  const missions = data?.results ?? [];

  const applyMutation = useMutation({
    mutationFn: async ({ missionId, note }: { missionId: string; note: string }) => {
      const { data } = await apiClient.post(endpoints.missions.apply(missionId), { message: note });
      return data;
    },
    onSuccess: async () => {
      setFeedback({ type: 'success', text: t('messages.applySuccess') });
      setSelectedMission(null);
      setMessage('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['missions'] }),
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
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
        <AssignmentOutlinedIcon color="primary" />
        <Typography variant="h4" fontWeight={800}>
          {t('availableTitle')}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {t('availableSubtitle')}
      </Typography>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.text}
        </Alert>
      )}
      {isError && <Alert severity="error">{t('actions.error', { ns: 'common' })}</Alert>}

      {isLoading ? (
        <Typography>{t('actions.loading', { ns: 'common' })}</Typography>
      ) : missions.length === 0 ? (
        <Alert severity="info">{t('noAvailableMissions')}</Alert>
      ) : (
        <Grid container spacing={2}>
          {missions.map((mission) => (
            <Grid key={mission.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <GlassCard sx={{ p: 2.25, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography variant="h6" fontWeight={800}>
                    {mission.title}
                  </Typography>
                  <StatusChip status={mission.priority} label={t(`priority.${mission.priority}`)} />
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, flexGrow: 1 }}>
                  {mission.description || '—'}
                </Typography>

                <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">
                      {getMissionLocationDisplay(mission)}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {t('fields.disaster')}: {mission.disaster_title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('fields.startDate')}: {formatDate(mission.start_time)}
                  </Typography>
                </Stack>

                {(mission.required_skills?.length ?? 0) > 0 && (
                  <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5} sx={{ mb: 1.5 }}>
                    {mission.required_skills?.slice(0, 3).map((skill) => (
                      <Chip key={skill.id} size="small" label={skill.skill_name} variant="outlined" />
                    ))}
                  </Stack>
                )}

                <Stack direction="row" spacing={1}>
                  <Button
                    component={RouterLink}
                    to={`/missions/available/${mission.id}`}
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    {t('actions.viewDetail')}
                  </Button>
                  {mission.allow_volunteer_applications && !mission.user_has_applied && (
                    <GradientButton size="small" fullWidth onClick={() => setSelectedMission(mission)}>
                      {t('actions.apply')}
                    </GradientButton>
                  )}
                  {(() => {
                    const badge = getApplicationBadge(mission, t);
                    if (!badge) return null;
                    return (
                      <Chip
                        size="small"
                        color={badge.status === 'approved' ? 'success' : 'default'}
                        label={badge.label}
                        sx={{ alignSelf: 'center' }}
                      />
                    );
                  })()}
                </Stack>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={Boolean(selectedMission)} onClose={() => setSelectedMission(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('applyDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedMission?.title}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label={t('applyDialog.message')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('applyDialog.messagePlaceholder')}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedMission(null)}>{t('actions.cancel', { ns: 'common' })}</Button>
          <GradientButton
            startIcon={<SendOutlinedIcon />}
            onClick={() => {
              if (!selectedMission) return;
              applyMutation.mutate({ missionId: selectedMission.id, note: message });
            }}
            disabled={applyMutation.isPending}
          >
            {applyMutation.isPending ? '...' : t('actions.submitApplication')}
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

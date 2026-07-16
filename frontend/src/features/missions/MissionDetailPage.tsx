import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard, GradientButton, StatusChip } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type { Mission, MissionApplication, PaginatedResponse } from '@/shared/types';
import { getMissionLocationDisplay } from '@/shared/utils/locationDisplay';
import { formatMissionEndDate } from '@/shared/utils/formatMissionEndDate';
import { formatSkillCategory } from '@/shared/utils/formatSkillCategory';
import { toPersianDigits } from '@/shared/utils/persianDigits';
import { MissionApplicationReviewActions } from '@/features/missions/components/MissionApplicationReviewActions';
import { CreateMissionDialog } from './CreateMissionDialog';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR'));
}

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('missions');
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('missions.create');
  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: mission, isLoading, isError } = useQuery({
    queryKey: ['missions', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Mission>(endpoints.missions.detail(id!));
      return data;
    },
    enabled: Boolean(id),
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['missions', id, 'applications'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<MissionApplication>>(
        endpoints.missions.applications(id!),
      );
      return data;
    },
    enabled: Boolean(id) && canManage,
  });

  const applications = applicationsData?.results ?? [];

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['missions', id] }),
      queryClient.invalidateQueries({ queryKey: ['missions'] }),
      queryClient.invalidateQueries({ queryKey: ['missions', id, 'applications'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
    ]);
  };

  const transitionMutation = useMutation({
    mutationFn: async (action: 'publish' | 'start' | 'complete' | 'close' | 'reopen') => {
      const map = {
        publish: endpoints.missions.publish(id!),
        start: endpoints.missions.start(id!),
        complete: endpoints.missions.complete(id!),
        close: endpoints.missions.close(id!),
        reopen: endpoints.missions.reopen(id!),
      };
      const { data } = await apiClient.post<Mission>(map[action]);
      return data;
    },
    onSuccess: async () => {
      setFeedback(t('messages.transitionSuccess'));
      await invalidate();
    },
    onError: () => setFeedback(t('messages.transitionError')),
  });

  const visibilityMutation = useMutation({
    mutationFn: async (payload: {
      is_visible_to_volunteers?: boolean;
      allow_volunteer_applications?: boolean;
    }) => {
      const { data } = await apiClient.patch<Mission>(endpoints.missions.visibility(id!), payload);
      return data;
    },
    onSuccess: async () => {
      setFeedback(t('messages.visibilityUpdated'));
      await invalidate();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      applicationId,
      action,
      reviewNote,
    }: {
      applicationId: string;
      action: 'approve' | 'waitlist' | 'reject';
      reviewNote?: string;
    }) => {
      const urlMap = {
        approve: endpoints.missions.approveApplication(id!, applicationId),
        waitlist: endpoints.missions.waitlistApplication(id!, applicationId),
        reject: endpoints.missions.rejectApplication(id!, applicationId),
      };
      const payload = reviewNote ? { review_note: reviewNote } : {};
      const { data } = await apiClient.post<MissionApplication>(urlMap[action], payload);
      return data;
    },
    onSuccess: async () => {
      setFeedback(t('messages.applicationReviewed'));
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: ['missions', 'applications', 'inbox'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    },
  });

  const actionButtons = useMemo(() => {
    if (!mission || !canManage) return [];
    switch (mission.status) {
      case 'draft':
        return [{ key: 'publish', label: t('actions.publish'), icon: <PublishOutlinedIcon /> }];
      case 'published':
        return [{ key: 'start', label: t('actions.start'), icon: <CheckCircleOutlineIcon /> }];
      case 'in_progress':
        return [{ key: 'complete', label: t('actions.complete'), icon: <CheckCircleOutlineIcon /> }];
      case 'completed':
        return [{ key: 'close', label: t('actions.close'), icon: <HighlightOffOutlinedIcon /> }];
      case 'closed':
        return [{ key: 'reopen', label: t('actions.reopen'), icon: <LockOpenOutlinedIcon /> }];
      default:
        return [];
    }
  }, [mission, canManage, t]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
        <IconButton component={RouterLink} to="/missions" aria-label={t('actions.back', { ns: 'common' })}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight={800}>
          {t('detail')}
        </Typography>
      </Stack>

      {feedback && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback}
        </Alert>
      )}
      {isError && <Alert severity="error">{t('actions.error', { ns: 'common' })}</Alert>}

      {isLoading ? (
        <Typography>{t('actions.loading', { ns: 'common' })}</Typography>
      ) : mission ? (
        <Stack spacing={2.5}>
          <GlassCard sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  {mission.title}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <StatusChip status={mission.status} label={t(`status.${mission.status}`)} />
                  <StatusChip status={mission.priority} label={t(`priority.${mission.priority}`)} />
                  {mission.is_visible_to_volunteers && (
                    <Chip size="small" label={t('badges.visible')} color="success" variant="outlined" />
                  )}
                </Stack>
              </Box>
              {canManage && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlinedIcon />}
                    onClick={() => setEditOpen(true)}
                    disabled={mission.status === 'closed'}
                  >
                    {t('actions.edit')}
                  </Button>
                  {actionButtons.map((action) => (
                    <GradientButton
                      key={action.key}
                      startIcon={action.icon}
                      onClick={() =>
                        transitionMutation.mutate(
                          action.key as 'publish' | 'start' | 'complete' | 'close' | 'reopen',
                        )
                      }
                      disabled={transitionMutation.isPending}
                    >
                      {action.label}
                    </GradientButton>
                  ))}
                </Stack>
              )}
            </Stack>

            <Box sx={{ mb: 2.5 }}>
              <SectionText
                title={t('fields.description')}
                text={mission.description?.trim() || t('empty.missionDetail')}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label={t('fields.disaster')} value={mission.disaster_title ?? '—'} />
                <InfoRow label={t('fields.location')} value={getMissionLocationDisplay(mission)} />
                <InfoRow label={t('fields.startDate')} value={formatDate(mission.start_time)} />
                <InfoRow
                  label={t('fields.endDate')}
                  value={formatMissionEndDate(mission.end_time, mission.is_end_time_tba, t('fields.endDateTba'))}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow
                  label={t('fields.requiredVolunteers')}
                  value={mission.required_volunteers.toLocaleString('fa-IR')}
                />
                <InfoRow label={t('fields.coordinator')} value={mission.coordinator_name ?? '—'} />
                <InfoRow
                  label={t('fields.assignments')}
                  value={(mission.assignments_count ?? 0).toLocaleString('fa-IR')}
                />
                <InfoRow
                  label={t('fields.applications')}
                  value={(mission.applications_count ?? 0).toLocaleString('fa-IR')}
                />
              </Grid>
            </Grid>

            {(mission.required_skills?.length ?? 0) > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  {t('fields.requiredSkills')}
                </Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
                  {mission.required_skills?.map((skill) => (
                    <Chip
                      key={skill.id}
                      size="small"
                      label={`${skill.skill_name} (${formatSkillCategory(skill.skill_category)})`}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {(mission.special_considerations ||
              mission.equipment_needed ||
              mission.safety_notes) && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Grid container spacing={2}>
                  {mission.special_considerations && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <SectionText title={t('fields.specialConsiderations')} text={mission.special_considerations} />
                    </Grid>
                  )}
                  {mission.equipment_needed && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <SectionText title={t('fields.equipmentNeeded')} text={mission.equipment_needed} />
                    </Grid>
                  )}
                  {mission.safety_notes && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <SectionText title={t('fields.safetyNotes')} text={mission.safety_notes} />
                    </Grid>
                  )}
                </Grid>
              </>
            )}
          </GlassCard>

          {canManage && mission.status !== 'closed' && (
            <GlassCard sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                {t('sections.visibility')}
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mission.is_visible_to_volunteers}
                      onChange={(e) => {
                        const visible = e.target.checked;
                        visibilityMutation.mutate({
                          is_visible_to_volunteers: visible,
                          allow_volunteer_applications: visible
                            ? mission.allow_volunteer_applications
                            : false,
                        });
                      }}
                      disabled={visibilityMutation.isPending}
                    />
                  }
                  label={t('fields.visibleToVolunteers')}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={mission.allow_volunteer_applications}
                      disabled={!mission.is_visible_to_volunteers || visibilityMutation.isPending}
                      onChange={(e) =>
                        visibilityMutation.mutate({
                          allow_volunteer_applications: e.target.checked,
                        })
                      }
                    />
                  }
                  label={t('fields.allowApplications')}
                />
              </Stack>
            </GlassCard>
          )}

          {canManage && (
            <GlassCard sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                {t('applications.title')}
              </Typography>
              <TableContainer sx={{ borderRadius: 2, border: 1, borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead sx={tableHeadSx}>
                    <TableRow>
                      <TableCell>{t('applications.volunteer')}</TableCell>
                      <TableCell>{t('applications.message')}</TableCell>
                      <TableCell>{t('table.status', { ns: 'common' })}</TableCell>
                      <TableCell>{t('applications.reviewNote')}</TableCell>
                      <TableCell align="left">{t('table.actions', { ns: 'common' })}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          {t('applications.empty')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      applications.map((application) => (
                        <TableRow key={application.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {application.volunteer_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {application.volunteer_email}
                            </Typography>
                          </TableCell>
                          <TableCell>{application.message || '—'}</TableCell>
                          <TableCell>
                            <StatusChip
                              status={
                                application.status === 'waitlist'
                                  ? 'waitlist'
                                  : application.status === 'submitted'
                                    ? 'submitted'
                                    : application.status === 'approved'
                                      ? 'approved'
                                      : 'rejected'
                              }
                              label={t(`applicationStatus.${application.status}`)}
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" color="text.secondary">
                              {application.review_note || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="left">
                            <MissionApplicationReviewActions
                              application={application}
                              compact
                              isPending={reviewMutation.isPending}
                              onReview={({ applicationId, action, reviewNote }) =>
                                reviewMutation.mutate({ applicationId, action, reviewNote })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </GlassCard>
          )}
        </Stack>
      ) : null}
      <CreateMissionDialog open={editOpen} onClose={() => setEditOpen(false)} mission={mission ?? null} />
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Typography variant="body2" sx={{ mb: 1 }}>
      <strong>{label}:</strong> {value}
    </Typography>
  );
}

function SectionText({ title, text }: { title: string; text: string }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
        height: '100%',
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
        {text}
      </Typography>
    </Box>
  );
}

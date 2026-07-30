import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard, GradientButton, StatusChip } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type {
  Assignment,
  Mission,
  MissionApplication,
  MissionCoordinatorRequest,
  PaginatedResponse,
} from '@/shared/types';
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage';
import { getMissionLocationDisplay } from '@/shared/utils/locationDisplay';
import { formatMissionEndDate } from '@/shared/utils/formatMissionEndDate';
import { formatSkillCategory } from '@/shared/utils/formatSkillCategory';
import { toPersianDigits } from '@/shared/utils/persianDigits';
import { MissionApplicationReviewActions } from '@/features/missions/components/MissionApplicationReviewActions';
import { AssignmentTasksDialog } from '@/features/assignments/components/AssignmentTasksDialog';
import { CreateMissionDialog } from './CreateMissionDialog';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR'));
}

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('missions');
  const queryClient = useQueryClient();
  const { hasPermission, hasAnyRole, hasRole } = usePermissions();
  const isAdmin = hasAnyRole(['admin']);
  const isCoordinatorOnly = hasRole('coordinator') && !isAdmin;
  // Requesting coordination ownership is a coordinator workflow — not for main admin.
  const canRequestCoordinate =
    isCoordinatorOnly && hasPermission('missions.request_coordinate');
  const canAssignCoordinator = isAdmin && hasPermission('missions.assign');
  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [coordRequestOpen, setCoordRequestOpen] = useState(false);
  const [coordRequestMessage, setCoordRequestMessage] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCoordinatorId, setAssignCoordinatorId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [coordinatorOptions, setCoordinatorOptions] = useState<
    { id: string; label: string }[]
  >([]);
  const [tasksDialogAssignment, setTasksDialogAssignment] = useState<Assignment | null>(null);

  const { data: mission, isLoading, isError } = useQuery({
    queryKey: ['missions', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Mission>(endpoints.missions.detail(id!));
      return data;
    },
    enabled: Boolean(id),
  });

  const canManage = Boolean(mission?.can_manage);
  const canManageTasks =
    isCoordinatorOnly &&
    hasPermission('assignments.manage_tasks') &&
    Boolean(mission?.is_current_user_coordinator);

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

  const { data: acceptedAssignmentsData } = useQuery({
    queryKey: ['missions', id, 'accepted-assignments'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Assignment>>(
        endpoints.assignments.list,
        { params: { mission: id } },
      );
      return data;
    },
    enabled: Boolean(id) && canManage,
  });

  const { data: coordRequestsData } = useQuery({
    queryKey: ['missions', id, 'coordinator-requests'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<MissionCoordinatorRequest>>(
        endpoints.missions.coordinatorRequests(id!),
      );
      return data;
    },
    enabled: Boolean(id) && canAssignCoordinator,
  });

  const applications = applicationsData?.results ?? [];
  const acceptedAssignments = (acceptedAssignmentsData?.results ?? []).filter(
    (item) => item.status === 'accepted' || item.status === 'checked_in',
  );
  const coordRequests = coordRequestsData?.results ?? [];

  const showRequestCoordination =
    canRequestCoordinate &&
    !mission?.is_current_user_coordinator &&
    mission?.status !== 'closed' &&
    mission?.user_coordinator_request_status !== 'submitted';

  const pendingCoordRequest = mission?.user_coordinator_request_status === 'submitted';

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['missions', id] }),
      queryClient.invalidateQueries({ queryKey: ['missions'] }),
      queryClient.invalidateQueries({ queryKey: ['missions', id, 'applications'] }),
      queryClient.invalidateQueries({ queryKey: ['missions', id, 'coordinator-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
    ]);
  };

  useEffect(() => {
    if (!assignOpen || !canAssignCoordinator) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<
          PaginatedResponse<{
            id: string;
            email: string;
            first_name?: string;
            last_name?: string;
            roles?: string[];
          }>
        >(endpoints.accounts.users, { params: { page_size: 100 } });
        if (cancelled) return;
        const options = (data.results ?? [])
          .filter((u) => (u.roles ?? []).some((r) => r === 'coordinator'))
          .map((u) => {
            const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
            return { id: u.id, label: name ? `${name} (${u.email})` : u.email };
          });
        setCoordinatorOptions(options);
      } catch {
        if (!cancelled) setCoordinatorOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignOpen, canAssignCoordinator]);

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
      setFeedback({ type: 'success', text: t('messages.transitionSuccess') });
      await invalidate();
    },
    onError: () => setFeedback({ type: 'error', text: t('messages.transitionError') }),
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
      setFeedback({ type: 'success', text: t('messages.visibilityUpdated') });
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
      setFeedback({ type: 'success', text: t('messages.applicationReviewed') });
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: ['missions', 'applications', 'inbox'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    },
  });

  const requestCoordinationMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await apiClient.post(endpoints.missions.requestCoordination(id!), {
        message,
      });
      return data;
    },
    onSuccess: async () => {
      setFeedback({ type: 'success', text: t('messages.coordinationRequestSuccess') });
      setCoordRequestOpen(false);
      setCoordRequestMessage('');
      await Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: ['notifications'] })]);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(error, t('messages.coordinationRequestError')),
      });
    },
  });

  const assignCoordinatorMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<Mission>(endpoints.missions.assignCoordinator(id!), {
        coordinator: assignCoordinatorId,
        review_note: assignNote,
      });
      return data;
    },
    onSuccess: async () => {
      setFeedback({ type: 'success', text: t('messages.coordinatorAssigned') });
      setAssignOpen(false);
      setAssignCoordinatorId('');
      setAssignNote('');
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: ['missions', 'coordinator-requests', 'inbox'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(error, t('messages.assignCoordinatorError')),
      });
    },
  });

  const reviewCoordMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
      review_note,
    }: {
      requestId: string;
      action: 'approve' | 'reject';
      review_note?: string;
    }) => {
      const url =
        action === 'approve'
          ? endpoints.missions.approveCoordinatorRequest(id!, requestId)
          : endpoints.missions.rejectCoordinatorRequest(id!, requestId);
      const { data } = await apiClient.post(url, { review_note: review_note ?? '' });
      return data;
    },
    onSuccess: async () => {
      setFeedback({ type: 'success', text: t('messages.coordinationReviewed') });
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: ['missions', 'coordinator-requests', 'inbox'] }),
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
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.text}
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
                  {mission.is_current_user_coordinator && (
                    <Chip size="small" label={t('badges.youAreCoordinator')} color="primary" variant="outlined" />
                  )}
                  {pendingCoordRequest && isCoordinatorOnly && (
                    <Chip size="small" label={t('badges.coordRequestPending')} color="warning" />
                  )}
                </Stack>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {showRequestCoordination && (
                  <Button variant="outlined" onClick={() => setCoordRequestOpen(true)}>
                    {t('actions.requestCoordination')}
                  </Button>
                )}
                {canAssignCoordinator && mission.status !== 'closed' && (
                  <Button variant="outlined" onClick={() => setAssignOpen(true)}>
                    {t('actions.assignCoordinator')}
                  </Button>
                )}
                {canManage && (
                  <>
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
                  </>
                )}
              </Stack>
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

          {canManage && (
            <GlassCard sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                {t('acceptedTeam.title')}
              </Typography>
              <TableContainer sx={{ borderRadius: 2, border: 1, borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead sx={tableHeadSx}>
                    <TableRow>
                      <TableCell>{t('acceptedTeam.volunteer')}</TableCell>
                      <TableCell>{t('table.status', { ns: 'common' })}</TableCell>
                      <TableCell>{t('acceptedTeam.tasksCount')}</TableCell>
                      <TableCell align="left">{t('table.actions', { ns: 'common' })}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {acceptedAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          {t('acceptedTeam.empty')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      acceptedAssignments.map((assignment) => (
                        <TableRow key={assignment.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {assignment.volunteer_name || '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assignment.volunteer_email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <StatusChip
                              status={assignment.status === 'checked_in' ? 'approved' : 'accepted'}
                              label={t(`assignmentStatus.${assignment.status}`, {
                                defaultValue: assignment.status,
                              })}
                            />
                          </TableCell>
                          <TableCell>
                            {toPersianDigits(String(assignment.tasks_count ?? 0))}
                          </TableCell>
                          <TableCell align="left">
                            {canManageTasks ? (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setTasksDialogAssignment(assignment)}
                              >
                                {t('acceptedTeam.manageTasks')}
                              </Button>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </GlassCard>
          )}
          {canAssignCoordinator && (
            <GlassCard sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                {t('coordination.requestsOnMission')}
              </Typography>
              <TableContainer sx={{ borderRadius: 2, border: 1, borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead sx={tableHeadSx}>
                    <TableRow>
                      <TableCell>{t('coordination.requester')}</TableCell>
                      <TableCell>{t('coordination.message')}</TableCell>
                      <TableCell>{t('table.status', { ns: 'common' })}</TableCell>
                      <TableCell align="left">{t('table.actions', { ns: 'common' })}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {coordRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          {t('coordination.empty')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      coordRequests.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {item.requester_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.requester_email}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.message || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={t(`coordinatorRequestStatus.${item.status}`)}
                              color={item.status === 'submitted' ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="left">
                            {item.status === 'submitted' && (
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  disabled={reviewCoordMutation.isPending}
                                  onClick={() =>
                                    reviewCoordMutation.mutate({
                                      requestId: item.id,
                                      action: 'approve',
                                    })
                                  }
                                >
                                  {t('coordination.approve')}
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  disabled={reviewCoordMutation.isPending}
                                  onClick={() =>
                                    reviewCoordMutation.mutate({
                                      requestId: item.id,
                                      action: 'reject',
                                    })
                                  }
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
          )}
        </Stack>
      ) : null}

      <Dialog
        open={coordRequestOpen}
        onClose={() => !requestCoordinationMutation.isPending && setCoordRequestOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('coordination.requestDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('coordination.requestDialog.subtitle')}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            {t('hints.requestCoordination')}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label={t('coordination.requestDialog.message')}
            placeholder={t('coordination.requestDialog.messagePlaceholder')}
            value={coordRequestMessage}
            onChange={(e) => setCoordRequestMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCoordRequestOpen(false)}
            disabled={requestCoordinationMutation.isPending}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <GradientButton
            disabled={requestCoordinationMutation.isPending}
            onClick={() => requestCoordinationMutation.mutate(coordRequestMessage)}
          >
            {t('actions.submitCoordinationRequest')}
          </GradientButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignOpen}
        onClose={() => !assignCoordinatorMutation.isPending && setAssignOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: 'blur(12px)',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(30,30,40,0.92)'
                : 'rgba(255,255,255,0.95)',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 0, fontWeight: 700 }}>
          {t('coordination.assignDialog.title')}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2, px: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, textAlign: 'center' }}>
            {t('coordination.assignDialog.subtitle')}
          </Typography>
          <Autocomplete
            options={coordinatorOptions}
            getOptionLabel={(option) => option.label}
            value={coordinatorOptions.find((o) => o.id === assignCoordinatorId) ?? null}
            onChange={(_e, value) => setAssignCoordinatorId(value?.id ?? '')}
            noOptionsText={coordinatorOptions.length === 0 ? 'هماهنگ‌کننده‌ای یافت نشد' : undefined}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('coordination.assignDialog.coordinator')}
                size="medium"
              />
            )}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={t('coordination.assignDialog.note')}
            value={assignNote}
            onChange={(e) => setAssignNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setAssignOpen(false)}
            disabled={assignCoordinatorMutation.isPending}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <GradientButton
            disabled={!assignCoordinatorId || assignCoordinatorMutation.isPending}
            onClick={() => assignCoordinatorMutation.mutate()}
          >
            {t('actions.assignCoordinator')}
          </GradientButton>
        </DialogActions>
      </Dialog>

      <CreateMissionDialog open={editOpen} onClose={() => setEditOpen(false)} mission={mission ?? null} />

      <AssignmentTasksDialog
        open={Boolean(tasksDialogAssignment)}
        onClose={() => setTasksDialogAssignment(null)}
        assignmentId={tasksDialogAssignment?.id ?? null}
        volunteerLabel={
          tasksDialogAssignment
            ? `${tasksDialogAssignment.volunteer_name ?? ''} ${tasksDialogAssignment.volunteer_email ?? ''}`.trim()
            : undefined
        }
        mode="manage"
      />
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

import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
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
import { GhostButton, GlassCard, GradientButton, StatusChip } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import type { FinishedMissionDetail, Report } from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';

interface FinishedMissionSummaryDialogProps {
  missionId: string | null;
  open: boolean;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR'));
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
        minWidth: 120,
        flex: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={800}>
        {value}
      </Typography>
    </Box>
  );
}

export function FinishedMissionSummaryDialog({
  missionId,
  open,
  onClose,
}: FinishedMissionSummaryDialogProps) {
  const { t } = useTranslation(['reports', 'common']);
  const queryClient = useQueryClient();
  const { hasPermission, hasAnyRole } = usePermissions();
  const canSubmit = hasPermission('reports.submit') || hasAnyRole(['admin']);
  const canReview = hasPermission('reports.view') || hasAnyRole(['admin']);
  const [createOpen, setCreateOpen] = useState(false);
  const [content, setContent] = useState('');
  const [submitAfterCreate, setSubmitAfterCreate] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'finished-mission', missionId],
    queryFn: async () => {
      const { data: response } = await apiClient.get<FinishedMissionDetail>(
        endpoints.reports.finishedMissionDetail(missionId!),
      );
      return response;
    },
    enabled: open && Boolean(missionId),
  });

  const createMutation = useMutation({
    mutationFn: async ({
      mission,
      reportContent,
      submit,
    }: {
      mission: string;
      reportContent: string;
      submit: boolean;
    }) => {
      const { data: created } = await apiClient.post<Report>(endpoints.reports.list, {
        mission,
        content: reportContent,
      });
      if (submit) {
        const { data: submitted } = await apiClient.post<Report>(
          endpoints.reports.submit(created.id),
        );
        return submitted;
      }
      return created;
    },
    onSuccess: async () => {
      setCreateOpen(false);
      setContent('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['reports', 'finished-mission', missionId] }),
        queryClient.invalidateQueries({ queryKey: ['reports', 'finished-missions'] }),
      ]);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { data: response } = await apiClient.post<Report>(endpoints.reports.submit(reportId));
      return response;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['reports', 'finished-mission', missionId] }),
      ]);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { data: response } = await apiClient.post<Report>(endpoints.reports.review(reportId));
      return response;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['reports', 'finished-mission', missionId] }),
      ]);
    },
  });

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: 'min(92vh, 900px)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pr: 6, position: 'relative' }}>
          {t('summary.title')}
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', left: 12, top: 12 }}
            aria-label="بستن"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ overflowY: 'auto' }}>
          {isLoading && <Typography>{t('actions.loading', { ns: 'common' })}</Typography>}
          {isError && (
            <Typography color="error">{t('actions.error', { ns: 'common' })}</Typography>
          )}
          {data && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {data.title}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  <StatusChip
                    status={data.status === 'completed' ? 'completed' : 'closed'}
                    label={t(`status.${data.status}`)}
                  />
                  <Chip
                    size="small"
                    label={t(`priority.${data.priority}`, { defaultValue: data.priority })}
                    variant="outlined"
                  />
                  {data.disaster_title && (
                    <Chip size="small" label={data.disaster_title} variant="outlined" />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {data.location_display || '—'} · {data.coordinator_name || '—'}
                </Typography>
                {data.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.5, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                  >
                    {data.description}
                  </Typography>
                )}
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <MiniStat
                  label={t('table.applications')}
                  value={toPersianDigits(
                    `${data.applications_approved}/${data.applications_total}`,
                  )}
                />
                <MiniStat
                  label={t('table.assignments')}
                  value={toPersianDigits(
                    `${data.assignments_completed}/${data.assignments_total}`,
                  )}
                />
                <MiniStat
                  label={t('table.reports')}
                  value={toPersianDigits(data.reports_total)}
                />
                <MiniStat
                  label={t('table.volunteers')}
                  value={toPersianDigits(data.required_volunteers)}
                />
              </Stack>

              <GlassCard sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <GroupsOutlinedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={800}>
                    {t('summary.applications')}
                  </Typography>
                </Stack>
                {(data.applications?.length ?? 0) === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('summary.emptyApps')}
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>داوطلب</TableCell>
                        <TableCell>وضعیت</TableCell>
                        <TableCell>تاریخ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.applications?.slice(0, 8).map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {app.volunteer_name || app.volunteer_email}
                            </Typography>
                          </TableCell>
                          <TableCell>{app.status}</TableCell>
                          <TableCell>{formatDate(app.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </GlassCard>

              <GlassCard sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <AssignmentOutlinedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={800}>
                    {t('summary.assignments')}
                  </Typography>
                </Stack>
                {(data.assignments?.length ?? 0) === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('summary.emptyAssignments')}
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>داوطلب</TableCell>
                        <TableCell>وضعیت</TableCell>
                        <TableCell>تاریخ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.assignments?.slice(0, 8).map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {assignment.volunteer_name || assignment.volunteer_email}
                            </Typography>
                          </TableCell>
                          <TableCell>{assignment.status}</TableCell>
                          <TableCell>{formatDate(assignment.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </GlassCard>

              <GlassCard sx={{ p: 2 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  justifyContent="space-between"
                  spacing={1.5}
                  sx={{ mb: 1.5 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <DescriptionOutlinedIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={800}>
                      {t('summary.reports')}
                    </Typography>
                  </Stack>
                  {canSubmit && (
                    <GradientButton size="small" onClick={() => setCreateOpen(true)}>
                      {t('actions.createReport')}
                    </GradientButton>
                  )}
                </Stack>
                {(data.reports?.length ?? 0) === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('summary.emptyReports')}
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {data.reports?.map((report) => (
                      <Box
                        key={report.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          spacing={1}
                          sx={{ mb: 1 }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {report.author_name || report.author_email || '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(report.created_at)}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <StatusChip
                              status={report.status}
                              label={t(`status.${report.status}`)}
                            />
                            {report.status === 'draft' && canSubmit && (
                              <Button
                                size="small"
                                onClick={() => submitMutation.mutate(report.id)}
                                disabled={submitMutation.isPending}
                              >
                                {t('actions.submitReport')}
                              </Button>
                            )}
                            {report.status === 'submitted' && canReview && (
                              <Button
                                size="small"
                                color="success"
                                onClick={() => reviewMutation.mutate(report.id)}
                                disabled={reviewMutation.isPending}
                              >
                                {t('actions.reviewReport')}
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                        >
                          {report.content}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </GlassCard>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {data && (
            <Button
              component={RouterLink}
              to={`/missions/${data.id}`}
              onClick={onClose}
              sx={{ fontWeight: 700 }}
            >
              {t('actions.openMission')}
            </Button>
          )}
          <GhostButton onClick={onClose}>{t('actions.cancel', { ns: 'common' })}</GhostButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={createOpen}
        onClose={() => !createMutation.isPending && setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{t('createDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('summary.createPrompt')}
          </Typography>
          <TextField
            label={t('createDialog.content')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            minRows={6}
            fullWidth
            placeholder={t('createDialog.contentPlaceholder')}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <GhostButton onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
            {t('actions.cancel', { ns: 'common' })}
          </GhostButton>
          <Button
            variant="outlined"
            disabled={!content.trim() || createMutation.isPending || !missionId}
            onClick={() => {
              setSubmitAfterCreate(false);
              createMutation.mutate({
                mission: missionId!,
                reportContent: content.trim(),
                submit: false,
              });
            }}
          >
            {t('createDialog.submit')}
          </Button>
          <GradientButton
            disabled={!content.trim() || createMutation.isPending || !missionId}
            onClick={() => {
              setSubmitAfterCreate(true);
              createMutation.mutate({
                mission: missionId!,
                reportContent: content.trim(),
                submit: true,
              });
            }}
          >
            {createMutation.isPending && submitAfterCreate
              ? '...'
              : t('createDialog.saveAndSubmit')}
          </GradientButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

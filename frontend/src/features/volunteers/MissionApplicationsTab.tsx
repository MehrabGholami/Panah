import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Alert,
  Box,
  Link,
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
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { MissionApplicationDetailDialog } from '@/features/volunteers/components/MissionApplicationDetailDialog';
import { MissionApplicationReviewActions } from '@/features/missions/components/MissionApplicationReviewActions';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/pagination';
import {
  GhostButton,
  GlassCard,
  GradientButton,
  StatusChip,
  TablePagination,
  UserAvatar,
} from '@/shared/components/ui';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type { MissionApplication, PaginatedResponse } from '@/shared/types';
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage';
import { toPersianDigits } from '@/shared/utils/persianDigits';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR'));
}

export function MissionApplicationsTab() {
  const { t } = useTranslation(['volunteers', 'missions', 'common']);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<MissionApplication | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['missions', 'applications', 'inbox', page, appliedSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        page_size: DEFAULT_PAGE_SIZE,
      };
      if (appliedSearch.trim()) params.search = appliedSearch.trim();
      const { data: response } = await apiClient.get<PaginatedResponse<MissionApplication>>(
        endpoints.missions.applicationsInbox,
        { params },
      );
      return response;
    },
    refetchInterval: 30_000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      missionId,
      applicationId,
      action,
      reviewNote,
    }: {
      missionId: string;
      applicationId: string;
      action: 'approve' | 'waitlist' | 'reject';
      reviewNote?: string;
    }) => {
      const urlMap = {
        approve: endpoints.missions.approveApplication(missionId, applicationId),
        waitlist: endpoints.missions.waitlistApplication(missionId, applicationId),
        reject: endpoints.missions.rejectApplication(missionId, applicationId),
      };
      const payload = reviewNote ? { review_note: reviewNote } : {};
      const { data: result } = await apiClient.post<MissionApplication>(urlMap[action], payload);
      return result;
    },
    onSuccess: async () => {
      setReviewError(null);
      setSelectedApplication(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['missions', 'applications', 'inbox'] }),
        queryClient.invalidateQueries({ queryKey: ['missions'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    },
    onError: (mutationError) => {
      setReviewError(
        getApiErrorMessage(mutationError, t('actions.error', { ns: 'common' })),
      );
    },
  });

  const applications = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const handleReview = ({
    applicationId,
    action,
    reviewNote,
  }: {
    applicationId: string;
    action: 'approve' | 'waitlist' | 'reject';
    reviewNote?: string;
  }) => {
    const application = applications.find((item) => item.id === applicationId);
    if (!application) return;
    reviewMutation.mutate({
      missionId: application.mission,
      applicationId,
      action,
      reviewNote,
    });
  };

  const applySearch = () => setAppliedSearch(draftSearch.trim());
  const clearSearch = () => {
    setDraftSearch('');
    setAppliedSearch('');
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <AssignmentOutlinedIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={800}>
          {t('missionApplications.title')}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('missionApplications.subtitle')}
      </Typography>

      {isError && <Alert severity="error">{t('actions.error', { ns: 'common' })}</Alert>}
      {reviewError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setReviewError(null)}>
          {reviewError}
        </Alert>
      )}

      <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            px: { xs: 2, md: 2.5 },
            pt: 2,
            pb: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(15, 23, 42, 0.28)'
                : 'rgba(248, 250, 252, 0.9)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              size="small"
              fullWidth
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
              label={t('missionApplications.search')}
              placeholder={t('missionApplications.searchPlaceholder')}
              sx={{
                flex: 1,
                minWidth: 0,
                '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' },
              }}
            />
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <GradientButton
                startIcon={<SearchOutlinedIcon />}
                onClick={applySearch}
                sx={{ height: 40, minWidth: 112, borderRadius: 2 }}
              >
                {t('actions.search', { ns: 'common' })}
              </GradientButton>
              <GhostButton
                startIcon={<ClearOutlinedIcon />}
                onClick={clearSearch}
                disabled={!draftSearch && !appliedSearch}
                sx={{ height: 40, minWidth: 112, borderRadius: 2 }}
              >
                پاک کردن
              </GhostButton>
            </Stack>
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell width={56} />
                <TableCell>{t('missionApplications.volunteer')}</TableCell>
                <TableCell>{t('missionApplications.mission')}</TableCell>
                <TableCell width={120}>{t('missionApplications.date')}</TableCell>
                <TableCell width={140}>{t('table.status', { ns: 'common' })}</TableCell>
                <TableCell width={140} align="left">
                  {t('table.actions', { ns: 'common' })}
                </TableCell>
                <TableCell width={40} />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    {t('actions.loading', { ns: 'common' })}
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    {appliedSearch
                      ? t('missionApplications.emptySearch')
                      : t('missionApplications.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <TableRow
                    key={application.id}
                    hover
                    onClick={() => setSelectedApplication(application)}
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell>
                      <UserAvatar
                        name={application.volunteer_name || application.volunteer_email || '?'}
                        sx={{ width: 40, height: 40 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {application.volunteer_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {application.volunteer_email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Link
                        component={RouterLink}
                        to={`/missions/${application.mission}`}
                        underline="hover"
                        fontWeight={600}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {application.mission_title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(application.created_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={
                          application.status === 'waitlist'
                            ? 'pending'
                            : application.status === 'submitted'
                              ? 'submitted'
                              : application.status
                        }
                        label={t(`applicationStatus.${application.status}`, { ns: 'missions' })}
                      />
                    </TableCell>
                    <TableCell align="left">
                      <MissionApplicationReviewActions
                        application={application}
                        iconOnly
                        isPending={reviewMutation.isPending}
                        onReview={handleReview}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.disabled' }}>
                      <ChevronLeftIcon fontSize="small" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ px: { xs: 2, md: 2.5 }, pb: { xs: 2, md: 2.5 } }}>
          <TablePagination
            page={page}
            totalCount={totalCount}
            onPageChange={setPage}
            disabled={isFetching}
          />
        </Box>
      </GlassCard>

      <MissionApplicationDetailDialog
        application={selectedApplication}
        open={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        isReviewPending={reviewMutation.isPending}
        onReview={handleReview}
      />
    </Box>
  );
}

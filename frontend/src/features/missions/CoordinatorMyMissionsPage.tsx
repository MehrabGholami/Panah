import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CrisisAlertOutlinedIcon from '@mui/icons-material/CrisisAlertOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HourglassTopOutlinedIcon from '@mui/icons-material/HourglassTopOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/pagination';
import { GlassCard, StatusChip, TablePagination } from '@/shared/components/ui';
import type { Mission, MissionStatus, PaginatedResponse } from '@/shared/types';
import { getMissionLocationDisplay } from '@/shared/utils/locationDisplay';
import { toPersianDigits } from '@/shared/utils/persianDigits';

const STATUS_OPTIONS: MissionStatus[] = [
  'draft',
  'published',
  'in_progress',
  'completed',
  'closed',
];

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <GlassCard sx={{ p: 2.25, height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {value.toLocaleString('fa-IR')}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: accent,
            color: 'primary.main',
          }}
        >
          {icon}
        </Box>
      </Stack>
    </GlassCard>
  );
}

export default function CoordinatorMyMissionsPage() {
  const { t } = useTranslation(['missions', 'common']);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, appliedSearch]);

  const listParams = useMemo(
    () => ({
      page,
      page_size: DEFAULT_PAGE_SIZE,
      mine: true,
      ordering: '-updated_at',
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(appliedSearch.trim() ? { search: appliedSearch.trim() } : {}),
    }),
    [page, statusFilter, appliedSearch],
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['missions', 'mine', listParams],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<Mission>>(
        endpoints.missions.list,
        { params: listParams },
      );
      return response;
    },
    refetchInterval: 20_000,
  });

  const countQueries = useQueries({
    queries: [
      {
        queryKey: ['missions', 'mine', 'count', 'all'],
        queryFn: async () => {
          const { data: response } = await apiClient.get<PaginatedResponse<Mission>>(
            endpoints.missions.list,
            { params: { mine: true, page_size: 1 } },
          );
          return response.count;
        },
      },
      {
        queryKey: ['missions', 'mine', 'count', 'published'],
        queryFn: async () => {
          const { data: response } = await apiClient.get<PaginatedResponse<Mission>>(
            endpoints.missions.list,
            { params: { mine: true, status: 'published', page_size: 1 } },
          );
          return response.count;
        },
      },
      {
        queryKey: ['missions', 'mine', 'count', 'in_progress'],
        queryFn: async () => {
          const { data: response } = await apiClient.get<PaginatedResponse<Mission>>(
            endpoints.missions.list,
            { params: { mine: true, status: 'in_progress', page_size: 1 } },
          );
          return response.count;
        },
      },
      {
        queryKey: ['missions', 'mine', 'count', 'visible'],
        queryFn: async () => {
          const { data: response } = await apiClient.get<PaginatedResponse<Mission>>(
            endpoints.missions.list,
            { params: { mine: true, is_visible_to_volunteers: true, page_size: 1 } },
          );
          return response.count;
        },
      },
    ],
  });

  const missions = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pendingApplicationsOnPage = missions.reduce(
    (sum, mission) => sum + (mission.pending_applications_count ?? 0),
    0,
  );

  const stats = {
    total: countQueries[0]?.data ?? 0,
    published: countQueries[1]?.data ?? 0,
    inProgress: countQueries[2]?.data ?? 0,
    visible: countQueries[3]?.data ?? 0,
  };

  const applySearch = () => setAppliedSearch(search.trim());
  const clearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <AssignmentIndOutlinedIcon color="primary" />
            <Typography variant="h4" fontWeight={800}>
              {t('myMissionsTitle')}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('myMissionsSubtitle')}
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/missions"
          variant="outlined"
          startIcon={<AssignmentOutlinedIcon />}
          sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, fontWeight: 700 }}
        >
          {t('myMissionsBrowseAll')}
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title={t('myMissionsStats.total')}
            value={stats.total}
            icon={<AssignmentOutlinedIcon fontSize="small" />}
            accent="rgba(34, 211, 238, 0.12)"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title={t('myMissionsStats.published')}
            value={stats.published}
            icon={<CrisisAlertOutlinedIcon fontSize="small" />}
            accent="rgba(56, 189, 248, 0.12)"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title={t('myMissionsStats.inProgress')}
            value={stats.inProgress}
            icon={<GroupsOutlinedIcon fontSize="small" />}
            accent="rgba(99, 102, 241, 0.14)"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title={t('myMissionsStats.visible')}
            value={stats.visible}
            icon={<VisibilityOutlinedIcon fontSize="small" />}
            accent="rgba(16, 185, 129, 0.12)"
          />
        </Box>
      </Stack>

      {pendingApplicationsOnPage > 0 && (
        <Alert
          severity="info"
          icon={<HourglassTopOutlinedIcon />}
          sx={{ mb: 2 }}
          action={
            <Button component={RouterLink} to="/volunteers" color="inherit" size="small" sx={{ fontWeight: 700 }}>
              {t('myMissionsReviewApplications')}
            </Button>
          }
        >
          {t('myMissionsPendingHint', {
            count: toPersianDigits(pendingApplicationsOnPage),
          })}
        </Alert>
      )}

      {isError && <Alert severity="error">{t('actions.error', { ns: 'common' })}</Alert>}

      <GlassCard sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.25}
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexWrap="wrap"
          useFlexGap
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) =>
              alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.04 : 0.03),
          }}
        >
          <TextField
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch();
            }}
            label={t('myMissionsSearch')}
            placeholder={t('myMissionsSearchPlaceholder')}
            sx={{ flex: '1 1 220px', minWidth: 0 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="primary" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label={t('filters.status')}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ flex: '0 0 auto', minWidth: 160 }}
          >
            <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {t(`status.${status}`)}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1} sx={{ flex: '0 0 auto' }}>
            <Button variant="contained" onClick={applySearch} sx={{ fontWeight: 700, px: 2.25 }}>
              {t('actions.search', { ns: 'common' })}
            </Button>
            <Button variant="text" onClick={clearFilters} sx={{ fontWeight: 700 }}>
              {t('actions.clear', { ns: 'common' })}
            </Button>
          </Stack>
        </Stack>

        <TableContainer
          sx={{
            borderRadius: 2.5,
            border: 1,
            borderColor: 'divider',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Table
            size="small"
            sx={{ minWidth: { xs: 640, md: 860 }, tableLayout: 'fixed' }}
          >
            <TableHead
              sx={{
                '& .MuiTableCell-root': {
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  letterSpacing: '0.01em',
                  color: 'text.primary',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(34, 211, 238, 0.1)'
                      : 'rgba(34, 211, 238, 0.08)',
                  borderBottom: '2px solid',
                  borderColor: 'rgba(34, 211, 238, 0.28)',
                  py: 1.75,
                  px: 1.75,
                  whiteSpace: 'nowrap',
                  lineHeight: 1.3,
                  verticalAlign: 'middle',
                },
              }}
            >
              <TableRow>
                <TableCell sx={{ width: '24%' }}>{t('myMissionsColumns.title')}</TableCell>
                <TableCell sx={{ width: '14%' }}>{t('myMissionsColumns.disaster')}</TableCell>
                <TableCell sx={{ width: '16%' }}>{t('myMissionsColumns.location')}</TableCell>
                <TableCell sx={{ width: '10%' }} align="center">
                  {t('myMissionsColumns.priority')}
                </TableCell>
                <TableCell sx={{ width: '11%' }} align="center">
                  {t('myMissionsColumns.status')}
                </TableCell>
                <TableCell sx={{ width: '8%' }} align="center">
                  <Tooltip title={t('myMissionsColumns.teamHint')}>
                    <Box component="span" sx={{ cursor: 'help' }}>
                      {t('myMissionsColumns.team')}
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ width: '8%' }} align="center">
                  {t('myMissionsColumns.apps')}
                </TableCell>
                <TableCell sx={{ width: '8%' }} align="center">
                  {t('myMissionsColumns.visibility')}
                </TableCell>
                <TableCell sx={{ width: '6%' }} align="center">
                  {t('myMissionsColumns.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    {t('actions.loading', { ns: 'common' })}
                  </TableCell>
                </TableRow>
              ) : missions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <Stack alignItems="center" spacing={1}>
                      <AssignmentIndOutlinedIcon color="disabled" sx={{ fontSize: 36 }} />
                      <Typography color="text.secondary" fontWeight={700}>
                        {t('myMissionsEmpty')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('myMissionsEmptyHint')}
                      </Typography>
                      <Button component={RouterLink} to="/missions" size="small" sx={{ mt: 0.5 }}>
                        {t('myMissionsBrowseAll')}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                missions.map((mission) => {
                  const pending = mission.pending_applications_count ?? 0;
                  const assigned = mission.assignments_count ?? 0;
                  const needed = mission.required_volunteers ?? 0;
                  const appsLabel =
                    pending > 0
                      ? `${toPersianDigits(mission.applications_count ?? 0)} (${toPersianDigits(pending)} ${t('badges.pending')})`
                      : toPersianDigits(mission.applications_count ?? 0);

                  return (
                    <TableRow key={mission.id} hover sx={{ '& td': { py: 1.25, verticalAlign: 'middle' } }}>
                      <TableCell>
                        <Typography
                          component={RouterLink}
                          to={`/missions/${mission.id}`}
                          variant="body2"
                          fontWeight={800}
                          noWrap
                          title={mission.title}
                          sx={{
                            display: 'block',
                            color: 'primary.main',
                            textDecoration: 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {mission.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap title={mission.disaster_title ?? undefined}>
                          {mission.disaster_title ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          noWrap
                          title={getMissionLocationDisplay(mission) || undefined}
                        >
                          {getMissionLocationDisplay(mission) || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <StatusChip
                          status={mission.priority}
                          label={t(`priority.${mission.priority}`)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <StatusChip status={mission.status} label={t(`status.${mission.status}`)} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('myMissionsColumns.teamHint')}>
                          <Typography variant="body2" fontWeight={800} noWrap dir="ltr">
                            {toPersianDigits(`${assigned}/${needed}`)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={appsLabel}>
                          <Chip
                            size="small"
                            color={pending > 0 ? 'warning' : 'default'}
                            label={toPersianDigits(mission.applications_count ?? 0)}
                            sx={{ fontWeight: 700, minWidth: 36 }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip
                          title={
                            mission.is_visible_to_volunteers
                              ? mission.allow_volunteer_applications
                                ? `${t('badges.visible')} · ${t('badges.applications')}`
                                : t('badges.visible')
                              : t('badges.hidden')
                          }
                        >
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 1.5,
                              color: mission.is_visible_to_volunteers ? 'success.main' : 'text.disabled',
                              bgcolor: (theme) =>
                                mission.is_visible_to_volunteers
                                  ? alpha(theme.palette.success.main, 0.12)
                                  : alpha(theme.palette.text.primary, 0.04),
                            }}
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('myMissionsOpenDetail')}>
                          <IconButton
                            component={RouterLink}
                            to={`/missions/${mission.id}`}
                            size="small"
                            color="primary"
                          >
                            <OpenInNewRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          page={page}
          totalCount={totalCount}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
          disabled={isFetching}
        />
      </GlassCard>
    </Box>
  );
}

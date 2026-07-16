import AddIcon from '@mui/icons-material/Add';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CrisisAlertOutlinedIcon from '@mui/icons-material/CrisisAlertOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/pagination';
import { GlassCard, StatusChip, TablePagination } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type { Disaster, Mission, PaginatedResponse } from '@/shared/types';
import { getMissionLocationDisplay } from '@/shared/utils/locationDisplay';
import { CreateMissionDialog } from './CreateMissionDialog';

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

export default function MissionsPage() {
  const { t } = useTranslation('missions');
  const { hasPermission, hasRole, hasAnyRole } = usePermissions();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const canCreate = hasPermission('missions.create');
  const isCoordinatorOnly = hasRole('coordinator') && !hasAnyRole(['admin']);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [disasterFilter, setDisasterFilter] = useState<Disaster | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(() => searchParams.get('status') ?? '');
  const [mineOnly, setMineOnly] = useState<boolean>(() => {
    const mineParam = searchParams.get('mine');
    if (mineParam === 'false' || mineParam === '0') return false;
    if (mineParam === 'true' || mineParam === '1') return true;
    return isCoordinatorOnly;
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [disasterFilter?.id, statusFilter, mineOnly]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (mineOnly) next.set('mine', 'true');
    else next.delete('mine');
    if (statusFilter) next.set('status', statusFilter);
    else next.delete('status');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync filters to URL only when they change
  }, [mineOnly, statusFilter]);

  const listParams = useMemo(
    () => ({
      page,
      page_size: DEFAULT_PAGE_SIZE,
      ...(disasterFilter ? { disaster: disasterFilter.id } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(mineOnly ? { mine: true } : {}),
    }),
    [page, disasterFilter, statusFilter, mineOnly],
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['missions', 'list', listParams],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<Mission>>(
        endpoints.missions.list,
        { params: listParams },
      );
      return response;
    },
    refetchInterval: 20_000,
  });

  const visibilityMutation = useMutation({
    mutationFn: async ({
      id,
      is_visible_to_volunteers,
      allow_volunteer_applications,
    }: {
      id: string;
      is_visible_to_volunteers: boolean;
      allow_volunteer_applications?: boolean;
    }) => {
      const { data } = await apiClient.patch<Mission>(endpoints.missions.visibility(id), {
        is_visible_to_volunteers,
        ...(allow_volunteer_applications !== undefined
          ? { allow_volunteer_applications }
          : {}),
      });
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  const { data: disastersData } = useQuery({
    queryKey: ['disasters', 'options'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Disaster>>(endpoints.disasters.list, {
        params: { page_size: 100 },
      });
      return data;
    },
  });

  const mineParam = mineOnly ? { mine: true } : {};

  const missionStatsQueries = useQueries({
    queries: [
      {
        queryKey: ['missions', 'count', 'published', disasterFilter?.id, mineOnly],
        queryFn: async () => {
          const { data: response } = await apiClient.get<PaginatedResponse<Mission>>(
            endpoints.missions.list,
            {
              params: {
                status: 'published',
                page_size: 1,
                ...(disasterFilter ? { disaster: disasterFilter.id } : {}),
                ...mineParam,
              },
            },
          );
          return response.count;
        },
      },
      {
        queryKey: ['missions', 'count', 'in_progress', disasterFilter?.id, mineOnly],
        queryFn: async () => {
          const { data: response } = await apiClient.get<PaginatedResponse<Mission>>(
            endpoints.missions.list,
            {
              params: {
                status: 'in_progress',
                page_size: 1,
                ...(disasterFilter ? { disaster: disasterFilter.id } : {}),
                ...mineParam,
              },
            },
          );
          return response.count;
        },
      },
      {
        queryKey: ['missions', 'count', 'visible', disasterFilter?.id, mineOnly],
        queryFn: async () => {
          const { data: response } = await apiClient.get<PaginatedResponse<Mission>>(
            endpoints.missions.list,
            {
              params: {
                is_visible_to_volunteers: true,
                page_size: 1,
                ...(disasterFilter ? { disaster: disasterFilter.id } : {}),
                ...mineParam,
              },
            },
          );
          return response.count;
        },
      },
    ],
  });

  const missions = data?.results ?? [];
  const disasters = disastersData?.results ?? [];
  const totalCount = data?.count ?? 0;

  const stats = useMemo(
    () => ({
      total: totalCount,
      published: missionStatsQueries[0]?.data ?? 0,
      inProgress: missionStatsQueries[1]?.data ?? 0,
      visible: missionStatsQueries[2]?.data ?? 0,
    }),
    [totalCount, missionStatsQueries],
  );

  const openCreate = () => {
    setEditingMission(null);
    setDialogOpen(true);
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
            <AssignmentOutlinedIcon color="primary" />
            <Typography variant="h4" fontWeight={800}>
              {t('title')}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('managementSubtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}>
            {t('create')}
          </Button>
        )}
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <Box sx={{ flex: 1 }}>
          <StatCard title={t('stats.total')} value={stats.total} icon={<AssignmentOutlinedIcon fontSize="small" />} accent="rgba(34, 211, 238, 0.12)" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard title={t('stats.published')} value={stats.published} icon={<CrisisAlertOutlinedIcon fontSize="small" />} accent="rgba(56, 189, 248, 0.12)" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard title={t('stats.inProgress')} value={stats.inProgress} icon={<GroupsOutlinedIcon fontSize="small" />} accent="rgba(99, 102, 241, 0.12)" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard title={t('stats.visible')} value={stats.visible} icon={<VisibilityOutlinedIcon fontSize="small" />} accent="rgba(16, 185, 129, 0.12)" />
        </Box>
      </Stack>

      {isError && <Alert severity="error">{t('actions.error', { ns: 'common' })}</Alert>}

      <GlassCard sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems={{ md: 'center' }}>
          <Autocomplete
            sx={{ flex: 1 }}
            options={disasters}
            value={disasterFilter}
            onChange={(_, value) => setDisasterFilter(value)}
            getOptionLabel={(option) => option.title}
            renderInput={(params) => (
              <TextField {...params} label={t('filters.disaster')} size="small" />
            )}
          />
          <TextField
            select
            sx={{ minWidth: { md: 200 } }}
            label={t('filters.status')}
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
            {(['draft', 'published', 'in_progress', 'completed', 'closed'] as const).map((status) => (
              <MenuItem key={status} value={status}>
                {t(`status.${status}`)}
              </MenuItem>
            ))}
          </TextField>
          {(isCoordinatorOnly || hasAnyRole(['admin', 'coordinator'])) && (
            <FormControlLabel
              sx={{ m: 0, whiteSpace: 'nowrap' }}
              control={
                <Switch
                  checked={mineOnly}
                  onChange={(e) => setMineOnly(e.target.checked)}
                  size="small"
                />
              }
              label={t('filters.mineOnly')}
            />
          )}
        </Stack>

        <TableContainer sx={{ borderRadius: 2.5, border: 1, borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>{t('fields.title')}</TableCell>
                <TableCell>{t('fields.disaster')}</TableCell>
                <TableCell>{t('fields.location')}</TableCell>
                <TableCell>{t('fields.priority')}</TableCell>
                <TableCell>{t('table.status', { ns: 'common' })}</TableCell>
                <TableCell>{t('fields.requiredVolunteers')}</TableCell>
                <TableCell>{t('fields.visibility')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    {t('actions.loading', { ns: 'common' })}
                  </TableCell>
                </TableRow>
              ) : missions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Stack alignItems="center" spacing={1}>
                      <FilterListOutlinedIcon color="disabled" />
                      <Typography color="text.secondary">{t('noMissions')}</Typography>
                      {canCreate && (
                        <Button size="small" onClick={openCreate}>
                          {t('create')}
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                missions.map((mission) => (
                  <TableRow
                    key={mission.id}
                    hover
                    component={RouterLink}
                    to={`/missions/${mission.id}`}
                    sx={{ textDecoration: 'none', cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {mission.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{mission.disaster_title ?? '—'}</TableCell>
                    <TableCell>{getMissionLocationDisplay(mission)}</TableCell>
                    <TableCell>
                      <StatusChip status={mission.priority} label={t(`priority.${mission.priority}`)} />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={mission.status} label={t(`status.${mission.status}`)} />
                    </TableCell>
                    <TableCell>{mission.required_volunteers.toLocaleString('fa-IR')}</TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      {canCreate && mission.status !== 'closed' ? (
                        <Stack spacing={0.75} alignItems="flex-start">
                          <Tooltip title={t('hints.visibility')}>
                            <FormControlLabel
                              sx={{ m: 0 }}
                              control={
                                <Switch
                                  size="small"
                                  checked={mission.is_visible_to_volunteers}
                                  disabled={visibilityMutation.isPending}
                                  onChange={(event) => {
                                    const visible = event.target.checked;
                                    visibilityMutation.mutate({
                                      id: mission.id,
                                      is_visible_to_volunteers: visible,
                                      allow_volunteer_applications: visible
                                        ? mission.allow_volunteer_applications
                                        : false,
                                    });
                                  }}
                                />
                              }
                              label={
                                <Typography variant="caption" fontWeight={700}>
                                  {t('fields.visibleToVolunteers')}
                                </Typography>
                              }
                            />
                          </Tooltip>
                          {mission.is_visible_to_volunteers && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {mission.allow_volunteer_applications && (
                                <Chip
                                  size="small"
                                  label={t('badges.applications')}
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                              {(mission.pending_applications_count ?? 0) > 0 && (
                                <Chip
                                  size="small"
                                  label={`${(mission.pending_applications_count ?? 0).toLocaleString('fa-IR')} ${t('badges.pending')}`}
                                  color="warning"
                                />
                              )}
                            </Stack>
                          )}
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {mission.is_visible_to_volunteers ? (
                            <Chip size="small" label={t('badges.visible')} color="success" variant="outlined" />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                          {mission.allow_volunteer_applications && (
                            <Chip size="small" label={t('badges.applications')} color="primary" variant="outlined" />
                          )}
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          page={page}
          totalCount={totalCount}
          onPageChange={setPage}
          disabled={isFetching}
        />
      </GlassCard>

      <CreateMissionDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingMission(null);
        }}
        mission={editingMission}
      />
    </Box>
  );
}

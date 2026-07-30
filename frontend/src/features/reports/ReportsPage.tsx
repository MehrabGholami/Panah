import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  Tab,
  Tabs,
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
import { Link as RouterLink } from 'react-router-dom';
import { FinishedMissionSummaryDialog } from '@/features/reports/FinishedMissionSummaryDialog';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/pagination';
import {
  ExportCsvDialog,
  GhostButton,
  GlassCard,
  GradientButton,
  StatusChip,
  TablePagination,
} from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type {
  FinishedMissionSummary,
  PaginatedResponse,
  Report,
} from '@/shared/types';
import type { CsvColumn } from '@/shared/utils/csvExport';
import { toPersianDigits } from '@/shared/utils/persianDigits';

type ReportsTab = 'finished' | 'narrative';

type FinishedFilters = {
  search: string;
  status: string;
};

const emptyFilters: FinishedFilters = { search: '', status: '' };

function formatDate(value?: string | null) {
  if (!value) return '—';
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR'));
}

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <GlassCard sx={{ p: 2, height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {value}
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

export default function ReportsPage() {
  const { t } = useTranslation(['reports', 'common']);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [tab, setTab] = useState<ReportsTab>('finished');
  const [page, setPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const [draftFilters, setDraftFilters] = useState<FinishedFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FinishedFilters>(emptyFilters);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  const finishedParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      page_size: DEFAULT_PAGE_SIZE,
    };
    if (appliedFilters.search.trim()) params.search = appliedFilters.search.trim();
    if (appliedFilters.status) params.status = appliedFilters.status;
    return params;
  }, [appliedFilters, page]);

  const {
    data: finishedData,
    isLoading: finishedLoading,
    isError: finishedError,
    isFetching: finishedFetching,
  } = useQuery({
    queryKey: ['reports', 'finished-missions', finishedParams],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<FinishedMissionSummary>>(
        endpoints.reports.finishedMissions,
        { params: finishedParams },
      );
      return data;
    },
    enabled: tab === 'finished',
  });

  const { data: completedCount } = useQuery({
    queryKey: ['reports', 'finished-missions', 'count', 'completed'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<FinishedMissionSummary>>(
        endpoints.reports.finishedMissions,
        { params: { status: 'completed', page_size: 1 } },
      );
      return data.count;
    },
  });

  const { data: closedCount } = useQuery({
    queryKey: ['reports', 'finished-missions', 'count', 'closed'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<FinishedMissionSummary>>(
        endpoints.reports.finishedMissions,
        { params: { status: 'closed', page_size: 1 } },
      );
      return data.count;
    },
  });

  const {
    data: reportsData,
    isLoading: reportsLoading,
    isError: reportsError,
    isFetching: reportsFetching,
  } = useQuery({
    queryKey: ['reports', 'list', reportsPage],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Report>>(endpoints.reports.list, {
        params: { page: reportsPage, page_size: DEFAULT_PAGE_SIZE },
      });
      return data;
    },
    enabled: tab === 'narrative',
  });

  const submitMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { data } = await apiClient.post<Report>(endpoints.reports.submit(reportId));
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { data } = await apiClient.post<Report>(endpoints.reports.review(reportId));
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const finishedMissions = finishedData?.results ?? [];
  const finishedTotal = finishedData?.count ?? 0;
  const reports = reportsData?.results ?? [];
  const reportsTotal = reportsData?.count ?? 0;
  const withReportCount = finishedMissions.filter((item) => item.reports_total > 0).length;

  const csvColumns: CsvColumn<FinishedMissionSummary>[] = useMemo(
    () => [
      { key: 'title', label: t('columns.title'), getValue: (row) => row.title },
      {
        key: 'disaster',
        label: t('columns.disaster'),
        getValue: (row) => row.disaster_title || '',
      },
      {
        key: 'status',
        label: t('columns.status'),
        getValue: (row) => t(`status.${row.status}`),
      },
      {
        key: 'priority',
        label: t('columns.priority'),
        getValue: (row) => t(`priority.${row.priority}`, { defaultValue: row.priority }),
      },
      {
        key: 'location',
        label: t('columns.location'),
        getValue: (row) => row.location_display || '',
      },
      {
        key: 'coordinator',
        label: t('columns.coordinator'),
        getValue: (row) => row.coordinator_name || row.coordinator_email || '',
      },
      {
        key: 'requiredVolunteers',
        label: t('columns.requiredVolunteers'),
        getValue: (row) => row.required_volunteers,
      },
      {
        key: 'applicationsTotal',
        label: t('columns.applicationsTotal'),
        getValue: (row) => row.applications_total,
      },
      {
        key: 'applicationsApproved',
        label: t('columns.applicationsApproved'),
        getValue: (row) => row.applications_approved,
      },
      {
        key: 'assignmentsTotal',
        label: t('columns.assignmentsTotal'),
        getValue: (row) => row.assignments_total,
      },
      {
        key: 'assignmentsCompleted',
        label: t('columns.assignmentsCompleted'),
        getValue: (row) => row.assignments_completed,
      },
      {
        key: 'reportsTotal',
        label: t('columns.reportsTotal'),
        getValue: (row) => row.reports_total,
      },
      {
        key: 'startTime',
        label: t('columns.startTime'),
        getValue: (row) => formatDate(row.start_time),
      },
      {
        key: 'endTime',
        label: t('columns.endTime'),
        getValue: (row) => formatDate(row.end_time),
      },
      {
        key: 'updatedAt',
        label: t('columns.updatedAt'),
        getValue: (row) => formatDate(row.updated_at),
      },
    ],
    [t],
  );

  const fetchAllFinished = async () => {
    const all: FinishedMissionSummary[] = [];
    let currentPage = 1;
    let totalPages = 1;
    do {
      const { data } = await apiClient.get<PaginatedResponse<FinishedMissionSummary>>(
        endpoints.reports.finishedMissions,
        {
          params: {
            page: currentPage,
            page_size: 100,
            ...(appliedFilters.search.trim() ? { search: appliedFilters.search.trim() } : {}),
            ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
          },
        },
      );
      all.push(...data.results);
      totalPages = Math.max(1, Math.ceil(data.count / 100));
      currentPage += 1;
    } while (currentPage <= totalPages);
    return all;
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {t('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('subtitle')}
          </Typography>
        </Box>
        {tab === 'finished' && (
          <GradientButton
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => setExportOpen(true)}
          >
            {t('actions.exportCsv')}
          </GradientButton>
        )}
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, value: ReportsTab) => setTab(value)}
        sx={{ mb: 2.5 }}
      >
        <Tab label={t('tabs.finishedMissions')} value="finished" />
        <Tab label={t('tabs.missionReports')} value="narrative" />
      </Tabs>

      {tab === 'finished' && (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
            <Box sx={{ flex: 1 }}>
              <StatCard
                title={t('stats.finished')}
                value={toPersianDigits((completedCount ?? 0) + (closedCount ?? 0))}
                icon={<AssessmentOutlinedIcon fontSize="small" />}
                accent="rgba(34, 211, 238, 0.12)"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <StatCard
                title={t('stats.completed')}
                value={toPersianDigits(completedCount ?? 0)}
                icon={<CheckCircleOutlineIcon fontSize="small" />}
                accent="rgba(16, 185, 129, 0.12)"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <StatCard
                title={t('stats.closed')}
                value={toPersianDigits(closedCount ?? 0)}
                icon={<LockOutlinedIcon fontSize="small" />}
                accent="rgba(129, 140, 248, 0.12)"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <StatCard
                title={t('stats.withReport')}
                value={toPersianDigits(withReportCount)}
                icon={<DescriptionOutlinedIcon fontSize="small" />}
                accent="rgba(251, 191, 36, 0.12)"
              />
            </Box>
          </Stack>

          {finishedError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('actions.error', { ns: 'common' })}
            </Alert>
          )}

          <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
            <Box
              sx={{
                px: { xs: 2, md: 2.75 },
                pt: { xs: 2, md: 2.5 },
                pb: 2,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(15, 23, 42, 0.25)'
                    : 'rgba(248, 250, 252, 0.85)',
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'stretch', md: 'center' }}
              >
                <TextField
                  size="small"
                  fullWidth
                  label={t('filters.search')}
                  value={draftFilters.search}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' },
                  }}
                />
                <TextField
                  select
                  size="small"
                  label={t('filters.status')}
                  value={draftFilters.status}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  sx={{
                    width: { xs: '100%', md: 200 },
                    flexShrink: 0,
                    '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' },
                  }}
                >
                  <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
                  <MenuItem value="completed">{t('filters.completed')}</MenuItem>
                  <MenuItem value="closed">{t('filters.closed')}</MenuItem>
                </TextField>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flexShrink: 0, width: { xs: '100%', md: 'auto' } }}
                >
                  <GradientButton
                    startIcon={<SearchOutlinedIcon />}
                    onClick={() => setAppliedFilters({ ...draftFilters })}
                    sx={{
                      height: 40,
                      minWidth: 112,
                      px: 2.25,
                      borderRadius: 2,
                      flex: { xs: 1, md: 'none' },
                    }}
                  >
                    {t('filters.apply')}
                  </GradientButton>
                  <GhostButton
                    startIcon={<ClearOutlinedIcon />}
                    onClick={() => {
                      setDraftFilters(emptyFilters);
                      setAppliedFilters(emptyFilters);
                    }}
                    sx={{
                      height: 40,
                      minWidth: 112,
                      px: 2,
                      borderRadius: 2,
                      flex: { xs: 1, md: 'none' },
                    }}
                  >
                    {t('filters.clear')}
                  </GhostButton>
                </Stack>
              </Stack>
            </Box>

            <TableContainer
              sx={{
                px: { xs: 0.5, md: 1 },
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <Table
                sx={{
                  minWidth: { xs: 640, md: 980 },
                  tableLayout: 'fixed',
                }}
              >
                <TableHead sx={tableHeadSx}>
                  <TableRow>
                    <TableCell sx={{ width: '20%' }}>{t('table.mission')}</TableCell>
                    <TableCell sx={{ width: '14%' }}>{t('table.disaster')}</TableCell>
                    <TableCell sx={{ width: '11%' }}>{t('table.status')}</TableCell>
                    <TableCell sx={{ width: '10%' }}>{t('table.applications')}</TableCell>
                    <TableCell sx={{ width: '10%' }}>{t('table.assignments')}</TableCell>
                    <TableCell sx={{ width: '9%' }}>{t('table.reports')}</TableCell>
                    <TableCell sx={{ width: '12%' }}>{t('table.updatedAt')}</TableCell>
                    <TableCell align="left" sx={{ width: '14%' }}>
                      {t('table.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finishedLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        {t('actions.loading', { ns: 'common' })}
                      </TableCell>
                    </TableRow>
                  ) : finishedMissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        {t('emptyFinished')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    finishedMissions.map((mission) => (
                      <TableRow key={mission.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={800} noWrap>
                            {mission.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {mission.location_display || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {mission.disaster_title || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            status={mission.status === 'completed' ? 'completed' : 'closed'}
                            label={t(`status.${mission.status}`)}
                          />
                        </TableCell>
                        <TableCell>
                          {toPersianDigits(
                            `${mission.applications_approved}/${mission.applications_total}`,
                          )}
                        </TableCell>
                        <TableCell>
                          {toPersianDigits(
                            `${mission.assignments_completed}/${mission.assignments_total}`,
                          )}
                        </TableCell>
                        <TableCell>{toPersianDigits(mission.reports_total)}</TableCell>
                        <TableCell>{formatDate(mission.updated_at)}</TableCell>
                        <TableCell align="left">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setSelectedMissionId(mission.id)}
                            sx={{ fontWeight: 700, borderRadius: 2 }}
                          >
                            {t('actions.viewSummary')}
                          </Button>
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
                totalCount={finishedTotal}
                onPageChange={setPage}
                disabled={finishedFetching}
              />
            </Box>
          </GlassCard>
        </>
      )}

      {tab === 'narrative' && (
        <>
          {reportsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('actions.error', { ns: 'common' })}
            </Alert>
          )}
          <GlassCard>
            <TableContainer sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={tableHeadSx}>
                  <TableRow>
                    <TableCell>{t('table.mission')}</TableCell>
                    <TableCell>{t('table.author')}</TableCell>
                    <TableCell>{t('table.content')}</TableCell>
                    <TableCell>{t('table.status')}</TableCell>
                    <TableCell>{t('table.createdAt')}</TableCell>
                    <TableCell align="left">{t('table.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        {t('actions.loading', { ns: 'common' })}
                      </TableCell>
                    </TableRow>
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        {t('emptyReports')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id} hover>
                        <TableCell>
                          <Typography
                            component={RouterLink}
                            to={`/missions/${report.mission}`}
                            variant="body2"
                            fontWeight={700}
                            sx={{ color: 'primary.main', textDecoration: 'none' }}
                          >
                            {report.mission_title || report.mission}
                          </Typography>
                        </TableCell>
                        <TableCell>{report.author_name || report.author_email || '—'}</TableCell>
                        <TableCell sx={{ maxWidth: 320 }}>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {report.content.slice(0, 80)}
                            {report.content.length > 80 ? '…' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            status={report.status}
                            label={t(`status.${report.status}`)}
                          />
                        </TableCell>
                        <TableCell>{formatDate(report.created_at)}</TableCell>
                        <TableCell align="left">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              onClick={() => setSelectedMissionId(report.mission)}
                            >
                              {t('actions.viewSummary')}
                            </Button>
                            {report.status === 'draft' &&
                              (hasPermission('reports.submit') || hasPermission('reports.view')) && (
                                <Button
                                  size="small"
                                  onClick={() => submitMutation.mutate(report.id)}
                                  disabled={submitMutation.isPending}
                                >
                                  {t('actions.submitReport')}
                                </Button>
                              )}
                            {report.status === 'submitted' && (
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ px: 2, pb: 2 }}>
              <TablePagination
                page={reportsPage}
                totalCount={reportsTotal}
                onPageChange={setReportsPage}
                disabled={reportsFetching}
              />
            </Box>
          </GlassCard>
        </>
      )}

      <FinishedMissionSummaryDialog
        missionId={selectedMissionId}
        open={Boolean(selectedMissionId)}
        onClose={() => setSelectedMissionId(null)}
      />

      <ExportCsvDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={t('export.title')}
        filename={t('export.filename')}
        columns={csvColumns}
        fetchAllRows={fetchAllFinished}
      />
    </Box>
  );
}

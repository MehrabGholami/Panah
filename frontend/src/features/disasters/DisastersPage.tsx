import AddIcon from '@mui/icons-material/Add';
import CrisisAlertOutlinedIcon from '@mui/icons-material/CrisisAlertOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/pagination';
import { GlassCard, JalaliDateField, StatusChip, TablePagination } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type { Disaster, DisasterNeed, PaginatedResponse } from '@/shared/types';
import { getDisasterLocationDisplay } from '@/shared/utils/locationDisplay';
import { toPersianDigits } from '@/shared/utils/persianDigits';
import { CreateDisasterDialog } from './CreateDisasterDialog';

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
    <GlassCard sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {value.toLocaleString('fa-IR')}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
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

export default function DisastersPage() {
  const { t } = useTranslation('disasters');
  const { t: tCommon } = useTranslation('common');
  const { hasPermission, hasAnyRole } = usePermissions();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDisaster, setEditingDisaster] = useState<Disaster | null>(null);
  const [deletingDisaster, setDeletingDisaster] = useState<Disaster | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const canCreate = hasAnyRole(['admin']) || hasPermission('disasters.create');
  const canManage = hasAnyRole(['admin']) || hasPermission('disasters.update');

  useEffect(() => {
    setPage(1);
  }, [fromDate]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['disasters', 'list', page, fromDate],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<Disaster>>(
        endpoints.disasters.list,
        {
          params: {
            page,
            page_size: DEFAULT_PAGE_SIZE,
            ...(fromDate ? { occurred_after: fromDate } : {}),
          },
        },
      );
      return response;
    },
    refetchInterval: 60_000,
  });

  const { data: activeCountData } = useQuery({
    queryKey: ['disasters', 'count', 'active', fromDate],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<Disaster>>(
        endpoints.disasters.list,
        {
          params: {
            status: 'active',
            page_size: 1,
            ...(fromDate ? { occurred_after: fromDate } : {}),
          },
        },
      );
      return response;
    },
    refetchInterval: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(endpoints.disasters.detail(id));
    },
    onSuccess: async () => {
      if ((data?.results?.length ?? 0) === 1 && page > 1) {
        setPage((current) => current - 1);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['disasters'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
      ]);
      setDeletingDisaster(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Disaster['status'] }) => {
      await apiClient.patch(endpoints.disasters.detail(id), { status });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['disasters'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
      ]);
    },
  });

  const disasters = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const stats = useMemo(
    () => ({
      total: totalCount,
      active: activeCountData?.count ?? 0,
    }),
    [totalCount, activeCountData?.count],
  );

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fa-IR');
  };

  const formatLocation = (disaster: Disaster) => getDisasterLocationDisplay(disaster);

  const resolveMapUrl = (disaster: Disaster) => {
    const metadataUrl = disaster.metadata?.google_maps_url;
    if (metadataUrl) {
      if (metadataUrl.startsWith('http://') || metadataUrl.startsWith('https://')) return metadataUrl;
      if (metadataUrl.startsWith('www.')) return `https://${metadataUrl}`;
      return `https://${metadataUrl}`;
    }
    const coords = disaster.metadata?.coordinates;
    if (!coords) return null;
    return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  };

  const resolveLocationQueryUrl = (disaster: Disaster) => {
    const mapUrl = resolveMapUrl(disaster);
    if (mapUrl) return mapUrl;
    const query = getDisasterLocationDisplay(disaster);
    if (!query || query === '—') return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const handleDelete = (disaster: Disaster) => {
    setDeletingDisaster(disaster);
  };

  const handleConfirmDelete = () => {
    if (!deletingDisaster) return;
    deleteMutation.mutate(deletingDisaster.id);
  };

  const handleToggleActive = (disaster: Disaster) => {
    const nextStatus = disaster.status === 'active' ? 'inactive' : 'active';
    statusMutation.mutate({ id: disaster.id, status: nextStatus });
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {t('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('subtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, fontWeight: 700 }}
          >
            {t('actions.create')}
          </Button>
        )}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title={t('stats.total')}
            value={stats.total}
            icon={<CrisisAlertOutlinedIcon />}
            accent="rgba(34, 211, 238, 0.12)"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title={t('stats.active')}
            value={stats.active}
            icon={<WarningAmberOutlinedIcon />}
            accent="rgba(251, 191, 36, 0.14)"
          />
        </Box>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {tCommon('actions.error')}
        </Alert>
      )}

      <GlassCard sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ sm: 'center' }}
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
          <Box sx={{ minWidth: { sm: 240 }, flex: 1 }}>
            <JalaliDateField
              label={t('filters.fromDate')}
              value={fromDate}
              onChange={setFromDate}
              size="small"
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 2 }}>
            {t('filters.fromDateHint')}
          </Typography>
          {fromDate && (
            <Chip
              size="small"
              label={toPersianDigits(fromDate.replaceAll('-', '/'))}
              onDelete={() => setFromDate(null)}
              aria-label={t('filters.fromDateClear')}
              sx={{ fontWeight: 700 }}
            />
          )}
        </Stack>

        <TableContainer>
          <Table>
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>{t('table.title')}</TableCell>
                <TableCell>{t('table.type')}</TableCell>
                <TableCell>{t('table.location')}</TableCell>
                <TableCell>{t('table.severity')}</TableCell>
                <TableCell>{t('table.status')}</TableCell>
                <TableCell>{t('table.occurredAt')}</TableCell>
                <TableCell>{t('table.needs')}</TableCell>
                <TableCell>{t('table.map')}</TableCell>
                {canManage && <TableCell>{t('table.actions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 9 : 8} align="center">
                    {tCommon('actions.loading')}
                  </TableCell>
                </TableRow>
              ) : disasters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 9 : 8} align="center">
                    {tCommon('actions.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                disasters.map((disaster) => (
                  <TableRow key={disaster.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {disaster.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{t(`types.${disaster.disaster_type}`)}</TableCell>
                    <TableCell>
                      {resolveLocationQueryUrl(disaster) ? (
                        <Button
                          variant="text"
                          size="small"
                          href={resolveLocationQueryUrl(disaster) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ p: 0, minWidth: 0, justifyContent: 'flex-start', fontWeight: 700 }}
                        >
                          {formatLocation(disaster)}
                        </Button>
                      ) : (
                        formatLocation(disaster)
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={disaster.severity}
                        label={t(`severity.${disaster.severity}`)}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={disaster.status}
                        label={t(`status.${disaster.status}`)}
                      />
                    </TableCell>
                    <TableCell>{formatDate(disaster.occurred_at)}</TableCell>
                    <TableCell>
                      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
                        {(disaster.needs ?? []).filter((need) => need !== 'other').length === 0 &&
                        (disaster.metadata?.other_needs ?? []).length === 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        ) : (
                          <>
                            {(disaster.needs ?? [])
                              .filter((need: DisasterNeed) => need !== 'other')
                              .map((need: DisasterNeed) => (
                                <Chip
                                  key={need}
                                  label={t(`needs.${need}`)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                              ))}
                            {(disaster.metadata?.other_needs ?? []).map((need) => (
                              <Chip
                                key={need}
                                label={need}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ fontWeight: 600 }}
                              />
                            ))}
                          </>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {resolveMapUrl(disaster) ? (
                        <Button
                          variant="text"
                          size="small"
                          href={resolveMapUrl(disaster) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<MapOutlinedIcon fontSize="small" />}
                        >
                          {t('actions.viewMap')}
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Button
                            size="small"
                            variant="outlined"
                            color={disaster.status === 'active' ? 'warning' : 'success'}
                            onClick={() => handleToggleActive(disaster)}
                            disabled={statusMutation.isPending}
                            sx={{ minWidth: 96, fontWeight: 700 }}
                          >
                            {disaster.status === 'active'
                              ? t('actions.deactivate')
                              : t('actions.activate')}
                          </Button>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => setEditingDisaster(disaster)}
                            aria-label={t('actions.edit')}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(disaster)}
                            disabled={deleteMutation.isPending}
                            aria-label={t('actions.delete')}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    )}
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

      {canCreate && (
        <CreateDisasterDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
      {canManage && (
        <CreateDisasterDialog
          open={Boolean(editingDisaster)}
          disaster={editingDisaster}
          onClose={() => setEditingDisaster(null)}
        />
      )}

      <Dialog
        open={Boolean(deletingDisaster)}
        onClose={() => !deleteMutation.isPending && setDeletingDisaster(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundImage: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(8,18,38,0.98) 100%)'
                : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{t('actions.delete')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('messages.confirmDelete', { title: deletingDisaster?.title ?? '—' })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setDeletingDisaster(null)}
            disabled={deleteMutation.isPending}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? '...' : t('actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

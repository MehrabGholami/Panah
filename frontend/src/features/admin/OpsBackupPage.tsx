import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import QueryBuilderRoundedIcon from '@mui/icons-material/QueryBuilderRounded';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
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
import { BackupAnalogTimePicker } from '@/features/admin/components/BackupAnalogTimePicker';
import { BackupRestoreWizard } from '@/features/admin/components/BackupRestoreWizard';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard, GradientButton, TablePagination } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type {
  BackupFrequency,
  BackupRun,
  BackupScheduleSettings,
  BackupStatusSummary,
  PaginatedResponse,
} from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';

const HISTORY_PAGE_SIZE = 10;
const ERROR_SUMMARY_MAX = 48;

function summarizeError(message: string, max = ERROR_SUMMARY_MAX) {
  const compact = message.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max).trimEnd()}…`;
}

const DEFAULT_SCHEDULE: BackupScheduleSettings = {
  enabled: true,
  frequency: 'daily',
  hour: 2,
  minute: 0,
  weekday: 0,
  day_of_month: 1,
  retention_days: 30,
};

function formatSchedulePreview(
  draft: BackupScheduleSettings,
  t: (key: string, opts?: Record<string, unknown>) => string,
) {
  if (!draft.enabled) return 'غیرفعال';
  const time = `${String(draft.hour).padStart(2, '0')}:${String(draft.minute).padStart(2, '0')}`;
  const timeFa = toPersianDigits(time);
  if (draft.frequency === 'daily') {
    return `${t('frequencies.daily')} ساعت ${timeFa}`;
  }
  if (draft.frequency === 'weekly') {
    return `${t('frequencies.weekly')} (${t(`weekdays.${draft.weekday}`)}) ساعت ${timeFa}`;
  }
  return `${t('frequencies.monthly')} (روز ${toPersianDigits(draft.day_of_month)}) ساعت ${timeFa}`;
}

function formatBytes(bytes: number, t: (key: string, opts?: Record<string, unknown>) => string) {
  if (!bytes) return toPersianDigits('0');
  if (bytes < 1024) return t('bytes', { value: toPersianDigits(bytes) });
  const kb = bytes / 1024;
  if (kb < 1024) return `${toPersianDigits(kb.toFixed(1))} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${toPersianDigits(mb.toFixed(1))} MB`;
  return `${toPersianDigits((mb / 1024).toFixed(2))} GB`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  try {
    return toPersianDigits(
      new Date(value).toLocaleString('fa-IR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    );
  } catch {
    return value;
  }
}

function statusColor(status: string): 'success' | 'error' | 'warning' | 'default' {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'running') return 'warning';
  return 'default';
}

export default function OpsBackupPage() {
  const { t } = useTranslation(['ops', 'common']);
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const canRun = hasPermission('ops.run_backup');

  const [draft, setDraft] = useState<BackupScheduleSettings>(DEFAULT_SCHEDULE);
  const [page, setPage] = useState(1);
  const [errorDialog, setErrorDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const statusQuery = useQuery({
    queryKey: ['ops', 'backup-status'],
    queryFn: async () => {
      const { data } = await apiClient.get<BackupStatusSummary>(endpoints.ops.backupStatus);
      return data;
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['ops', 'backup-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get<BackupScheduleSettings>(endpoints.ops.backupSettings);
      return data;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setDraft({ ...DEFAULT_SCHEDULE, ...settingsQuery.data });
    }
  }, [settingsQuery.data]);

  const historyQuery = useQuery({
    queryKey: ['ops', 'backups', page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<BackupRun>>(endpoints.ops.backups, {
        params: { page, page_size: HISTORY_PAGE_SIZE, ordering: '-started_at' },
      });
      return data;
    },
    refetchInterval: (query) => {
      const rows = query.state.data?.results ?? [];
      return rows.some((row) => row.status === 'running') ? 4000 : false;
    },
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(endpoints.ops.backupRun, { async: true });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ops'] });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (payload: BackupScheduleSettings) => {
      const { data } = await apiClient.put<BackupScheduleSettings>(
        endpoints.ops.backupSettings,
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      setDraft({ ...DEFAULT_SCHEDULE, ...data });
      void queryClient.invalidateQueries({ queryKey: ['ops'] });
    },
  });

  const summary = statusQuery.data;
  const rows = historyQuery.data?.results ?? [];
  const totalCount = historyQuery.data?.count ?? 0;
  const liveSchedulePreview = useMemo(() => formatSchedulePreview(draft, t), [draft, t]);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
            <BackupOutlinedIcon color="primary" />
            <Typography variant="h5" fontWeight={800}>
              {t('title')}
            </Typography>
          </Stack>
          <Typography color="text.secondary">{t('subtitle')}</Typography>
        </Box>
        {canRun ? (
          <GradientButton
            startIcon={<PlayArrowOutlinedIcon />}
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
          >
            {runMutation.isPending ? t('running') : t('runNow')}
          </GradientButton>
        ) : null}
      </Stack>

      {runMutation.isSuccess ? <Alert severity="success">{t('queued')}</Alert> : null}
      {runMutation.isError ? <Alert severity="error">{t('runError')}</Alert> : null}
      {saveSettingsMutation.isSuccess ? (
        <Alert severity="success">{t('settingsSaved')}</Alert>
      ) : null}
      {saveSettingsMutation.isError ? (
        <Alert severity="error">{t('settingsError')}</Alert>
      ) : null}
      {statusQuery.isError || historyQuery.isError || settingsQuery.isError ? (
        <Alert severity="error">{t('loadError')}</Alert>
      ) : null}

      <GlassCard
        sx={{
          p: { xs: 2.25, md: 3 },
          overflow: 'hidden',
          position: 'relative',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, rgba(34,211,238,0.08) 0%, rgba(129,140,248,0.06) 45%, rgba(15,23,42,0.4) 100%)'
              : 'linear-gradient(145deg, rgba(34,211,238,0.07) 0%, rgba(129,140,248,0.05) 40%, #fff 70%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          gap={2}
          mb={2.5}
        >
          <Box>
            <Stack direction="row" spacing={1.25} alignItems="center" mb={0.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgba(34, 211, 238, 0.14)',
                  color: 'primary.main',
                }}
              >
                <ScheduleOutlinedIcon />
              </Box>
              <Typography variant="subtitle1" fontWeight={800}>
                {t('settingsTitle')}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {t('settingsSubtitle')}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={draft.enabled}
                disabled={!canRun || saveSettingsMutation.isPending}
                onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
              />
            }
            label={t('enabled')}
            sx={{ m: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            alignItems: 'stretch',
            opacity: draft.enabled ? 1 : 0.55,
            pointerEvents: draft.enabled ? 'auto' : 'none',
          }}
        >
          <Box
            sx={{
              p: 2.25,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'rgba(34, 211, 238, 0.22)',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(11,15,26,0.35)' : 'rgba(255,255,255,0.72)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 360,
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" mb={1.5}>
              {t('scheduleTime')}
            </Typography>
            <BackupAnalogTimePicker
              hour={draft.hour}
              minute={draft.minute}
              disabled={!canRun || !draft.enabled}
              hourLabel={t('hour')}
              minuteLabel={t('minute')}
              onChange={({ hour, minute }) =>
                setDraft((prev) => ({ ...prev, hour, minute }))
              }
            />
          </Box>

          <Box
            sx={{
              p: 2.25,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(11,15,26,0.35)' : 'rgba(255,255,255,0.72)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              minHeight: 360,
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
              {t('scheduleOptions')}
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel id="backup-freq-label">{t('frequency')}</InputLabel>
              <Select
                labelId="backup-freq-label"
                label={t('frequency')}
                value={draft.frequency}
                disabled={!canRun}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    frequency: e.target.value as BackupFrequency,
                  }))
                }
              >
                <MenuItem value="daily">{t('frequencies.daily')}</MenuItem>
                <MenuItem value="weekly">{t('frequencies.weekly')}</MenuItem>
                <MenuItem value="monthly">{t('frequencies.monthly')}</MenuItem>
              </Select>
            </FormControl>

            {draft.frequency === 'weekly' ? (
              <FormControl fullWidth size="small">
                <InputLabel id="backup-weekday-label">{t('weekday')}</InputLabel>
                <Select
                  labelId="backup-weekday-label"
                  label={t('weekday')}
                  value={draft.weekday}
                  disabled={!canRun}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, weekday: Number(e.target.value) }))
                  }
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <MenuItem key={day} value={day}>
                      {t(`weekdays.${day}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}

            {draft.frequency === 'monthly' ? (
              <TextField
                size="small"
                type="number"
                label={t('dayOfMonth')}
                value={draft.day_of_month}
                disabled={!canRun}
                inputProps={{ min: 1, max: 28 }}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    day_of_month: Number(e.target.value) || 1,
                  }))
                }
              />
            ) : null}

            <TextField
              size="small"
              type="number"
              label={t('retentionLabel')}
              value={draft.retention_days}
              disabled={!canRun}
              helperText={t('retentionHint')}
              inputProps={{ min: 1, max: 365 }}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  retention_days: Number(e.target.value) || 1,
                }))
              }
            />

            <Box sx={{ flex: 1 }} />

            <Box
              sx={{
                mt: 'auto',
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: 'rgba(34, 211, 238, 0.08)',
                border: '1px solid',
                borderColor: 'rgba(34, 211, 238, 0.2)',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {t('schedulePreview')}
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ mt: 0.35 }}>
                {liveSchedulePreview}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="flex-end"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={1.5}
          mt={2.5}
        >
          {canRun ? (
            <GradientButton
              startIcon={<SaveOutlinedIcon />}
              disabled={saveSettingsMutation.isPending}
              onClick={() => saveSettingsMutation.mutate(draft)}
            >
              {saveSettingsMutation.isPending ? t('saving') : t('saveSettings')}
            </GradientButton>
          ) : null}
        </Stack>
      </GlassCard>

      <GlassCard
        sx={{
          p: { xs: 2.25, md: 2.75 },
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, rgba(34,211,238,0.06) 0%, rgba(129,140,248,0.04) 100%)'
              : 'linear-gradient(145deg, rgba(34,211,238,0.04) 0%, rgba(129,140,248,0.03) 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          gap={2}
          mb={2.25}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={800} mb={0.5}>
              {t('statusTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {summary?.last_backup_status
                ? t(`statuses.${summary.last_backup_status}`, {
                    defaultValue: summary.last_backup_status,
                  })
                : t('unknown')}
            </Typography>
          </Box>
          <Chip
            icon={
              summary?.last_backup_status === 'failed' ? (
                <ErrorOutlineRoundedIcon />
              ) : (
                <CheckCircleOutlineRoundedIcon />
              )
            }
            color={statusColor(summary?.last_backup_status ?? '')}
            label={
              summary?.last_backup_status
                ? t(`statuses.${summary.last_backup_status}`, {
                    defaultValue: summary.last_backup_status,
                  })
                : t('unknown')
            }
            sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, fontWeight: 700, px: 0.5 }}
          />
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: 'repeat(4, minmax(0, 1fr))' },
            alignItems: 'stretch',
          }}
        >
          <StatCard
            icon={<CheckCircleOutlineRoundedIcon fontSize="small" />}
            label={t('lastSuccess')}
            value={summary?.last_backup_at ? formatDateTime(summary.last_backup_at) : t('never')}
            hint={`${t('retention')}: ${t('retentionDays', {
              days: toPersianDigits(draft.retention_days || summary?.retention_days || 30),
            })}`}
          />
          <StatCard
            icon={<QueryBuilderRoundedIcon fontSize="small" />}
            label={t('age')}
            value={
              summary?.last_backup_age_hours != null
                ? t('hours', { hours: toPersianDigits(summary.last_backup_age_hours) })
                : t('unknown')
            }
          />
          <StatCard
            icon={<StorageRoundedIcon fontSize="small" />}
            label={t('size')}
            value={formatBytes(summary?.last_backup_size_bytes ?? 0, t)}
          />
          <StatCard
            icon={<BackupOutlinedIcon fontSize="small" />}
            label={t('lastStatus')}
            value={
              summary?.last_backup_status
                ? t(`statuses.${summary.last_backup_status}`, {
                    defaultValue: summary.last_backup_status,
                  })
                : t('unknown')
            }
          />
        </Box>
        {summary?.last_run_error ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {summary.last_run_error}
          </Alert>
        ) : null}
      </GlassCard>

      <GlassCard sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('history')}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshOutlinedIcon />}
            disabled={historyQuery.isFetching}
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ['ops'] });
            }}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 1.75,
              borderColor: 'rgba(34, 211, 238, 0.35)',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(34, 211, 238, 0.08)'
                  : 'rgba(34, 211, 238, 0.06)',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(34, 211, 238, 0.14)',
              },
            }}
          >
            {t('actions.refresh', { ns: 'common' })}
          </Button>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeadSx}>{t('startedAt')}</TableCell>
                <TableCell sx={tableHeadSx}>{t('finishedAt')}</TableCell>
                <TableCell sx={tableHeadSx}>{t('lastStatus')}</TableCell>
                <TableCell sx={tableHeadSx}>{t('type')}</TableCell>
                <TableCell sx={tableHeadSx}>{t('trigger')}</TableCell>
                <TableCell sx={tableHeadSx}>{t('size')}</TableCell>
                <TableCell sx={tableHeadSx}>{t('actor')}</TableCell>
                <TableCell sx={tableHeadSx}>{t('error')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary">
                      {t('actions.noData', { ns: 'common' })}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{formatDateTime(row.started_at)}</TableCell>
                    <TableCell>{formatDateTime(row.finished_at)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={statusColor(row.status)}
                        label={t(`statuses.${row.status}`)}
                      />
                    </TableCell>
                    <TableCell>{t(`types.${row.backup_type}`)}</TableCell>
                    <TableCell>{t(`triggers.${row.triggered_by}`)}</TableCell>
                    <TableCell>{formatBytes(row.size_bytes, t)}</TableCell>
                    <TableCell>{row.actor_email || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      {row.error_message?.trim() ? (
                        <Typography
                          component="button"
                          type="button"
                          variant="body2"
                          color="error"
                          title={t('errorViewFull')}
                          onClick={() =>
                            setErrorDialog({
                              title: `${t('error')} · ${formatDateTime(row.started_at)}`,
                              message: row.error_message!.trim(),
                            })
                          }
                          sx={{
                            all: 'unset',
                            cursor: 'pointer',
                            display: 'block',
                            maxWidth: '100%',
                            fontWeight: 700,
                            lineHeight: 1.45,
                            borderBottom: '1px dashed',
                            borderColor: 'error.light',
                            '&:hover': { opacity: 0.82 },
                            '&:focus-visible': {
                              outline: '2px solid',
                              outlineColor: 'error.main',
                              outlineOffset: 2,
                              borderRadius: 0.5,
                            },
                          }}
                        >
                          {summarizeError(row.error_message)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          {t('errorEmpty')}
                        </Typography>
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
          pageSize={HISTORY_PAGE_SIZE}
          onPageChange={setPage}
          disabled={historyQuery.isFetching}
        />
      </GlassCard>

      <BackupRestoreWizard
        canRun={canRun}
        databaseName={summary?.database_name ?? ''}
      />

      <Dialog
        open={Boolean(errorDialog)}
        onClose={() => setErrorDialog(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            m: { xs: 1.5, sm: 2 },
            width: { xs: 'calc(100% - 24px)', sm: undefined },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{errorDialog?.title ?? t('errorDetailsTitle')}</DialogTitle>
        <DialogContent dividers>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.65)' : 'rgba(248,250,252,0.95)',
              border: '1px solid',
              borderColor: 'divider',
              color: 'error.main',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              direction: 'ltr',
              textAlign: 'left',
              maxHeight: 'min(60vh, 480px)',
              overflow: 'auto',
            }}
          >
            {errorDialog?.message}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" onClick={() => setErrorDialog(null)}>
            {t('errorDialogClose')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Box
      sx={{
        p: 2,
        minHeight: 148,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.3)' : 'rgba(255,255,255,0.76)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 0.75,
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'rgba(34, 211, 238, 0.12)',
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        sx={{ lineHeight: 1.3, px: 0.5 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        fontWeight={800}
        sx={{
          lineHeight: 1.35,
          px: 0.5,
          wordBreak: 'break-word',
          dir: 'auto',
        }}
      >
        {value}
      </Typography>
      {hint ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ lineHeight: 1.3, px: 0.5, mt: 0.25 }}
        >
          {hint}
        </Typography>
      ) : (
        <Box sx={{ height: 18 }} aria-hidden />
      )}
    </Box>
  );
}

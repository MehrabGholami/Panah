import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined';
import WestRoundedIcon from '@mui/icons-material/WestRounded';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Radio,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage';
import { GlassCard, GradientButton, TablePagination } from '@/shared/components/ui';
import type {
  BackupRestoreResult,
  BackupRun,
  PaginatedResponse,
} from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';

type StepKey = 'select' | 'review' | 'confirm' | 'result';

const STEPS: StepKey[] = ['select', 'review', 'confirm', 'result'];
const RESTORE_CANDIDATE_PAGE_SIZE = 5;

function formatBytes(bytes: number) {
  if (!bytes) return toPersianDigits('0');
  if (bytes < 1024) return `${toPersianDigits(bytes)} B`;
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

function triggerIcon(trigger: BackupRun['triggered_by']) {
  if (trigger === 'schedule') return <ScheduleOutlinedIcon sx={{ fontSize: 15 }} />;
  if (trigger === 'cli') return <TerminalOutlinedIcon sx={{ fontSize: 15 }} />;
  return <TouchAppOutlinedIcon sx={{ fontSize: 15 }} />;
}

interface BackupRestoreWizardProps {
  canRun: boolean;
  databaseName: string;
}

export function BackupRestoreWizard({ canRun, databaseName }: BackupRestoreWizardProps) {
  const { t } = useTranslation(['ops', 'common']);
  const [step, setStep] = useState<StepKey>('select');
  const [selectedId, setSelectedId] = useState('');
  const [restoreMedia, setRestoreMedia] = useState(false);
  const [ackDestructive, setAckDestructive] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [cliOpen, setCliOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [result, setResult] = useState<BackupRestoreResult | null>(null);
  const [selectPage, setSelectPage] = useState(1);
  const [selectedSnapshot, setSelectedSnapshot] = useState<BackupRun | null>(null);

  const candidatesQuery = useQuery({
    queryKey: ['ops', 'backups', 'restore-candidates', selectPage],
    enabled: canRun,
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<BackupRun>>(endpoints.ops.backups, {
        params: {
          page: selectPage,
          page_size: RESTORE_CANDIDATE_PAGE_SIZE,
          ordering: '-started_at',
          status: 'success',
        },
      });
      const results = (data.results ?? []).filter((row) => Boolean(row.db_path));
      return {
        results,
        count: data.count ?? results.length,
      };
    },
  });

  const candidates = candidatesQuery.data?.results ?? [];
  const candidatesTotal = candidatesQuery.data?.count ?? 0;
  const selected = useMemo(() => {
    if (selectedSnapshot && selectedSnapshot.id === selectedId) return selectedSnapshot;
    return candidates.find((row) => row.id === selectedId) ?? null;
  }, [candidates, selectedId, selectedSnapshot]);

  const selectBackup = (row: BackupRun) => {
    setSelectedId(row.id);
    setSelectedSnapshot(row);
  };

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error('no backup');
      const { data } = await apiClient.post<BackupRestoreResult>(
        endpoints.ops.backupRestore(selected.id),
        {
          confirm_db_name: confirmName.trim(),
          restore_media: restoreMedia && Boolean(selected.media_path),
        },
      );
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      setStep('result');
    },
  });

  const stepIndex = STEPS.indexOf(step);
  const confirmReady =
    ackDestructive && Boolean(databaseName) && confirmName.trim() === databaseName;

  const resetWizard = () => {
    setStep('select');
    setSelectedId('');
    setSelectedSnapshot(null);
    setSelectPage(1);
    setRestoreMedia(false);
    setAckDestructive(false);
    setConfirmName('');
    setResult(null);
    restoreMutation.reset();
  };

  return (
    <GlassCard
      sx={{
        p: { xs: 2.25, md: 3 },
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(160deg, rgba(248,113,113,0.08) 0%, rgba(15,23,42,0.35) 55%)'
            : 'linear-gradient(160deg, rgba(248,113,113,0.06) 0%, #fff 50%)',
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="flex-start"
        justifyContent="space-between"
        mb={0.75}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(248, 113, 113, 0.12)',
              color: 'error.main',
              flexShrink: 0,
            }}
          >
            <RestoreOutlinedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              {t('restoreTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('restoreBody')}
            </Typography>
          </Box>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<HelpOutlineRoundedIcon />}
          onClick={() => setHelpOpen(true)}
          sx={{
            flexShrink: 0,
            borderColor: 'divider',
            color: 'text.secondary',
            bgcolor: 'background.paper',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          {t('restoreHelp')}
        </Button>
      </Stack>

      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="body"
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            overflow: 'hidden',
            maxHeight: 'min(92vh, 720px)',
            m: { xs: 1.5, sm: 2 },
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(165deg, rgba(248,113,113,0.14) 0%, rgba(15,23,42,0.98) 36%)'
                : 'linear-gradient(165deg, rgba(254,226,226,0.95) 0%, #fff 34%)',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 24px 64px rgba(0,0,0,0.45)'
                : '0 24px 64px rgba(15,23,42,0.14)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: { xs: 2.5, md: 3.5 },
            pt: 2.5,
            pb: 1.5,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              bgcolor: 'rgba(248, 113, 113, 0.14)',
              color: 'error.main',
            }}
          >
            <HelpOutlineRoundedIcon />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
            {t('restoreHelpTitle')}
          </Typography>
          <IconButton
            aria-label={t('restoreHelpClose')}
            onClick={() => setHelpOpen(false)}
            size="small"
            sx={{
              flexShrink: 0,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover', borderColor: 'text.disabled' },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            px: { xs: 2.5, md: 3.5 },
            pt: 0.5,
            pb: 1,
            overflow: 'visible',
          }}
        >
          <Typography
            color="text.secondary"
            sx={{ mb: 2, lineHeight: 1.75, fontSize: { xs: 14, md: 15 } }}
          >
            {t('restoreHelpIntro')}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr' },
              gap: 1.25,
              alignItems: 'stretch',
              mb: 1.75,
            }}
          >
            <Box
              sx={{
                p: 1.75,
                borderRadius: 2.5,
                border: '1px dashed',
                borderColor: 'rgba(248, 113, 113, 0.4)',
                bgcolor: 'rgba(248, 113, 113, 0.07)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 96,
              }}
            >
              <StorageRoundedIcon sx={{ color: 'error.main', mb: 0.5, fontSize: 28 }} />
              <Typography fontWeight={800} fontSize={14}>
                {t('restoreHelpNow')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, maxWidth: 180 }}>
                {t('restoreHelpNowDesc')}
              </Typography>
            </Box>

            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={0.25}
              sx={{ py: { xs: 0.25, sm: 0 } }}
            >
              <WestRoundedIcon
                sx={{
                  color: 'error.main',
                  transform: { xs: 'rotate(-90deg)', sm: 'none' },
                  fontSize: 30,
                }}
              />
              <Typography
                variant="caption"
                fontWeight={800}
                color="error.main"
                sx={{ whiteSpace: 'nowrap', letterSpacing: 0.2 }}
              >
                {t('restoreHelpArrow')}
              </Typography>
            </Stack>

            <Box
              sx={{
                p: 1.75,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'rgba(52, 211, 153, 0.4)',
                bgcolor: 'rgba(52, 211, 153, 0.09)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 96,
              }}
            >
              <BackupOutlinedIcon sx={{ color: 'success.main', mb: 0.5, fontSize: 28 }} />
              <Typography fontWeight={800} fontSize={14}>
                {t('restoreHelpBackup')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, maxWidth: 180 }}>
                {t('restoreHelpBackupDesc')}
              </Typography>
            </Box>
          </Box>

          <Alert
            severity="warning"
            sx={{
              mb: 2,
              borderRadius: 2,
              py: 0.75,
              alignItems: 'center',
              '& .MuiAlert-message': { py: 0.25 },
            }}
          >
            {t('restoreHelpFlowNote')}
          </Alert>

          <Typography fontWeight={800} sx={{ mb: 1.1, fontSize: 15 }}>
            {t('restoreHelpStepsTitle')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1,
              mb: 2,
            }}
          >
            {(
              [
                'restoreHelpStepSelect',
                'restoreHelpStepReview',
                'restoreHelpStepConfirm',
                'restoreHelpStepResult',
              ] as const
            ).map((key, index) => (
              <Stack
                key={key}
                direction="row"
                spacing={1.1}
                alignItems="flex-start"
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.035)',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    bgcolor: 'rgba(248, 113, 113, 0.14)',
                    color: 'error.main',
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {toPersianDigits(index + 1)}
                </Box>
                <Typography variant="body2" sx={{ pt: 0.15, lineHeight: 1.55, fontSize: 13.5 }}>
                  {t(key)}
                </Typography>
              </Stack>
            ))}
          </Box>

          <Typography fontWeight={800} sx={{ mb: 1, fontSize: 15 }}>
            {t('restoreHelpAfterTitle')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              gap: 1,
            }}
          >
            {(
              ['restoreHelpAfter1', 'restoreHelpAfter2', 'restoreHelpAfter3'] as const
            ).map((key) => (
              <Stack
                key={key}
                spacing={0.75}
                alignItems="center"
                sx={{
                  p: 1.35,
                  borderRadius: 2,
                  bgcolor: 'rgba(34, 211, 238, 0.06)',
                  border: '1px solid',
                  borderColor: 'rgba(34, 211, 238, 0.18)',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <RestartAltRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6, fontSize: 13 }}
                >
                  {t(key)}
                </Typography>
              </Stack>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2.5, md: 3.5 }, pb: 2.75, pt: 1.5 }}>
          <GradientButton onClick={() => setHelpOpen(false)} sx={{ minWidth: 140 }}>
            {t('restoreHelpClose')}
          </GradientButton>
        </DialogActions>
      </Dialog>

      <Alert severity="warning" sx={{ mt: 2, mb: 2.5, whiteSpace: 'pre-line' }}>
        {t('restoreWarning')}
      </Alert>

      {!canRun ? (
        <Alert severity="info">{t('restoreNoPermission')}</Alert>
      ) : (
        <>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ mb: 2.5 }}
          >
            {STEPS.map((key, index) => {
              const active = index === stepIndex;
              const done = index < stepIndex;
              return (
                <Box
                  key={key}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: active
                      ? 'error.main'
                      : done
                        ? 'rgba(52, 211, 153, 0.45)'
                        : 'divider',
                    bgcolor: active
                      ? 'rgba(248, 113, 113, 0.1)'
                      : done
                        ? 'rgba(52, 211, 153, 0.08)'
                        : 'action.hover',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {toPersianDigits(index + 1)}. {t(`restoreSteps.${key}`)}
                </Box>
              );
            })}
          </Stack>

          {step === 'select' ? (
            <Stack spacing={1.75}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                gap={1}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('restoreSelectHint')}
                </Typography>
                {candidatesTotal > 0 ? (
                  <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    icon={<CheckCircleOutlineRoundedIcon />}
                    label={t('restoreCandidatesCount', {
                      count: toPersianDigits(candidatesTotal),
                    })}
                    sx={{ fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'center' } }}
                  />
                ) : null}
              </Stack>

              {candidatesQuery.isError ? (
                <Alert severity="error">{t('loadError')}</Alert>
              ) : null}

              {candidates.length === 0 && !candidatesQuery.isLoading ? (
                <Alert severity="info">{t('restoreNoSuccess')}</Alert>
              ) : (
                <Stack spacing={1.15}>
                  {candidatesQuery.isLoading
                    ? Array.from({ length: RESTORE_CANDIDATE_PAGE_SIZE }).map((_, index) => (
                        <Box
                          key={`skeleton-${index}`}
                          sx={{
                            height: 92,
                            borderRadius: 3,
                            bgcolor: 'action.hover',
                            opacity: 0.55,
                          }}
                        />
                      ))
                    : candidates.map((row) => {
                        const checked = selectedId === row.id;
                        const fileName = row.db_path.split(/[/\\]/).filter(Boolean).pop() ?? row.db_path;
                        return (
                          <Box
                            key={row.id}
                            onClick={() => selectBackup(row)}
                            sx={{
                              position: 'relative',
                              p: 1.75,
                              borderRadius: 3,
                              border: '1px solid',
                              borderColor: checked ? 'error.main' : 'divider',
                              bgcolor: (theme) =>
                                checked
                                  ? theme.palette.mode === 'dark'
                                    ? 'rgba(248, 113, 113, 0.12)'
                                    : 'rgba(254, 226, 226, 0.45)'
                                  : theme.palette.mode === 'dark'
                                    ? 'rgba(15,23,42,0.35)'
                                    : 'rgba(255,255,255,0.92)',
                              cursor: 'pointer',
                              transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
                              boxShadow: checked
                                ? '0 10px 28px rgba(248, 113, 113, 0.16)'
                                : '0 4px 14px rgba(15, 23, 42, 0.04)',
                              '&:hover': {
                                borderColor: checked ? 'error.main' : 'rgba(248, 113, 113, 0.45)',
                                transform: 'translateY(-1px)',
                              },
                            }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                              <Radio
                                checked={checked}
                                size="small"
                                sx={{ mt: 0.1, p: 0.5 }}
                                inputProps={{ 'aria-label': fileName }}
                              />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
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
                                    <StorageRoundedIcon sx={{ fontSize: 18 }} />
                                  </Box>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={800}>
                                      {formatDateTime(row.finished_at || row.started_at)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        display: 'block',
                                        fontFamily: 'monospace',
                                        dir: 'ltr',
                                        textAlign: 'left',
                                      }}
                                    >
                                      {fileName}
                                    </Typography>
                                  </Box>
                                </Stack>

                                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" mb={checked ? 1.25 : 0}>
                                  <Chip
                                    size="small"
                                    label={t(`types.${row.backup_type}`)}
                                    sx={{ fontWeight: 700 }}
                                  />
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={formatBytes(row.size_bytes)}
                                    sx={{ fontWeight: 700 }}
                                  />
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    icon={triggerIcon(row.triggered_by)}
                                    label={t(`triggers.${row.triggered_by}`)}
                                    sx={{ fontWeight: 700 }}
                                  />
                                  {row.media_path ? (
                                    <Chip
                                      size="small"
                                      color="info"
                                      variant="outlined"
                                      label={t('restoreHasMedia')}
                                      sx={{ fontWeight: 700 }}
                                    />
                                  ) : null}
                                </Stack>

                                {checked ? (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      width: '100%',
                                      pt: 0.25,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        px: 1.75,
                                        py: 0.65,
                                        borderRadius: 999,
                                        bgcolor: (theme) =>
                                          theme.palette.mode === 'dark'
                                            ? 'rgba(248, 113, 113, 0.22)'
                                            : 'rgba(254, 226, 226, 0.95)',
                                        border: '1px solid',
                                        borderColor: 'rgba(239, 68, 68, 0.45)',
                                        color: 'error.dark',
                                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.12)',
                                      }}
                                    >
                                      <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'error.main' }} />
                                      <Typography
                                        variant="caption"
                                        fontWeight={800}
                                        sx={{ letterSpacing: 0.2, lineHeight: 1 }}
                                      >
                                        {t('restoreSelectedBadge')}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ) : null}
                              </Box>
                            </Stack>
                          </Box>
                        );
                      })}
                </Stack>
              )}

              <TablePagination
                page={selectPage}
                totalCount={candidatesTotal}
                pageSize={RESTORE_CANDIDATE_PAGE_SIZE}
                onPageChange={setSelectPage}
                disabled={candidatesQuery.isFetching}
              />

              <Stack direction="row" justifyContent="flex-end">
                <GradientButton disabled={!selectedId} onClick={() => setStep('review')}>
                  {t('restoreNext')}
                </GradientButton>
              </Stack>
            </Stack>
          ) : null}

          {step === 'review' && selected ? (
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {t('restoreSelected')}
                </Typography>
                <Typography variant="body1" fontWeight={800} sx={{ mt: 0.5 }}>
                  {formatDateTime(selected.finished_at || selected.started_at)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  {t('type')}: {t(`types.${selected.backup_type}`)} · {t('size')}:{' '}
                  {formatBytes(selected.size_bytes)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 1, fontFamily: 'monospace', dir: 'ltr', textAlign: 'left' }}
                >
                  DB: {selected.db_path}
                </Typography>
                {selected.media_path ? (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      fontFamily: 'monospace',
                      dir: 'ltr',
                      textAlign: 'left',
                    }}
                  >
                    Media: {selected.media_path}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t('restoreMediaUnavailable')}
                  </Typography>
                )}
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={restoreMedia}
                    disabled={!selected.media_path}
                    onChange={(e) => setRestoreMedia(e.target.checked)}
                  />
                }
                label={t('restoreIncludeMedia')}
              />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                gap={1.5}
                useFlexGap
                flexWrap="wrap"
              >
                <Button variant="outlined" onClick={() => setStep('select')} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  {t('restoreBack')}
                </Button>
                <GradientButton onClick={() => setStep('confirm')} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  {t('restoreNext')}
                </GradientButton>
              </Stack>
            </Stack>
          ) : null}

          {step === 'confirm' && selected ? (
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={ackDestructive}
                    onChange={(e) => setAckDestructive(e.target.checked)}
                    color="error"
                  />
                }
                label={t('restoreAckLabel')}
              />
              <TextField
                fullWidth
                size="small"
                label={t('restoreConfirmLabel')}
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                helperText={t('restoreConfirmHint', { name: databaseName || '—' })}
                inputProps={{ dir: 'ltr', autoComplete: 'off', spellCheck: false }}
                error={Boolean(confirmName) && confirmName.trim() !== databaseName}
              />
              {restoreMutation.isError ? (
                <Alert severity="error">
                  {getApiErrorMessage(restoreMutation.error, t('restoreErrorTitle'))}
                </Alert>
              ) : null}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                gap={1.5}
                useFlexGap
                flexWrap="wrap"
              >
                <Button
                  variant="outlined"
                  disabled={restoreMutation.isPending}
                  onClick={() => setStep('review')}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {t('restoreBack')}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  disabled={!confirmReady || restoreMutation.isPending}
                  onClick={() => restoreMutation.mutate()}
                  sx={{ fontWeight: 800, px: 2.5, width: { xs: '100%', sm: 'auto' } }}
                >
                  {restoreMutation.isPending ? t('restoreExecuting') : t('restoreExecute')}
                </Button>
              </Stack>
            </Stack>
          ) : null}

          {step === 'result' ? (
            <Stack spacing={2}>
              {result ? (
                <Alert
                  severity="success"
                  icon={<CheckCircleOutlineRoundedIcon />}
                  sx={{ alignItems: 'flex-start' }}
                >
                  <Typography fontWeight={800}>{t('restoreSuccessTitle')}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {result.message}
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="error" icon={<ErrorOutlineRoundedIcon />}>
                  {t('restoreErrorTitle')}
                </Alert>
              )}
              {result?.post_steps?.length ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} mb={1}>
                    {t('restorePostSteps')}
                  </Typography>
                  <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
                    {result.post_steps.map((item) => (
                      <Typography key={item} component="li" variant="body2">
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              ) : null}
              <Stack direction="row" justifyContent="flex-end">
                <Button variant="outlined" onClick={resetWizard}>
                  {t('restoreReset')}
                </Button>
              </Stack>
            </Stack>
          ) : null}
        </>
      )}

      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button size="small" onClick={() => setCliOpen((v) => !v)} sx={{ fontWeight: 700 }}>
          {t('restoreCliTitle')}
        </Button>
        <Collapse in={cliOpen}>
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {t('restoreDjango')}
              </Typography>
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  mt: 0.75,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  dir: 'ltr',
                }}
              >
                {`docker compose exec volunteer-management-backend \\
  python manage.py restore_db \\
  --file=/backups/<file.sql.gz> \\
  --confirm=<POSTGRES_DB> --execute`}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {t('restoreLinux')}
              </Typography>
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  mt: 0.75,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  dir: 'ltr',
                }}
              >
                ./infrastructure/scripts/restore-db.sh database/backups/&lt;file.sql.gz&gt;
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {t('restoreWindows')}
              </Typography>
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  mt: 0.75,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  dir: 'ltr',
                }}
              >
                .\infrastructure\scripts\restore-db.ps1 .\database\backups\&lt;file.sql.gz&gt;
              </Typography>
            </Box>
            <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
              {t('restoreRestartNote')}
            </Typography>
          </Stack>
        </Collapse>
      </Box>
    </GlassCard>
  );
}

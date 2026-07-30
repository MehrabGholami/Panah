import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GhostButton, GradientButton } from '@/shared/components/ui';
import type { AccountUser, PaginatedResponse, Skill } from '@/shared/types';
import {
  buildCsvContent,
  downloadCsv,
  type CsvColumn,
} from '@/shared/utils/csvExport';
import { toPersianDigits } from '@/shared/utils/persianDigits';

export type UsersExportFilters = {
  search: string;
  role: string;
  is_active: string;
  city: string;
  skill: string;
};

interface UsersExportCsvDialogProps {
  open: boolean;
  onClose: () => void;
  initialFilters: UsersExportFilters;
  onFiltersCommit: (filters: UsersExportFilters) => void;
  columns: CsvColumn<AccountUser>[];
  filename: string;
  buildParams: (filters: UsersExportFilters) => Record<string, string | number>;
}

type Step = 1 | 2;

function StepBadge({
  active,
  done,
  index,
  label,
}: {
  active: boolean;
  done: boolean;
  index: number;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: 13,
          fontWeight: 800,
          bgcolor: active || done ? 'primary.main' : 'rgba(148, 163, 184, 0.16)',
          color: active || done ? 'primary.contrastText' : 'text.secondary',
        }}
      >
        {toPersianDigits(index)}
      </Box>
      <Typography
        variant="body2"
        sx={{ fontWeight: active ? 800 : 600, color: active ? 'text.primary' : 'text.secondary' }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

export function UsersExportCsvDialog({
  open,
  onClose,
  initialFilters,
  onFiltersCommit,
  columns,
  filename,
  buildParams,
}: UsersExportCsvDialogProps) {
  const { t } = useTranslation(['users', 'common']);
  const defaultKeys = useMemo(
    () => columns.filter((column) => column.defaultSelected !== false).map((column) => column.key),
    [columns],
  );

  const [step, setStep] = useState<Step>(1);
  const [filters, setFilters] = useState<UsersExportFilters>(initialFilters);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(defaultKeys);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setFilters(initialFilters);
    setSelectedKeys(defaultKeys);
    setError(null);
    setExporting(false);
  }, [open, initialFilters, defaultKeys]);

  const { data: skills = [] } = useQuery({
    queryKey: ['skills-public'],
    queryFn: async () => {
      const { data } = await apiClient.get<Skill[] | PaginatedResponse<Skill>>(
        endpoints.skills.public,
      );
      return Array.isArray(data) ? data : (data.results ?? []);
    },
    enabled: open,
  });

  const previewQuery = useQuery({
    queryKey: ['accounts-users', 'export-preview', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<AccountUser>>(
        endpoints.accounts.users,
        { params: { ...buildParams(filters), page: 1, page_size: 1 } },
      );
      return data.count;
    },
    enabled: open && step === 1,
  });

  const matchedCount = previewQuery.data ?? 0;
  const hasAnyFilter = Boolean(
    filters.search.trim() ||
      filters.role ||
      filters.is_active ||
      filters.city.trim() ||
      filters.skill,
  );

  const updateFilter = <K extends keyof UsersExportFilters>(
    field: K,
    value: UsersExportFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const handleNext = () => {
    if (!hasAnyFilter) {
      setError(t('export.filterRequired'));
      return;
    }
    if (matchedCount === 0) {
      setError(t('export.noMatches'));
      return;
    }
    setError(null);
    onFiltersCommit(filters);
    setStep(2);
  };

  const handleExport = async () => {
    const selectedColumns = columns.filter((column) => selectedKeys.includes(column.key));
    if (selectedColumns.length === 0) {
      setError(t('export.selectColumn'));
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const all: AccountUser[] = [];
      let currentPage = 1;
      let totalPages = 1;
      do {
        const { data: response } = await apiClient.get<PaginatedResponse<AccountUser>>(
          endpoints.accounts.users,
          {
            params: {
              ...buildParams(filters),
              page: currentPage,
              page_size: 100,
            },
          },
        );
        all.push(...response.results);
        totalPages = Math.max(1, Math.ceil(response.count / 100));
        currentPage += 1;
      } while (currentPage <= totalPages);

      const content = buildCsvContent(all, selectedColumns);
      downloadCsv(filename, content);
      onFiltersCommit(filters);
      onClose();
    } catch {
      setError(t('export.failed'));
    } finally {
      setExporting(false);
    }
  };

  const skillName = skills.find((skill) => skill.id === filters.skill)?.name;

  return (
    <Dialog
      open={open}
      onClose={exporting ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          m: { xs: 1.5, sm: 2 },
          width: { xs: 'calc(100% - 24px)', sm: undefined },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Typography variant="h6" fontWeight={800}>
          {t('export.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('export.subtitle')}
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.25, sm: 3 }}
          sx={{
            mt: 2.25,
            p: 1.5,
            borderRadius: 2.5,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(34, 211, 238, 0.08)'
                : 'rgba(34, 211, 238, 0.06)',
            border: 1,
            borderColor: 'rgba(34, 211, 238, 0.16)',
          }}
        >
          <StepBadge
            index={1}
            active={step === 1}
            done={step === 2}
            label={t('export.stepFilter')}
          />
          <StepBadge
            index={2}
            active={step === 2}
            done={false}
            label={t('export.stepColumns')}
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {step === 1 ? (
          <Stack spacing={2.25}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgba(34, 211, 238, 0.12)',
                  color: 'primary.main',
                }}
              >
                <FilterAltOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800}>
                  {t('export.filterTitle')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('export.filterHint')}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(15, 23, 42, 0.35)'
                    : 'rgba(248, 250, 252, 0.9)',
              }}
            >
              <Stack spacing={1.75}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField
                    label={t('searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    select
                    label={t('role')}
                    value={filters.role}
                    onChange={(e) => updateFilter('role', e.target.value)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">{t('allRoles')}</MenuItem>
                    <MenuItem value="admin">{t('roles.admin')}</MenuItem>
                    <MenuItem value="coordinator">{t('roles.coordinator')}</MenuItem>
                    <MenuItem value="volunteer">{t('roles.volunteer')}</MenuItem>
                  </TextField>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField
                    label={t('city')}
                    value={filters.city}
                    onChange={(e) => updateFilter('city', e.target.value)}
                    size="small"
                    fullWidth
                    placeholder={t('cityPlaceholder')}
                  />
                  <TextField
                    select
                    label={t('skill')}
                    value={filters.skill}
                    onChange={(e) => updateFilter('skill', e.target.value)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">{t('allSkills')}</MenuItem>
                    {skills.map((skill) => (
                      <MenuItem key={skill.id} value={skill.id}>
                        {skill.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label={t('accessStatus')}
                    value={filters.is_active}
                    onChange={(e) => updateFilter('is_active', e.target.value)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">{t('allStatuses')}</MenuItem>
                    <MenuItem value="true">{t('allowed')}</MenuItem>
                    <MenuItem value="false">{t('blocked')}</MenuItem>
                  </TextField>
                </Stack>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {filters.city.trim() && (
                <Chip size="small" label={`${t('city')}: ${filters.city.trim()}`} />
              )}
              {skillName && <Chip size="small" label={`${t('skill')}: ${skillName}`} />}
              {filters.role && (
                <Chip size="small" label={`${t('role')}: ${t(`roles.${filters.role}`)}`} />
              )}
              {filters.is_active && (
                <Chip
                  size="small"
                  label={`${t('accessStatus')}: ${
                    filters.is_active === 'true' ? t('allowed') : t('blocked')
                  }`}
                />
              )}
              {filters.search.trim() && (
                <Chip size="small" label={`${t('searchPlaceholder')}: ${filters.search.trim()}`} />
              )}
            </Stack>

            <Alert
              severity={matchedCount > 0 ? 'info' : 'warning'}
              sx={{ borderRadius: 2.5, '& .MuiAlert-message': { width: '100%' } }}
            >
              <Typography variant="body2" fontWeight={700}>
                {previewQuery.isFetching
                  ? t('actions.loading', { ns: 'common' })
                  : t('export.matchCount', { count: toPersianDigits(matchedCount) })}
              </Typography>
            </Alert>
          </Stack>
        ) : (
          <Stack spacing={2.25}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgba(99, 102, 241, 0.12)',
                  color: '#4f46e5',
                }}
              >
                <ViewColumnOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800}>
                  {t('export.columnsTitle')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('export.columnsHint', { count: toPersianDigits(matchedCount) })}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.25,
              }}
            >
              {columns.map((column) => {
                const selected = selectedKeys.includes(column.key);
                return (
                  <Box
                    key={column.key}
                    onClick={() => !exporting && toggleKey(column.key)}
                    sx={{
                      cursor: exporting ? 'default' : 'pointer',
                      p: 1.5,
                      borderRadius: 2.5,
                      border: 1,
                      borderColor: selected ? 'rgba(34, 211, 238, 0.45)' : 'divider',
                      bgcolor: selected ? 'rgba(34, 211, 238, 0.08)' : 'transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'rgba(34, 211, 238, 0.4)',
                        bgcolor: 'rgba(34, 211, 238, 0.05)',
                      },
                    }}
                  >
                    <FormControlLabel
                      sx={{ m: 0, width: '100%', pointerEvents: 'none' }}
                      control={<Checkbox checked={selected} size="small" sx={{ p: 0.5, ml: 0.5 }} />}
                      label={
                        <Typography variant="body2" fontWeight={700} sx={{ mr: 1 }}>
                          {column.label}
                        </Typography>
                      }
                    />
                  </Box>
                );
              })}
            </Box>
          </Stack>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2.5 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <GhostButton onClick={onClose} disabled={exporting}>
          {t('actions.cancel', { ns: 'common' })}
        </GhostButton>
        <Box sx={{ flex: 1 }} />
        {step === 2 && (
          <GhostButton onClick={() => setStep(1)} disabled={exporting}>
            {t('export.back')}
          </GhostButton>
        )}
        {step === 1 ? (
          <GradientButton onClick={handleNext} disabled={previewQuery.isFetching}>
            {t('export.next')}
          </GradientButton>
        ) : (
          <GradientButton
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => void handleExport()}
            disabled={exporting || selectedKeys.length === 0}
          >
            {exporting ? t('export.preparing') : t('export.download')}
          </GradientButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  MenuItem,
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
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GhostButton, GlassCard, GradientButton, JalaliDateField } from '@/shared/components/ui';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type { AccountUser, AuditLog, PaginatedResponse } from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';

const actionLabels: Record<string, string> = {
  create: 'ایجاد',
  update: 'ویرایش',
  delete: 'حذف',
  login: 'ورود',
  logout: 'خروج',
  view: 'مشاهده',
  approve: 'تأیید',
  assign: 'تخصیص',
};

const resourceTypeLabels: Record<string, string> = {
  user: 'کاربر',
  disaster: 'بحران',
  mission: 'مأموریت',
  volunteer: 'داوطلب',
  ticket: 'تیکت',
  report: 'گزارش',
  assignment: 'تکلیف',
  mission_application: 'درخواست مأموریت',
  notification: 'اعلان',
  role: 'نقش',
  permission: 'دسترسی',
  backup_run: 'بکاپ',
  backup_restore: 'ری‌استور',
};

const roleLabels: Record<string, string> = {
  admin: 'مدیر اصلی',
  coordinator: 'هماهنگ‌کننده',
  volunteer: 'داوطلب',
};

/** Localize leftover English resource keys in API change summaries. */
function formatChangeSummary(summary?: string | null) {
  if (!summary?.trim()) return '—';
  let text = summary;
  for (const [key, label] of Object.entries(resourceTypeLabels)) {
    text = text.replaceAll(key, label);
  }
  return text;
}

const PAGE_SIZE = 15;

type AuditSearchFilters = {
  action: string;
  resource_type: string;
  user_id: string;
  ip_address: string;
  created_at_after: string | null;
  created_at_before: string | null;
  search: string;
};

const emptyAuditFilters: AuditSearchFilters = {
  action: '',
  resource_type: '',
  user_id: '',
  ip_address: '',
  created_at_after: null,
  created_at_before: null,
  search: '',
};

function buildAuditParams(filters: AuditSearchFilters, page: number) {
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(PAGE_SIZE),
    ordering: '-created_at',
  };
  if (filters.action) params.action = filters.action;
  if (filters.resource_type) params.resource_type = filters.resource_type;
  if (filters.user_id.trim()) params.user_id = filters.user_id.trim();
  if (filters.ip_address.trim()) params.ip_address = filters.ip_address.trim();
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.created_at_after) params.created_at_after = `${filters.created_at_after}T00:00:00`;
  if (filters.created_at_before) params.created_at_before = `${filters.created_at_before}T23:59:59`;
  return params;
}

function countActiveFilters(filters: AuditSearchFilters) {
  return [
    filters.action,
    filters.resource_type,
    filters.user_id.trim(),
    filters.ip_address.trim(),
    filters.search.trim(),
    filters.created_at_after,
    filters.created_at_before,
  ].filter(Boolean).length;
}

function getUserDisplayName(user: AccountUser) {
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return fullName || user.email;
}

function getUserInitial(user: AccountUser) {
  const name = getUserDisplayName(user);
  return name.charAt(0).toUpperCase();
}

function getActionLabel(action: string): string {
  return actionLabels[action] ?? action;
}

function getResourceTypeLabel(resourceType: string): string {
  return resourceTypeLabels[resourceType] ?? resourceType;
}

function formatAuditDate(value: string): string {
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR'));
}

function formatAuditTime(value: string): string {
  const formatted = new Date(value).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return toPersianDigits(formatted);
}

function AdvancedSearchToolbar({
  open,
  onToggle,
  activeCount,
  summary,
  progress,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  activeCount: number;
  summary?: string;
  progress?: { current: number; total: number };
  children: ReactNode;
}) {
  const progressValue =
    progress && progress.total > 0
      ? Math.min(100, (progress.current / progress.total) * 100)
      : 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          p: { xs: 1.25, md: 1.5 },
          borderRadius: 3,
          border: 1,
          borderColor: open || activeCount > 0 ? 'rgba(34, 211, 238, 0.35)' : 'divider',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)'
              : 'linear-gradient(135deg, rgba(34, 211, 238, 0.06) 0%, rgba(99, 102, 241, 0.04) 100%)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: open ? '0 8px 24px rgba(34, 211, 238, 0.08)' : 'none',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.25}
        >
          <Stack direction="row" alignItems="center" spacing={1.25} flexWrap="wrap" useFlexGap>
            <Button
              onClick={onToggle}
              variant={open ? 'contained' : 'outlined'}
              startIcon={
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.25,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: open ? 'rgba(255,255,255,0.18)' : 'rgba(34, 211, 238, 0.12)',
                  }}
                >
                  <FilterListOutlinedIcon sx={{ fontSize: 17 }} />
                </Box>
              }
              endIcon={
                <ExpandMoreOutlinedIcon
                  sx={{
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease',
                  }}
                />
              }
              sx={{
                borderRadius: 2.5,
                fontWeight: 800,
                px: 1.75,
                py: 1,
                ...(!open && {
                  borderColor: 'rgba(34, 211, 238, 0.35)',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(34, 211, 238, 0.08)',
                  },
                }),
              }}
            >
              جستجوی پیشرفته
            </Button>
            {activeCount > 0 && (
              <Chip
                size="small"
                color="primary"
                label={`${toPersianDigits(activeCount)} فیلتر فعال`}
                sx={{ fontWeight: 700, height: 26 }}
              />
            )}
          </Stack>

          {summary && (
            <Box
              sx={{
                px: 1.5,
                py: 0.85,
                borderRadius: 99,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                minWidth: { sm: 190 },
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {summary}
              </Typography>
              {progress && progress.total > 0 && (
                <Box
                  sx={{
                    mt: 0.75,
                    height: 4,
                    borderRadius: 99,
                    bgcolor: 'action.hover',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${progressValue}%`,
                      height: '100%',
                      borderRadius: 99,
                      background: 'linear-gradient(90deg, #22d3ee, #6366f1)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </Stack>
      </Box>

      <Collapse in={open}>
        <Box
          sx={{
            mt: 1.5,
            p: { xs: 1.75, md: 2.25 },
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 12px 32px rgba(0, 0, 0, 0.28)'
                : '0 12px 32px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
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
              <SearchOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={800}>
                فیلترهای جستجو
              </Typography>
              <Typography variant="caption" color="text.secondary">
                مقادیر را وارد کنید و سپس «اعمال فیلتر» را بزنید
              </Typography>
            </Box>
          </Stack>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function AuditLogsPage() {
  const { t } = useTranslation('common');

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AuditSearchFilters>(emptyAuditFilters);
  const [appliedFilters, setAppliedFilters] = useState<AuditSearchFilters>(emptyAuditFilters);

  const {
    data: accountsData,
    isLoading: accountsLoading,
    isError: accountsError,
  } = useQuery({
    queryKey: ['accounts-users', 'audit-logs'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<AccountUser>>(
        endpoints.accounts.users,
        { params: { page_size: 200 } },
      );
      return response;
    },
  });

  const accounts = accountsData?.results ?? [];
  const selectedAccount = useMemo(() => {
    const id = draftFilters.user_id.trim();
    if (!id) return null;
    return accounts.find((u) => u.id === id) ?? null;
  }, [accounts, draftFilters.user_id]);

  const {
    data: auditData,
    isLoading: auditLoading,
    isError: auditError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['audit-logs', appliedFilters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data: response } = await apiClient.get<PaginatedResponse<AuditLog>>(
        endpoints.auditLogs.list,
        { params: buildAuditParams(appliedFilters, pageParam) },
      );
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
  });

  const logs = useMemo(
    () => auditData?.pages.flatMap((page) => page.results) ?? [],
    [auditData?.pages],
  );
  const totalLogs = auditData?.pages[0]?.count ?? 0;
  const activeFilterCount = countActiveFilters(appliedFilters);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...draftFilters });
  };

  const handleClearFilters = () => {
    setDraftFilters(emptyAuditFilters);
    setAppliedFilters(emptyAuditFilters);
  };

  const applyUserFilter = (user: AccountUser | null) => {
    const userId = user?.id ?? '';
    setDraftFilters((prev) => ({ ...prev, user_id: userId }));
    setAppliedFilters((prev) => ({ ...prev, user_id: userId }));
  };

  const updateDraftFilter = <K extends keyof AuditSearchFilters>(
    field: K,
    value: AuditSearchFilters[K],
  ) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
        <HistoryOutlinedIcon color="primary" />
        <Typography variant="h4" fontWeight={800}>
          {t('nav.audit')}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        ردیابی فعالیت‌های کاربران و رویدادهای مهم سامانه
      </Typography>

      {auditError && <Alert severity="error">{t('actions.error')}</Alert>}

      <GlassCard
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 2.5,
          border: 1,
          borderColor: selectedAccount ? 'rgba(34, 211, 238, 0.35)' : 'divider',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(99, 102, 241, 0.03) 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(34, 211, 238, 0.14)',
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              <PersonSearchOutlinedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800}>
                فیلتر بر اساس کاربر
              </Typography>
              <Typography variant="body2" color="text.secondary">
                یک حساب را انتخاب کنید تا فقط فعالیت‌های همان کاربر نمایش داده شود.
              </Typography>
              {selectedAccount ? (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  avatar={
                    <Avatar sx={{ width: 22, height: 22, fontSize: 12 }}>
                      {getUserInitial(selectedAccount)}
                    </Avatar>
                  }
                  label={`${getUserDisplayName(selectedAccount)} — ${selectedAccount.email}`}
                  onDelete={() => applyUserFilter(null)}
                  sx={{ mt: 1, maxWidth: '100%', fontWeight: 700 }}
                />
              ) : null}
            </Box>
          </Stack>

          <Autocomplete
            sx={{ width: { xs: '100%', md: 360 }, flexShrink: 0 }}
            loading={accountsLoading}
            options={accounts}
            value={selectedAccount}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => getUserDisplayName(option)}
            filterOptions={(options, state) => {
              const q = state.inputValue.trim().toLowerCase();
              if (!q) return options;
              return options.filter((u) => {
                const hay = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
                return hay.includes(q);
              });
            }}
            onChange={(_, value) => applyUserFilter(value)}
            renderOption={(props, option) => {
              const { key, ...rest } = props as typeof props & { key?: string };
              return (
                <Box
                  component="li"
                  key={key ?? option.id}
                  {...rest}
                  sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}
                >
                  <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
                    {getUserInitial(option)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {getUserDisplayName(option)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                fullWidth
                inputProps={{
                  ...params.inputProps,
                  'aria-label': 'انتخاب کاربر',
                }}
              />
            )}
            noOptionsText={accountsError ? 'خطا در بارگذاری کاربران' : 'کاربری یافت نشد'}
            clearOnEscape
          />
        </Stack>
      </GlassCard>

      <GlassCard sx={{ p: { xs: 2, md: 2.5 } }}>
        <AdvancedSearchToolbar
          open={filtersOpen}
          onToggle={() => setFiltersOpen((prev) => !prev)}
          activeCount={activeFilterCount}
          summary={
            totalLogs > 0
              ? `نمایش ${toPersianDigits(logs.length)} از ${toPersianDigits(totalLogs)} رکورد`
              : undefined
          }
          progress={totalLogs > 0 ? { current: logs.length, total: totalLogs } : undefined}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                select
                label="عملیات"
                value={draftFilters.action}
                onChange={(e) => updateDraftFilter('action', e.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="">همه</MenuItem>
                {Object.entries(actionLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="نوع منبع"
                value={draftFilters.resource_type}
                onChange={(e) => updateDraftFilter('resource_type', e.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="">همه</MenuItem>
                {Object.entries(resourceTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <Autocomplete
                loading={accountsLoading}
                options={accounts}
                value={selectedAccount}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => getUserDisplayName(option)}
                filterOptions={(options, state) => {
                  const q = state.inputValue.trim().toLowerCase();
                  if (!q) return options;
                  return options.filter((u) => {
                    const hay = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
                    return hay.includes(q);
                  });
                }}
                onChange={(_, value) => {
                  setDraftFilters((prev) => ({ ...prev, user_id: value?.id ?? '' }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    fullWidth
                    inputProps={{
                      ...params.inputProps,
                      'aria-label': 'کاربر',
                    }}
                  />
                )}
                noOptionsText={accountsError ? 'خطا در بارگذاری کاربران' : 'کاربری یافت نشد'}
                clearOnEscape
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                label="آدرس IP"
                value={draftFilters.ip_address}
                onChange={(e) => updateDraftFilter('ip_address', e.target.value)}
                size="small"
                fullWidth
                placeholder="مثال: 172.20.0.1"
              />
              <JalaliDateField
                label="از تاریخ"
                value={draftFilters.created_at_after}
                onChange={(value) => updateDraftFilter('created_at_after', value)}
              />
              <JalaliDateField
                label="تا تاریخ"
                value={draftFilters.created_at_before}
                onChange={(value) => updateDraftFilter('created_at_before', value)}
              />
            </Stack>

            <TextField
              label="جستجوی متنی"
              value={draftFilters.search}
              onChange={(e) => updateDraftFilter('search', e.target.value)}
              size="small"
              fullWidth
              placeholder="شناسه منبع، همبستگی، IP و..."
            />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{
                pt: 0.5,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <GradientButton
                startIcon={<SearchOutlinedIcon />}
                onClick={handleApplyFilters}
                sx={{ minWidth: 140 }}
              >
                اعمال فیلتر
              </GradientButton>
              <GhostButton
                startIcon={<ClearOutlinedIcon />}
                onClick={handleClearFilters}
                disabled={activeFilterCount === 0 && !countActiveFilters(draftFilters)}
              >
                پاک کردن
              </GhostButton>
            </Stack>
          </Stack>
        </AdvancedSearchToolbar>

        <TableContainer>
          <Table size="small">
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>عملیات</TableCell>
                <TableCell>منبع</TableCell>
                <TableCell>آخرین تغییر</TableCell>
                <TableCell>کاربر</TableCell>
                <TableCell>نقش</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>تاریخ</TableCell>
                <TableCell>ساعت</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {t('actions.loading')}
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {t('actions.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Chip
                        size="small"
                        label={getActionLabel(log.action)}
                        variant="outlined"
                        color={
                          log.action === 'login'
                            ? 'success'
                            : log.action === 'logout'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{getResourceTypeLabel(log.resource_type)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatChangeSummary(log.change_summary)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {log.user_name ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.user_roles && log.user_roles.length > 0 ? (
                        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
                          {log.user_roles.map((role) => (
                            <Chip
                              key={role}
                              size="small"
                              label={roleLabels[role] ?? role}
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                        {log.ip_address ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatAuditDate(log.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatAuditTime(log.created_at)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {hasNextPage && (
          <Stack alignItems="center" sx={{ pt: 2.5 }}>
            <Button
              variant="outlined"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              sx={{
                borderRadius: 99,
                fontWeight: 800,
                minWidth: 240,
                px: 3,
                py: 1.1,
                borderColor: 'rgba(34, 211, 238, 0.4)',
                color: 'primary.main',
                bgcolor: 'rgba(34, 211, 238, 0.06)',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(34, 211, 238, 0.12)',
                },
              }}
            >
              {isFetchingNextPage
                ? t('actions.loading')
                : `نمایش ${toPersianDigits(PAGE_SIZE)} مورد بیشتر`}
            </Button>
          </Stack>
        )}
      </GlassCard>
    </Box>
  );
}

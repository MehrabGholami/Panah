import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/pagination';
import {
  GhostButton,
  GlassCard,
  GradientButton,
  TablePagination,
  UserAvatar,
} from '@/shared/components/ui';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type { AccountUser, PaginatedResponse, Skill } from '@/shared/types';
import type { CsvColumn } from '@/shared/utils/csvExport';
import { toPersianDigits } from '@/shared/utils/persianDigits';
import { usePermissions } from '@/shared/hooks/useAuth';
import { SendMessageDialog } from '@/features/tickets/SendMessageDialog';
import {
  UsersExportCsvDialog,
  type UsersExportFilters,
} from '@/features/admin/UsersExportCsvDialog';

type UserFilters = UsersExportFilters;

const emptyFilters: UserFilters = {
  search: '',
  role: '',
  is_active: '',
  city: '',
  skill: '',
};

const roleChipSx: Record<string, SxProps<Theme>> = {
  admin: {
    bgcolor: 'rgba(99, 102, 241, 0.1)',
    color: '#4f46e5',
    borderColor: 'rgba(99, 102, 241, 0.28)',
    fontWeight: 700,
  },
  coordinator: {
    bgcolor: 'rgba(34, 211, 238, 0.1)',
    color: '#0891b2',
    borderColor: 'rgba(34, 211, 238, 0.28)',
    fontWeight: 700,
  },
  volunteer: {
    bgcolor: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
    borderColor: 'rgba(16, 185, 129, 0.28)',
    fontWeight: 700,
  },
};

function buildUserParams(filters: UserFilters, page?: number, pageSize = DEFAULT_PAGE_SIZE) {
  const params: Record<string, string | number> = {};
  if (page) params.page = page;
  params.page_size = pageSize;
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.role) params.role = filters.role;
  if (filters.is_active === 'true' || filters.is_active === 'false') {
    params.is_active = filters.is_active;
  }
  if (filters.city.trim()) params.city = filters.city.trim();
  if (filters.skill) params.skill = filters.skill;
  return params;
}

function countActiveFilters(filters: UserFilters) {
  return [
    filters.search.trim(),
    filters.role,
    filters.is_active,
    filters.city.trim(),
    filters.skill,
  ].filter(Boolean).length;
}

function getUserDisplayName(user: AccountUser): string {
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return fullName || user.email;
}

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

export default function UsersPage() {
  const { t } = useTranslation(['users', 'common']);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManageAccess = hasPermission('accounts.manage_users');
  const canSendMessage = hasPermission('tickets.create');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<UserFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>(emptyFilters);
  const [exportOpen, setExportOpen] = useState(false);
  const [accessTarget, setAccessTarget] = useState<AccountUser | null>(null);
  const [accessNextActive, setAccessNextActive] = useState<boolean | null>(null);
  const [messageTarget, setMessageTarget] = useState<AccountUser | null>(null);

  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['accounts-users', appliedFilters, page],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<AccountUser>>(
        endpoints.accounts.users,
        { params: buildUserParams(appliedFilters, page) },
      );
      return response;
    },
  });

  const { data: totalStats } = useQuery({
    queryKey: ['accounts-users', 'count', 'all'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<AccountUser>>(
        endpoints.accounts.users,
        { params: { page_size: 1 } },
      );
      return response.count;
    },
  });

  const { data: activeStats } = useQuery({
    queryKey: ['accounts-users', 'count', 'active'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<AccountUser>>(
        endpoints.accounts.users,
        { params: { page_size: 1, is_active: true } },
      );
      return response.count;
    },
  });

  const { data: blockedStats } = useQuery({
    queryKey: ['accounts-users', 'count', 'blocked'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<AccountUser>>(
        endpoints.accounts.users,
        { params: { page_size: 1, is_active: false } },
      );
      return response.count;
    },
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['skills-public'],
    queryFn: async () => {
      const { data } = await apiClient.get<Skill[] | PaginatedResponse<Skill>>(
        endpoints.skills.public,
      );
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const accessMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data: response } = await apiClient.patch<AccountUser>(
        endpoints.accounts.userAccess(userId),
        { is_active: isActive },
      );
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts-users'] });
      setAccessTarget(null);
      setAccessNextActive(null);
    },
  });

  const users = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const activeFilterCount = countActiveFilters(appliedFilters);

  const stats = {
    total: totalStats ?? 0,
    active: activeStats ?? 0,
    blocked: blockedStats ?? 0,
  };

  const roleLabel = (slug: string) => t(`roles.${slug}`, { defaultValue: slug });

  const csvColumns: CsvColumn<AccountUser>[] = useMemo(
    () => [
      {
        key: 'id',
        label: t('columns.id'),
        getValue: (row) => row.id,
        defaultSelected: false,
      },
      {
        key: 'fullName',
        label: t('columns.fullName'),
        getValue: (row) => getUserDisplayName(row),
      },
      {
        key: 'email',
        label: t('columns.email'),
        getValue: (row) => row.email,
      },
      {
        key: 'phone',
        label: t('columns.phone'),
        getValue: (row) => row.phone || '',
      },
      {
        key: 'nationalId',
        label: t('columns.nationalId'),
        getValue: (row) => row.national_id || '',
        defaultSelected: false,
      },
      {
        key: 'city',
        label: t('columns.city'),
        getValue: (row) => row.city || '',
      },
      {
        key: 'skills',
        label: t('columns.skills'),
        getValue: (row) => (row.skills ?? []).join(' | '),
      },
      {
        key: 'roles',
        label: t('columns.roles'),
        getValue: (row) => row.roles.map((role) => roleLabel(role)).join(' | '),
      },
      {
        key: 'isActive',
        label: t('columns.isActive'),
        getValue: (row) => (row.is_active ? t('allowed') : t('blocked')),
      },
      {
        key: 'isApproved',
        label: t('columns.isApproved'),
        getValue: (row) => (row.is_approved ? t('allowed') : t('blocked')),
        defaultSelected: false,
      },
      {
        key: 'createdAt',
        label: t('columns.createdAt'),
        getValue: (row) => formatDate(row.created_at),
      },
    ],
    [t],
  );

  const updateDraftFilter = <K extends keyof UserFilters>(field: K, value: UserFilters[K]) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
        data-tour="page-users-header"
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
            <ManageAccountsOutlinedIcon color="primary" />
            <Typography variant="h4" fontWeight={800}>
              {t('title')}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t('subtitle')}
          </Typography>
        </Box>
        {canManageAccess && (
          <GradientButton
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => setExportOpen(true)}
            sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
          >
            {t('actions.exportCsv')}
          </GradientButton>
        )}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title={t('stats.total')}
            value={toPersianDigits(stats.total)}
            icon={<GroupsOutlinedIcon fontSize="small" />}
            accent="rgba(34, 211, 238, 0.12)"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title={t('stats.active')}
            value={toPersianDigits(stats.active)}
            icon={<CheckCircleOutlineIcon fontSize="small" />}
            accent="rgba(16, 185, 129, 0.12)"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title={t('stats.blocked')}
            value={toPersianDigits(stats.blocked)}
            icon={<BlockOutlinedIcon fontSize="small" />}
            accent="rgba(239, 68, 68, 0.12)"
          />
        </Box>
      </Stack>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>{t('actions.error', { ns: 'common' })}</Alert>}

      <GlassCard sx={{ p: { xs: 2, md: 2.5 } }}>
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              p: { xs: 1.25, md: 1.5 },
              borderRadius: 3,
              border: 1,
              borderColor: filtersOpen || activeFilterCount > 0 ? 'rgba(34, 211, 238, 0.35)' : 'divider',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(34, 211, 238, 0.06) 0%, rgba(99, 102, 241, 0.04) 100%)',
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
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  variant={filtersOpen ? 'contained' : 'outlined'}
                  startIcon={
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.25,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: filtersOpen ? 'rgba(255,255,255,0.18)' : 'rgba(34, 211, 238, 0.12)',
                      }}
                    >
                      <FilterListOutlinedIcon sx={{ fontSize: 17 }} />
                    </Box>
                  }
                  endIcon={
                    <ExpandMoreOutlinedIcon
                      sx={{
                        transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                      }}
                    />
                  }
                  sx={{
                    borderRadius: 2.5,
                    fontWeight: 800,
                    px: 1.75,
                    py: 1,
                    ...(!filtersOpen && {
                      borderColor: 'rgba(34, 211, 238, 0.35)',
                      color: 'primary.main',
                    }),
                  }}
                >
                  {t('advancedSearch')}
                </Button>
                {activeFilterCount > 0 && (
                  <Chip
                    size="small"
                    color="primary"
                    label={`${toPersianDigits(activeFilterCount)} فیلتر فعال`}
                    sx={{ fontWeight: 700, height: 26 }}
                  />
                )}
              </Stack>
            </Stack>

            <Collapse in={filtersOpen}>
              <Stack spacing={2} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField
                    label={t('searchPlaceholder')}
                    value={draftFilters.search}
                    onChange={(e) => updateDraftFilter('search', e.target.value)}
                    size="small"
                    fullWidth
                    placeholder={t('searchPlaceholder')}
                  />
                  <TextField
                    select
                    label={t('role')}
                    value={draftFilters.role}
                    onChange={(e) => updateDraftFilter('role', e.target.value)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">{t('allRoles')}</MenuItem>
                    <MenuItem value="admin">{t('roles.admin')}</MenuItem>
                    <MenuItem value="coordinator">{t('roles.coordinator')}</MenuItem>
                    <MenuItem value="volunteer">{t('roles.volunteer')}</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label={t('accessStatus')}
                    value={draftFilters.is_active}
                    onChange={(e) => updateDraftFilter('is_active', e.target.value)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">{t('allStatuses')}</MenuItem>
                    <MenuItem value="true">{t('allowed')}</MenuItem>
                    <MenuItem value="false">{t('blocked')}</MenuItem>
                  </TextField>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField
                    label={t('city')}
                    value={draftFilters.city}
                    onChange={(e) => updateDraftFilter('city', e.target.value)}
                    size="small"
                    fullWidth
                    placeholder={t('cityPlaceholder')}
                  />
                  <TextField
                    select
                    label={t('skill')}
                    value={draftFilters.skill}
                    onChange={(e) => updateDraftFilter('skill', e.target.value)}
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
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <GradientButton
                    startIcon={<SearchOutlinedIcon />}
                    onClick={() => setAppliedFilters({ ...draftFilters })}
                    sx={{ minWidth: 140 }}
                  >
                    {t('applyFilters')}
                  </GradientButton>
                  <GhostButton
                    startIcon={<ClearOutlinedIcon />}
                    onClick={() => {
                      setDraftFilters(emptyFilters);
                      setAppliedFilters(emptyFilters);
                    }}
                  >
                    {t('clearFilters')}
                  </GhostButton>
                </Stack>
              </Stack>
            </Collapse>
          </Box>
        </Box>

        <TableContainer sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>{t('table.fullName')}</TableCell>
                <TableCell>{t('table.phone')}</TableCell>
                <TableCell>{t('table.nationalId')}</TableCell>
                <TableCell>{t('table.roles')}</TableCell>
                <TableCell>{t('table.status')}</TableCell>
                <TableCell>{t('table.registeredAt')}</TableCell>
                <TableCell align="left">{t('table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    {t('actions.loading', { ns: 'common' })}
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const displayName = getUserDisplayName(user);
                  const isAdminUser = user.roles.includes('admin');
                  return (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{
                        ...(!user.is_active && {
                          bgcolor: 'rgba(239, 68, 68, 0.04)',
                        }),
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <UserAvatar
                            name={displayName}
                            sx={{
                              width: 42,
                              height: 42,
                              fontWeight: 800,
                              bgcolor: isAdminUser
                                ? 'rgba(99, 102, 241, 0.14)'
                                : 'rgba(34, 211, 238, 0.14)',
                              color: isAdminUser ? '#4f46e5' : 'primary.main',
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {user.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.phone ? toPersianDigits(user.phone) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.national_id ? toPersianDigits(user.national_id) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
                          {user.roles.map((role) => (
                            <Chip
                              key={role}
                              size="small"
                              label={roleLabel(role)}
                              variant="outlined"
                              sx={roleChipSx[role]}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={
                            user.is_active ? <CheckCircleOutlineIcon /> : <BlockOutlinedIcon />
                          }
                          label={user.is_active ? t('allowed') : t('blocked')}
                          color={user.is_active ? 'success' : 'error'}
                          variant={user.is_active ? 'outlined' : 'filled'}
                          sx={{ fontWeight: 700, '& .MuiChip-icon': { fontSize: 16 } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(user.created_at)}</Typography>
                      </TableCell>
                      <TableCell align="left">
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {canSendMessage && user.is_active && (
                            <Tooltip title={t('actions.sendMessage', { ns: 'users' })}>
                              <Button
                                size="small"
                                color="primary"
                                variant="outlined"
                                startIcon={<SendOutlinedIcon />}
                                onClick={() => setMessageTarget(user)}
                                sx={{ borderRadius: 2, fontWeight: 700 }}
                              >
                                {t('actions.sendMessage', { ns: 'users' })}
                              </Button>
                            </Tooltip>
                          )}
                          {isAdminUser ? (
                            <Chip
                              size="small"
                              icon={<ShieldOutlinedIcon />}
                              label={t('actions.systemAdmin')}
                              variant="outlined"
                              sx={{ fontWeight: 700 }}
                            />
                          ) : canManageAccess ? (
                            <Tooltip
                              title={user.is_active ? t('actions.block') : t('actions.unblock')}
                            >
                              <Button
                                size="small"
                                color={user.is_active ? 'error' : 'success'}
                                variant="outlined"
                                onClick={() => {
                                  setAccessTarget(user);
                                  setAccessNextActive(!user.is_active);
                                }}
                                sx={{ borderRadius: 2, fontWeight: 700 }}
                              >
                                {user.is_active ? t('actions.block') : t('actions.unblock')}
                              </Button>
                            </Tooltip>
                          ) : null}
                        </Stack>
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
          onPageChange={setPage}
          disabled={isFetching}
        />
      </GlassCard>

      <Dialog
        open={Boolean(accessTarget)}
        onClose={() => {
          if (!accessMutation.isPending) {
            setAccessTarget(null);
            setAccessNextActive(null);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {accessNextActive ? t('unblockConfirmTitle') : t('blockConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {accessNextActive
              ? t('unblockConfirmMessage', {
                  name: accessTarget ? getUserDisplayName(accessTarget) : '',
                })
              : t('blockConfirmMessage', {
                  name: accessTarget ? getUserDisplayName(accessTarget) : '',
                })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setAccessTarget(null);
              setAccessNextActive(null);
            }}
            disabled={accessMutation.isPending}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={() => {
              if (!accessTarget || accessNextActive === null) return;
              accessMutation.mutate({
                userId: accessTarget.id,
                isActive: accessNextActive,
              });
            }}
            color={accessNextActive ? 'success' : 'error'}
            variant="contained"
            disabled={accessMutation.isPending}
          >
            {accessMutation.isPending
              ? '...'
              : accessNextActive
                ? t('actions.unblock')
                : t('actions.block')}
          </Button>
        </DialogActions>
      </Dialog>

      <UsersExportCsvDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        initialFilters={appliedFilters}
        onFiltersCommit={(filters) => {
          setDraftFilters(filters);
          setAppliedFilters(filters);
        }}
        columns={csvColumns}
        filename={t('export.filename')}
        buildParams={(filters) => buildUserParams(filters)}
      />

      <SendMessageDialog
        open={Boolean(messageTarget)}
        onClose={() => setMessageTarget(null)}
        recipientId={messageTarget?.id ?? ''}
        recipientName={messageTarget ? getUserDisplayName(messageTarget) : ''}
      />
    </Box>
  );
}

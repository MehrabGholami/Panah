import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard } from '@/shared/components/ui';
import type { AccountUser, PaginatedResponse, Permission, Role } from '@/shared/types';
import { getPermissionLabel } from '@/shared/utils/permissionLabels';
import { toPersianDigits } from '@/shared/utils/persianDigits';

const roleLabels: Record<string, string> = {
  admin: 'مدیر اصلی',
  coordinator: 'هماهنگ‌کننده',
  volunteer: 'داوطلب',
};

const VISIBLE_PERMISSIONS = 4;
const MIN_USER_SEARCH_LENGTH = 2;

function getUserFullName(user: AccountUser) {
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return fullName || user.email;
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
    <GlassCard sx={{ p: 2.25, height: '100%' }}>
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
            color: 'primary.main',
            bgcolor: accent,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </GlassCard>
  );
}

function RoleMembersCard({
  title,
  description,
  users,
  isLoading,
  isError,
  accent,
  icon,
}: {
  title: string;
  description: string;
  users: AccountUser[];
  isLoading: boolean;
  isError: boolean;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <GlassCard sx={{ p: 2.5, height: '100%' }}>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              bgcolor: accent,
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Stack>
        <Chip
          size="small"
          label={`${users.length.toLocaleString('fa-IR')} نفر`}
          sx={{
            fontWeight: 700,
            bgcolor: accent,
            flexShrink: 0,
          }}
        />
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          بارگذاری فهرست کاربران با خطا مواجه شد.
        </Alert>
      )}

      <TableContainer
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          // برای نقش‌هایی مثل "هماهنگ‌کننده" که تعداد ردیف‌ها بیشتر است،
          // ارتفاع محدودِ کم باعث فعال شدن اسکرولِ اضافه می‌شود. فیت و نمایش بهتر.
          maxHeight: { xs: 420, sm: 480, md: 560 },
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>نام</TableCell>
              <TableCell>ایمیل</TableCell>
              <TableCell>کد ملی</TableCell>
              <TableCell>وضعیت</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  در حال بارگذاری…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    کاربری با این نقش یافت نشد.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: 12,
                          fontWeight: 700,
                          bgcolor: accent,
                          color: 'primary.main',
                        }}
                      >
                        {(user.first_name || user.email || '?').charAt(0)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {getUserFullName(user)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.national_id?.trim() ? toPersianDigits(user.national_id) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.is_active ? 'فعال' : 'غیرفعال'}
                      color={user.is_active ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </GlassCard>
  );
}

function RolePermissionsCell({ permissions }: { permissions: Permission[] }) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(permissions.length - VISIBLE_PERMISSIONS, 0);
  const visiblePermissions = expanded ? permissions : permissions.slice(0, VISIBLE_PERMISSIONS);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {visiblePermissions.map((perm) => (
        <Chip
          key={perm.id}
          label={getPermissionLabel(perm.codename)}
          size="small"
          variant="outlined"
          onClick={hiddenCount > 0 && !expanded ? () => setExpanded(true) : undefined}
          sx={hiddenCount > 0 && !expanded ? { cursor: 'pointer' } : undefined}
        />
      ))}
      {hiddenCount > 0 && !expanded && (
        <Chip
          label={`+${hiddenCount.toLocaleString('fa-IR')}`}
          size="small"
          clickable
          onClick={() => setExpanded(true)}
          sx={{
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
          }}
        />
      )}
      {expanded && hiddenCount > 0 && (
        <Chip
          label="کمتر"
          size="small"
          variant="outlined"
          clickable
          onClick={() => setExpanded(false)}
        />
      )}
    </Box>
  );
}

export default function RolesPage() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AccountUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [assignFeedback, setAssignFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [userInput, setUserInput] = useState('');
  const [userTyping, setUserTyping] = useState(false);
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedUserSearch(userInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [userInput]);

  const {
    data: rolesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<Role>>(
        endpoints.accounts.roles,
      );
      return response;
    },
  });

  const { data: userSearchData, isFetching: userSearchFetching } = useQuery({
    queryKey: ['accounts-users', 'role-assign-search', debouncedUserSearch],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<AccountUser>>(
        endpoints.accounts.users,
        {
          params: {
            search: debouncedUserSearch,
            page_size: 30,
          },
        },
      );
      return response;
    },
    enabled: debouncedUserSearch.length >= MIN_USER_SEARCH_LENGTH,
  });

  const {
    data: adminsData,
    isLoading: adminsLoading,
    isError: adminsError,
  } = useQuery({
    queryKey: ['accounts-users', 'by-role', 'admin'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<AccountUser>>(
        endpoints.accounts.users,
        { params: { role: 'admin', page_size: 100 } },
      );
      return response;
    },
  });

  const {
    data: coordinatorsData,
    isLoading: coordinatorsLoading,
    isError: coordinatorsError,
  } = useQuery({
    queryKey: ['accounts-users', 'by-role', 'coordinator'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<AccountUser>>(
        endpoints.accounts.users,
        { params: { role: 'coordinator', page_size: 100 } },
      );
      return response;
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleSlugs }: { userId: string; roleSlugs: string[] }) => {
      const { data } = await apiClient.patch<AccountUser>(endpoints.accounts.userRoles(userId), {
        role_slugs: roleSlugs,
      });
      return data;
    },
    onSuccess: async (updatedUser) => {
      await queryClient.invalidateQueries({ queryKey: ['accounts-users'] });
      setSelectedUser(updatedUser);
      setUserInput(getUserFullName(updatedUser));
      setUserTyping(false);
      setSelectedRole(null);
      setAssignFeedback({
        type: 'success',
        message: 'نقش با موفقیت تخصیص یافت.',
      });
    },
    onError: () => {
      setAssignFeedback({
        type: 'error',
        message: 'تخصیص نقش انجام نشد. لطفاً دوباره تلاش کنید.',
      });
    },
  });

  const roles = rolesData?.results ?? [];
  const admins = adminsData?.results ?? [];
  const coordinators = coordinatorsData?.results ?? [];
  const searchedUsers = userSearchData?.results ?? [];
  const userOptions = useMemo(() => {
    if (!selectedUser) return searchedUsers;
    if (searchedUsers.some((user) => user.id === selectedUser.id)) return searchedUsers;
    return [selectedUser, ...searchedUsers];
  }, [searchedUsers, selectedUser]);

  const handleSelectUser = (user: AccountUser | null) => {
    setSelectedUser(user);
    setAssignFeedback(null);
    setUserTyping(false);
    if (user) {
      setUserInput(getUserFullName(user));
    }
  };

  const handleAssignRole = () => {
    if (!selectedUser || !selectedRole) return;
    setAssignFeedback(null);
    assignRoleMutation.mutate({ userId: selectedUser.id, roleSlugs: [selectedRole.slug] });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        {t('nav.roles')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        مدیریت نقش‌ها، دسترسی‌ها و تخصیص به داوطلب‌ها
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title="تعداد نقش‌ها"
            value={roles.length.toLocaleString('fa-IR')}
            icon={<AdminPanelSettingsOutlinedIcon fontSize="small" />}
            accent="rgba(34, 211, 238, 0.12)"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title="کل دسترسی‌ها"
            value={roles
              .reduce((sum, role) => sum + role.permissions.length, 0)
              .toLocaleString('fa-IR')}
            icon={<SecurityOutlinedIcon fontSize="small" />}
            accent="rgba(99, 102, 241, 0.14)"
          />
        </Box>
      </Stack>

      {isError && <Alert severity="error">{t('actions.error')}</Alert>}

      <GlassCard sx={{ mb: 2.5 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>نام نقش</TableCell>
                <TableCell>شناسه</TableCell>
                <TableCell>دسترسی‌ها</TableCell>
                <TableCell>نوع</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {t('actions.loading')}
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {t('actions.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: 'rgba(34, 211, 238, 0.12)',
                            color: 'primary.main',
                          }}
                        >
                          <BadgeOutlinedIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" fontWeight={700}>
                          {roleLabels[role.slug] ?? role.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                        {role.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <RolePermissionsCell permissions={role.permissions} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={role.is_system ? 'سیستمی' : 'سفارشی'}
                        color={role.is_system ? 'default' : 'primary'}
                        variant={role.is_system ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
          مدیران و هماهنگ‌کنندگان
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          فهرست کاربران دارای نقش مدیر اصلی یا هماهنگ‌کننده؛ پس از تخصیص نقش، این فهرست به‌روز
          می‌شود.
        </Typography>
        <Stack direction="column" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <RoleMembersCard
              title="مدیران اصلی"
              description="کاربران با نقش مدیر اصلی"
              users={admins}
              isLoading={adminsLoading}
              isError={adminsError}
              accent={alpha('#818CF8', 0.14)}
              icon={<AdminPanelSettingsOutlinedIcon fontSize="small" />}
            />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <RoleMembersCard
              title="هماهنگ‌کنندگان"
              description="کاربران با نقش هماهنگ‌کننده"
              users={coordinators}
              isLoading={coordinatorsLoading}
              isError={coordinatorsError}
              accent={alpha('#22D3EE', 0.14)}
              icon={<GroupsOutlinedIcon fontSize="small" />}
            />
          </Box>
        </Stack>
      </Box>

      <GlassCard sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <AssignmentIndOutlinedIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            تخصیص نقش به کاربران
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          کاربر را با نام، ایمیل یا کد ملی جستجو کنید. هر حساب فقط یک نقش می‌تواند داشته باشد و نقش
          جدید جایگزین نقش قبلی می‌شود.
        </Typography>

        {assignFeedback && (
          <Alert
            severity={assignFeedback.type}
            sx={{ mb: 2 }}
            onClose={() => setAssignFeedback(null)}
          >
            {assignFeedback.message}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <Autocomplete
            sx={{ flex: 1.4 }}
            options={userOptions}
            loading={userSearchFetching}
            value={selectedUser}
            inputValue={userInput}
            onInputChange={(_, value, reason) => {
              if (reason === 'input') {
                setUserInput(value);
                setUserTyping(true);
                if (selectedUser) setSelectedUser(null);
              } else if (reason === 'clear') {
                setUserInput('');
                setUserTyping(false);
                setSelectedUser(null);
              }
            }}
            onChange={(_, value) => handleSelectUser(value)}
            open={userTyping && userInput.trim().length >= MIN_USER_SEARCH_LENGTH}
            openOnFocus={false}
            filterOptions={(options, state) =>
              state.inputValue.trim().length < MIN_USER_SEARCH_LENGTH ? [] : options
            }
            getOptionLabel={getUserFullName}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={
              userInput.trim().length < MIN_USER_SEARCH_LENGTH
                ? 'حداقل ۲ کاراکتر وارد کنید'
                : userSearchFetching
                  ? 'در حال جستجو...'
                  : 'نتیجه‌ای یافت نشد'
            }
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Stack>
                  <Typography variant="body2" fontWeight={700}>
                    {getUserFullName(option)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                    {option.national_id?.trim()
                      ? ` · کد ملی: ${toPersianDigits(option.national_id)}`
                      : ''}
                  </Typography>
                </Stack>
              </Box>
            )}
            renderInput={(params) => (
              <TextField {...params} label="نام یا کد ملی" size="small" />
            )}
          />
          <Autocomplete
            sx={{ flex: 1 }}
            options={roles}
            value={selectedRole}
            onChange={(_, value) => {
              setSelectedRole(value);
              setAssignFeedback(null);
            }}
            getOptionLabel={(option) => roleLabels[option.slug] ?? option.name}
            renderInput={(params) => <TextField {...params} label="نقش" size="small" />}
          />
          <Button
            variant="contained"
            onClick={handleAssignRole}
            disabled={!selectedUser || !selectedRole || assignRoleMutation.isPending}
            sx={{ minWidth: { md: 140 }, alignSelf: { xs: 'stretch', md: 'center' } }}
          >
            تخصیص نقش
          </Button>
        </Stack>

        {selectedUser && (
          <Stack
            direction="row"
            flexWrap="wrap"
            useFlexGap
            spacing={0.75}
            alignItems="center"
            sx={{ mt: 1.75 }}
          >
            <Typography variant="caption" color="text.secondary">
              نقش فعلی:
            </Typography>
            {selectedUser.roles.length > 0 ? (
              <Chip
                size="small"
                label={roleLabels[selectedUser.roles[0]] ?? selectedUser.roles[0]}
                variant="outlined"
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                بدون نقش
              </Typography>
            )}
          </Stack>
        )}
      </GlassCard>
    </Box>
  );
}

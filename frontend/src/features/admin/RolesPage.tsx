import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
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
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard } from '@/shared/components/ui';
import type { PaginatedResponse, Permission, Role } from '@/shared/types';
import { getPermissionLabel } from '@/shared/utils/permissionLabels';
import { toPersianDigits } from '@/shared/utils/persianDigits';
type AccountUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  national_id?: string | null;
  roles: string[];
  created_at: string;
};

const roleLabels: Record<string, string> = {
  admin: 'مدیر اصلی',
  coordinator: 'هماهنگ‌کننده',
  volunteer: 'داوطلب',
};

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

const VISIBLE_PERMISSIONS = 4;
const MIN_USER_SEARCH_LENGTH = 2;

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
  const [nameInput, setNameInput] = useState('');
  const [nationalIdInput, setNationalIdInput] = useState('');
  const [nameTyping, setNameTyping] = useState(false);
  const [nationalIdTyping, setNationalIdTyping] = useState(false);

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

  const { data: usersData, isError: usersError } = useQuery({
    queryKey: ['accounts-users'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<AccountUser>>(
        `${endpoints.accounts.users}?page_size=100`,
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
      setNameInput(getUserFullName(updatedUser));
      setNationalIdInput(
        updatedUser.national_id?.trim() ? toPersianDigits(updatedUser.national_id) : '',
      );
      setNameTyping(false);
      setNationalIdTyping(false);
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
  const users = usersData?.results ?? [];
  const usersWithNationalId = useMemo(
    () => users.filter((user) => user.national_id?.trim()),
    [users],
  );

  const getUserFullName = (user: AccountUser) => {
    const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
    return fullName || user.email;
  };

  const handleSelectUser = (user: AccountUser | null) => {
    setSelectedUser(user);
    setAssignFeedback(null);
    setNameTyping(false);
    setNationalIdTyping(false);
    if (user) {
      setNameInput(getUserFullName(user));
      setNationalIdInput(user.national_id?.trim() ? toPersianDigits(user.national_id) : '');
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

      <GlassCard sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <AssignmentIndOutlinedIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            تخصیص نقش به کاربران
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          کاربر را با کد ملی یا نام انتخاب کنید. هر حساب فقط یک نقش می‌تواند داشته باشد و نقش
          جدید جایگزین نقش قبلی می‌شود.
        </Typography>

        {usersError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('actions.error')}
          </Alert>
        )}

        {assignFeedback && (
          <Alert severity={assignFeedback.type} sx={{ mb: 2 }} onClose={() => setAssignFeedback(null)}>
            {assignFeedback.message}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <Autocomplete
            sx={{ flex: 1 }}
            options={usersWithNationalId}
            value={selectedUser}
            inputValue={nationalIdInput}
            onInputChange={(_, value, reason) => {
              if (reason === 'input') {
                setNationalIdInput(value);
                setNationalIdTyping(true);
                if (selectedUser) {
                  setSelectedUser(null);
                  setNameInput('');
                }
              }
            }}
            onChange={(_, value) => handleSelectUser(value)}
            open={
              nationalIdTyping && nationalIdInput.trim().length >= MIN_USER_SEARCH_LENGTH
            }
            openOnFocus={false}
            getOptionLabel={(user) => toPersianDigits(user.national_id ?? '')}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options, state) => {
              const query = state.inputValue.trim();
              if (query.length < MIN_USER_SEARCH_LENGTH) return [];
              return options.filter((option) => (option.national_id ?? '').includes(query));
            }}
            noOptionsText={
              nationalIdInput.trim().length < MIN_USER_SEARCH_LENGTH
                ? 'حداقل ۲ کاراکتر وارد کنید'
                : 'نتیجه‌ای یافت نشد'
            }
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Stack>
                  <Typography variant="body2" fontWeight={700}>
                    {toPersianDigits(option.national_id ?? '')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getUserFullName(option)}
                  </Typography>
                </Stack>
              </Box>
            )}
            renderInput={(params) => <TextField {...params} label="کد ملی" size="small" />}
          />
          <Autocomplete
            sx={{ flex: 1 }}
            options={users}
            value={selectedUser}
            inputValue={nameInput}
            onInputChange={(_, value, reason) => {
              if (reason === 'input') {
                setNameInput(value);
                setNameTyping(true);
                if (selectedUser) {
                  setSelectedUser(null);
                  setNationalIdInput('');
                }
              }
            }}
            onChange={(_, value) => handleSelectUser(value)}
            open={nameTyping && nameInput.trim().length >= MIN_USER_SEARCH_LENGTH}
            openOnFocus={false}
            getOptionLabel={getUserFullName}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options, state) => {
              const query = state.inputValue.trim().toLowerCase();
              if (query.length < MIN_USER_SEARCH_LENGTH) return [];
              return options.filter((option) => {
                const fullName = getUserFullName(option).toLowerCase();
                const email = (option.email ?? '').toLowerCase();
                return fullName.includes(query) || email.includes(query);
              });
            }}
            noOptionsText={
              nameInput.trim().length < MIN_USER_SEARCH_LENGTH
                ? 'حداقل ۲ کاراکتر وارد کنید'
                : 'نتیجه‌ای یافت نشد'
            }
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Stack>
                  <Typography variant="body2" fontWeight={700}>
                    {getUserFullName(option)}
                  </Typography>
                  {option.national_id?.trim() && (
                    <Typography variant="caption" color="text.secondary">
                      کد ملی: {toPersianDigits(option.national_id)}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
            renderInput={(params) => <TextField {...params} label="نام" size="small" />}
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
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} alignItems="center" sx={{ mt: 1.75 }}>
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

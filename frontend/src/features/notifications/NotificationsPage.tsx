import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/pagination';
import { GhostButton, GlassCard, TablePagination } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import type { Notification, PaginatedResponse, UnreadCountResponse } from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';

type UnreadFilter = 'all' | 'unread';
type TypeFilter = '' | 'mission_application' | 'assignment' | 'mission' | 'ticket' | 'volunteer';

function formatDate(value: string) {
  return toPersianDigits(new Date(value).toLocaleString('fa-IR'));
}

function getNotificationLink(
  notification: Notification,
  isStaff: boolean,
): { to: string; labelKey: string } | null {
  const type = notification.resource_type || '';
  const id = notification.resource_id;

  if (type === 'mission_application') {
    if (isStaff) {
      return { to: '/volunteers', labelKey: 'actions.openMissionApplications' };
    }
    if (notification.title.includes('تأیید')) {
      return { to: '/my-missions', labelKey: 'actions.openMyMissions' };
    }
    return { to: '/missions/available', labelKey: 'actions.openAvailableMissions' };
  }

  if (type === 'assignment') {
    if (isStaff) {
      return { to: id ? `/missions/${id}` : '/missions', labelKey: 'actions.openMission' };
    }
    return { to: '/my-missions', labelKey: 'actions.openMyMissions' };
  }

  if (type === 'mission' && id) {
    return { to: `/missions/${id}`, labelKey: 'actions.openMission' };
  }

  if (type === 'ticket' && id) {
    return { to: `/tickets/${id}`, labelKey: 'actions.openTicket' };
  }

  if (type === 'volunteer') {
    if (isStaff) {
      return { to: '/admin/users', labelKey: 'actions.openUsers' };
    }
    return { to: '/missions/available', labelKey: 'actions.openAvailableMissions' };
  }

  return null;
}

function typeMeta(type: string): { icon: ReactNode; accent: string; tint: string } {
  switch (type) {
    case 'mission_application':
      return {
        icon: <HowToRegOutlinedIcon fontSize="small" />,
        accent: '#0891b2',
        tint: 'rgba(8, 145, 178, 0.12)',
      };
    case 'assignment':
      return {
        icon: <AssignmentOutlinedIcon fontSize="small" />,
        accent: '#4f46e5',
        tint: 'rgba(79, 70, 229, 0.12)',
      };
    case 'mission':
      return {
        icon: <AssignmentOutlinedIcon fontSize="small" />,
        accent: '#c026d3',
        tint: 'rgba(192, 38, 211, 0.12)',
      };
    case 'ticket':
      return {
        icon: <ConfirmationNumberOutlinedIcon fontSize="small" />,
        accent: '#0d9488',
        tint: 'rgba(13, 148, 136, 0.12)',
      };
    case 'volunteer':
      return {
        icon: <GroupAddOutlinedIcon fontSize="small" />,
        accent: '#059669',
        tint: 'rgba(5, 150, 105, 0.12)',
      };
    default:
      return {
        icon: <NotificationsActiveOutlinedIcon fontSize="small" />,
        accent: '#64748b',
        tint: 'rgba(100, 116, 139, 0.12)',
      };
  }
}

export default function NotificationsPage() {
  const { t } = useTranslation(['notifications', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAnyRole } = usePermissions();
  const isStaff = hasAnyRole(['admin', 'coordinator']);

  const [page, setPage] = useState(1);
  const [unreadFilter, setUnreadFilter] = useState<UnreadFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');

  const listParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      page_size: DEFAULT_PAGE_SIZE,
    };
    if (unreadFilter === 'unread') params.unread = 1;
    if (typeFilter) params.resource_type = typeFilter;
    return params;
  }, [page, unreadFilter, typeFilter]);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await apiClient.get<UnreadCountResponse>(
        endpoints.notifications.unreadCount,
      );
      return data;
    },
    refetchInterval: 30_000,
  });

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['notifications', 'list', listParams],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<Notification>>(
        endpoints.notifications.list,
        { params: listParams },
      );
      return response;
    },
    refetchInterval: 30_000,
  });

  const invalidateNotifications = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
    ]);
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(endpoints.notifications.markRead(id)),
    onSuccess: () => {
      void invalidateNotifications();
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.post(endpoints.notifications.markAllRead),
    onSuccess: () => {
      void invalidateNotifications();
    },
  });

  const notifications = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const unreadCount = unreadData?.unread_count ?? 0;

  const handleOpen = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markReadMutation.mutateAsync(notification.id);
      } catch {
        // navigation still useful even if mark-read fails
      }
    }
    const link = getNotificationLink(notification, isStaff);
    if (link) navigate(link.to);
  };

  const typeFilters = [
    ['', t('filters.all')],
    ['mission_application', t('filters.missionApplication')],
    ['assignment', t('filters.assignment')],
    ['mission', t('filters.mission')],
    ['ticket', t('filters.ticket')],
    ['volunteer', t('filters.volunteer')],
  ] as const;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
        data-tour="page-notifications-header"
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(34, 211, 238, 0.12)',
              color: 'primary.main',
            }}
          >
            <NotificationsActiveOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {t('title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {unreadCount > 0
                ? t('subtitle.unread', { count: toPersianDigits(unreadCount) })
                : t('subtitle.allRead')}
            </Typography>
          </Box>
        </Stack>
        {unreadCount > 0 && (
          <GhostButton
            startIcon={<DoneAllOutlinedIcon />}
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
          >
            {t('actions.markAllRead')}
          </GhostButton>
        )}
      </Stack>

      <GlassCard sx={{ p: { xs: 1.75, md: 2 }, mb: 2 }}>
        <Tabs
          value={unreadFilter}
          onChange={(_, value: UnreadFilter) => {
            setUnreadFilter(value);
            setPage(1);
          }}
          sx={{
            minHeight: 42,
            mb: 1.75,
            '& .MuiTab-root': {
              minHeight: 42,
              fontWeight: 700,
              textTransform: 'none',
            },
          }}
        >
          <Tab label={t('filters.all')} value="all" />
          <Tab
            label={`${t('filters.unread')}${unreadCount > 0 ? ` (${toPersianDigits(unreadCount)})` : ''}`}
            value="unread"
          />
        </Tabs>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {typeFilters.map(([value, label]) => {
            const active = typeFilter === value;
            return (
              <Chip
                key={value || 'all-types'}
                label={label}
                clickable
                onClick={() => {
                  setTypeFilter(value);
                  setPage(1);
                }}
                sx={{
                  fontWeight: 700,
                  height: 34,
                  borderRadius: 99,
                  bgcolor: active ? 'primary.main' : 'transparent',
                  color: active ? 'primary.contrastText' : 'text.secondary',
                  border: 1,
                  borderColor: active ? 'primary.main' : 'divider',
                  '&:hover': {
                    bgcolor: active ? 'primary.main' : 'rgba(34, 211, 238, 0.08)',
                  },
                }}
              />
            );
          })}
        </Stack>
      </GlassCard>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('actions.error', { ns: 'common' })}
        </Alert>
      )}

      <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <Typography sx={{ p: 3 }}>{t('actions.loading', { ns: 'common' })}</Typography>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="h6" fontWeight={800} gutterBottom>
              {unreadFilter === 'unread' ? t('empty.unread') : t('empty.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('empty.hint')}
            </Typography>
          </Box>
        ) : (
          <>
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
              {notifications.map((notification) => {
                const link = getNotificationLink(notification, isStaff);
                const type = notification.resource_type || 'general';
                const meta = typeMeta(type);
                const typeLabel = t(`types.${type}`, { defaultValue: t('types.general') });

                return (
                  <Box
                    key={notification.id}
                    onClick={() => void handleOpen(notification)}
                    sx={{
                      display: 'flex',
                      gap: 1.75,
                      px: { xs: 2, md: 2.5 },
                      py: 2.25,
                      cursor: 'pointer',
                      bgcolor: notification.is_read
                        ? 'transparent'
                        : 'rgba(34, 211, 238, 0.045)',
                      borderInlineStart: notification.is_read ? '3px solid transparent' : '3px solid',
                      borderInlineStartColor: notification.is_read
                        ? 'transparent'
                        : 'primary.main',
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        bgcolor: notification.is_read
                          ? 'rgba(148, 163, 184, 0.06)'
                          : 'rgba(34, 211, 238, 0.08)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        mt: 0.25,
                        bgcolor: meta.tint,
                        color: meta.accent,
                      }}
                    >
                      {meta.icon}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        spacing={1.5}
                        sx={{ mb: 0.75 }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight={800}
                          sx={{ lineHeight: 1.45, minWidth: 0 }}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.is_read && (
                          <Tooltip title={t('actions.markRead')}>
                            <IconButton
                              size="small"
                              aria-label={t('actions.markRead')}
                              onClick={(event) => {
                                event.stopPropagation();
                                markReadMutation.mutate(notification.id);
                              }}
                              sx={{
                                flexShrink: 0,
                                color: 'primary.main',
                                bgcolor: 'rgba(34, 211, 238, 0.1)',
                                '&:hover': { bgcolor: 'rgba(34, 211, 238, 0.18)' },
                              }}
                            >
                              <MarkEmailReadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mb: 1 }}
                      >
                        {!notification.is_read && (
                          <Chip
                            size="small"
                            label={t('status.new')}
                            sx={{
                              height: 24,
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              bgcolor: 'rgba(16, 185, 129, 0.14)',
                              color: '#059669',
                            }}
                          />
                        )}
                        <Chip
                          size="small"
                          label={typeLabel}
                          variant="outlined"
                          sx={{
                            height: 24,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            borderColor: 'divider',
                            color: 'text.secondary',
                          }}
                        />
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1.5,
                          lineHeight: 1.75,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {notification.message}
                      </Typography>

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent="space-between"
                      >
                        <Typography variant="caption" color="text.disabled" fontWeight={600}>
                          {formatDate(notification.created_at)}
                        </Typography>
                        {link && (
                          <Button
                            component={RouterLink}
                            to={link.to}
                            size="small"
                            variant="outlined"
                            endIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 14 }} />}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!notification.is_read) {
                                markReadMutation.mutate(notification.id);
                              }
                            }}
                            sx={{
                              borderRadius: 99,
                              fontWeight: 700,
                              px: 1.5,
                              height: 32,
                              borderColor: 'rgba(34, 211, 238, 0.35)',
                              color: 'primary.main',
                              bgcolor: 'rgba(34, 211, 238, 0.04)',
                              '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'rgba(34, 211, 238, 0.1)',
                              },
                            }}
                          >
                            {t(link.labelKey)}
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
            </Stack>

            <Box sx={{ px: { xs: 2, md: 2.5 }, pb: { xs: 2, md: 2.5 } }}>
              <TablePagination
                page={page}
                totalCount={totalCount}
                onPageChange={setPage}
                disabled={isFetching}
              />
            </Box>
          </>
        )}
      </GlassCard>
    </Box>
  );
}

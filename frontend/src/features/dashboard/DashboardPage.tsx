import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import DescriptionIcon from '@mui/icons-material/Description';
import ExploreIcon from '@mui/icons-material/Explore';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid2 as Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import {
  DashboardChartsSection,
  CoordinatorDashboardChartsSection,
  VolunteerDashboardChartsSection,
} from '@/features/dashboard/components/DashboardCharts';
import { useAuth, usePermissions } from '@/shared/hooks/useAuth';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GhostButton, GlassCard } from '@/shared/components/ui';
import type {
  DashboardKpis,
  DashboardScope,
  DashboardStats,
  Notification,
  PaginatedResponse,
} from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';

const KPI_ACCENTS = [
  'rgba(34, 211, 238, 0.14)',
  'rgba(129, 140, 248, 0.14)',
  'rgba(251, 191, 36, 0.14)',
  'rgba(52, 211, 153, 0.14)',
  'rgba(248, 113, 113, 0.14)',
  'rgba(251, 146, 60, 0.14)',
  'rgba(167, 139, 250, 0.14)',
  'rgba(56, 189, 248, 0.14)',
];

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
  to?: string;
}

function KpiCard({ title, value, icon, accent, to }: KpiCardProps) {
  const content = (
    <GlassCard
      sx={{
        p: 2.5,
        height: '100%',
        background: `linear-gradient(135deg, ${accent} 0%, transparent 72%)`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        ...(to && {
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
          },
        }),
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.25,
            borderRadius: 2,
            bgcolor: 'rgba(34, 211, 238, 0.12)',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </GlassCard>
  );

  if (!to) return content;
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
    >
      {content}
    </Box>
  );
}

type KpiItem = {
  key: keyof DashboardKpis;
  title: string;
  icon: React.ReactNode;
  to?: string;
};

function buildStaffKpis(t: (key: string) => string): KpiItem[] {
  return [
    { key: 'active_disasters', title: t('kpis.activeDisasters'), icon: <CrisisAlertIcon /> },
    { key: 'inactive_disasters', title: t('kpis.inactiveDisasters'), icon: <PauseCircleOutlineIcon /> },
    { key: 'open_missions', title: t('kpis.openMissions'), icon: <AssignmentIcon /> },
    { key: 'missions_in_progress', title: t('kpis.missionsInProgress'), icon: <HourglassEmptyIcon /> },
    { key: 'active_volunteers', title: t('kpis.activeVolunteers'), icon: <HowToRegIcon /> },
    { key: 'active_assignments', title: t('kpis.activeAssignments'), icon: <TaskAltIcon /> },
    { key: 'completed_missions', title: t('kpis.completedMissions'), icon: <CheckCircleIcon /> },
    { key: 'pending_applications', title: t('kpis.pendingApplications'), icon: <AssignmentIcon /> },
    { key: 'pending_reports', title: t('kpis.pendingReports'), icon: <DescriptionIcon /> },
    { key: 'unread_notifications', title: t('kpis.unreadNotifications'), icon: <NotificationsActiveIcon /> },
  ];
}

function buildCoordinatorKpis(t: (key: string) => string): KpiItem[] {
  return [
    {
      key: 'my_missions_total',
      title: t('kpis.myMissionsTotal'),
      icon: <AssignmentIcon />,
      to: '/missions?mine=true',
    },
    {
      key: 'my_missions_draft',
      title: t('kpis.myMissionsDraft'),
      icon: <PauseCircleOutlineIcon />,
      to: '/missions?mine=true&status=draft',
    },
    {
      key: 'my_missions_published',
      title: t('kpis.myMissionsPublished'),
      icon: <ExploreIcon />,
      to: '/missions?mine=true&status=published',
    },
    {
      key: 'missions_in_progress',
      title: t('kpis.missionsInProgress'),
      icon: <HourglassEmptyIcon />,
      to: '/missions?mine=true&status=in_progress',
    },
    {
      key: 'pending_applications',
      title: t('kpis.pendingApplications'),
      icon: <PendingActionsIcon />,
      to: '/volunteers',
    },
    {
      key: 'active_assignments',
      title: t('kpis.activeAssignments'),
      icon: <TaskAltIcon />,
      to: '/missions?mine=true',
    },
    {
      key: 'pending_reports',
      title: t('kpis.pendingReports'),
      icon: <DescriptionIcon />,
      to: '/reports',
    },
    {
      key: 'unread_notifications',
      title: t('kpis.unreadNotifications'),
      icon: <NotificationsActiveIcon />,
      to: '/notifications',
    },
  ];
}

function buildVolunteerKpis(t: (key: string) => string): KpiItem[] {
  return [
    {
      key: 'available_missions',
      title: t('kpis.availableMissions'),
      icon: <ExploreIcon />,
      to: '/missions/available',
    },
    {
      key: 'my_applications_pending',
      title: t('kpis.myApplicationsPending'),
      icon: <PendingActionsIcon />,
      to: '/my-missions',
    },
    {
      key: 'my_applications_approved',
      title: t('kpis.myApplicationsApproved'),
      icon: <CheckCircleIcon />,
      to: '/my-missions',
    },
    {
      key: 'my_applications_total',
      title: t('kpis.myApplicationsTotal'),
      icon: <AssignmentIcon />,
      to: '/my-missions',
    },
    {
      key: 'my_assignments_active',
      title: t('kpis.myAssignmentsActive'),
      icon: <TaskAltIcon />,
      to: '/my-missions',
    },
    {
      key: 'my_missions_in_progress',
      title: t('kpis.myMissionsInProgress'),
      icon: <HourglassEmptyIcon />,
      to: '/my-missions',
    },
    {
      key: 'my_assignments_completed',
      title: t('kpis.myAssignmentsCompleted'),
      icon: <CheckCircleIcon />,
      to: '/my-missions',
    },
    {
      key: 'unread_notifications',
      title: t('kpis.unreadNotifications'),
      icon: <NotificationsActiveIcon />,
      to: '/notifications',
    },
  ];
}

function formatKpiValue(kpis: DashboardKpis, key: keyof DashboardKpis) {
  return toPersianDigits((kpis[key] ?? 0).toLocaleString('fa-IR'));
}

function resolveScope(
  data: DashboardStats | undefined,
  hasAnyRole: (roles: string[]) => boolean,
): DashboardScope {
  if (data?.scope) return data.scope;
  if (hasAnyRole(['admin'])) return 'staff';
  if (hasAnyRole(['coordinator'])) return 'coordinator';
  return 'volunteer';
}

function QuickActionCard({
  to,
  title,
  description,
  icon,
  accent,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        height: '100%',
      }}
    >
      <GlassCard
        sx={{
          p: 2,
          height: '100%',
          transition: 'transform 0.2s ease, border-color 0.2s ease',
          border: 1,
          borderColor: 'divider',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: 'rgba(34, 211, 238, 0.45)',
          },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: accent,
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Stack>
      </GlassCard>
    </Box>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'notifications', 'common']);
  const { user } = useAuth();
  const { hasRole, hasAnyRole } = usePermissions();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data: stats } = await apiClient.get<DashboardStats>(endpoints.dashboard.stats);
      return stats;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const scope = resolveScope(data, hasAnyRole);
  const isVolunteerDashboard = scope === 'volunteer';
  const isCoordinatorDashboard = scope === 'coordinator';

  const { data: recentNotifications } = useQuery({
    queryKey: ['notifications', 'dashboard-preview'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<Notification>>(
        endpoints.notifications.list,
        { params: { page: 1, page_size: 4 } },
      );
      return response.results;
    },
    enabled: isVolunteerDashboard || isCoordinatorDashboard,
    refetchInterval: 30_000,
  });

  const welcomeMessage = hasRole('admin')
    ? t('welcomeMainAdmin')
    : isCoordinatorDashboard
      ? t('welcomeCoordinator')
      : `${t('welcome')}، ${[user?.first_name, user?.last_name].filter(Boolean).join(' ')}`.trim();

  const kpiItems = isVolunteerDashboard
    ? buildVolunteerKpis(t)
    : isCoordinatorDashboard
      ? buildCoordinatorKpis(t)
      : buildStaffKpis(t);

  const kpis = kpiItems.map((item, index) => ({
    ...item,
    value: formatKpiValue(data?.kpis ?? {}, item.key),
    accent: KPI_ACCENTS[index % KPI_ACCENTS.length],
  }));

  const coordinatorActions = [
    {
      to: '/volunteers',
      title: t('quickActions.applications'),
      description: t('quickActions.applicationsHint'),
      icon: <PendingActionsIcon fontSize="small" />,
      accent: 'rgba(251, 146, 60, 0.14)',
    },
    {
      to: '/missions?mine=true',
      title: t('quickActions.missions'),
      description: t('quickActions.missionsHint'),
      icon: <AssignmentIcon fontSize="small" />,
      accent: 'rgba(99, 102, 241, 0.12)',
    },
    {
      to: '/notifications',
      title: t('quickActions.notifications'),
      description: t('quickActions.notificationsHint'),
      icon: <NotificationsActiveIcon fontSize="small" />,
      accent: 'rgba(16, 185, 129, 0.12)',
    },
    {
      to: '/tickets',
      title: t('quickActions.messagesTickets'),
      description: t('quickActions.messagesTicketsHint'),
      icon: <ForumOutlinedIcon fontSize="small" />,
      accent: 'rgba(13, 148, 136, 0.12)',
    },
    {
      to: '/reports',
      title: t('quickActions.reports'),
      description: t('quickActions.reportsHint'),
      icon: <DescriptionIcon fontSize="small" />,
      accent: 'rgba(248, 113, 113, 0.12)',
    },
    {
      to: '/disasters',
      title: t('quickActions.disasters'),
      description: t('quickActions.disasters'),
      icon: <CrisisAlertIcon fontSize="small" />,
      accent: 'rgba(34, 211, 238, 0.12)',
    },
  ];

  const volunteerActions = [
    {
      to: '/missions/available',
      title: t('quickActions.availableMissions'),
      description: t('quickActions.availableMissionsHint'),
      icon: <ExploreIcon fontSize="small" />,
      accent: 'rgba(34, 211, 238, 0.12)',
    },
    {
      to: '/my-missions',
      title: t('quickActions.myMissions'),
      description: t('quickActions.myMissionsHint'),
      icon: <AssignmentIcon fontSize="small" />,
      accent: 'rgba(99, 102, 241, 0.12)',
    },
    {
      to: '/notifications',
      title: t('quickActions.notifications'),
      description: t('quickActions.notificationsHint'),
      icon: <NotificationsActiveIcon fontSize="small" />,
      accent: 'rgba(16, 185, 129, 0.12)',
    },
    {
      to: '/tickets',
      title: t('quickActions.messagesTickets'),
      description: t('quickActions.messagesTicketsHint'),
      icon: <ForumOutlinedIcon fontSize="small" />,
      accent: 'rgba(13, 148, 136, 0.12)',
    },
    {
      to: '/profile',
      title: t('quickActions.profile'),
      description: t('quickActions.profileHint'),
      icon: <PersonOutlineIcon fontSize="small" />,
      accent: 'rgba(251, 191, 36, 0.12)',
    },
  ];

  if (isCoordinatorDashboard) {
    return (
      <Box>
        <GlassCard
          sx={{
            p: { xs: 2.5, md: 3 },
            mb: 2.5,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(129,140,248,0.14) 0%, rgba(15,23,42,0.4) 55%)'
                : 'linear-gradient(135deg, rgba(129,140,248,0.12) 0%, rgba(255,255,255,0.9) 55%)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                {welcomeMessage}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('coordinatorSubtitle')}
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75 }}>
                {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<PendingActionsIcon />}
                color={(data?.kpis?.pending_applications ?? 0) > 0 ? 'warning' : 'default'}
                label={`${t('kpis.pendingApplications')}: ${formatKpiValue(data?.kpis ?? {}, 'pending_applications')}`}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                icon={<NotificationsActiveIcon />}
                color={(data?.kpis?.unread_notifications ?? 0) > 0 ? 'primary' : 'default'}
                label={`${t('kpis.unreadNotifications')}: ${formatKpiValue(data?.kpis ?? {}, 'unread_notifications')}`}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Stack>
        </GlassCard>

        {isError && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, borderRadius: 2.5 }}
            action={
              <GhostButton
                size="small"
                startIcon={<RefreshOutlinedIcon />}
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {t('actions.retry')}
              </GhostButton>
            }
          >
            {t('errors.loadFailed')}
          </Alert>
        )}

        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
          {t('quickActions.title')}
        </Typography>
        <Grid container spacing={1.75} sx={{ mb: 3 }}>
          {coordinatorActions.map((action) => (
            <Grid key={action.to} size={{ xs: 12, sm: 6, md: 4 }}>
              <QuickActionCard {...action} />
            </Grid>
          ))}
        </Grid>

        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
          {t('sections.overview')}
        </Typography>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {kpis.map((kpi) => (
            <Grid key={kpi.key} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
              <KpiCard
                title={kpi.title}
                value={isLoading ? '—' : kpi.value}
                icon={kpi.icon}
                accent={kpi.accent}
                to={kpi.to}
              />
            </Grid>
          ))}
        </Grid>

        {!isLoading && data?.charts && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
              {t('sections.charts')}
            </Typography>
            <CoordinatorDashboardChartsSection charts={data.charts} />
          </Box>
        )}

        <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2.5, pt: 2, pb: 1.5 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <MailOutlineOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={800}>
                {t('sections.recentNotifications')}
              </Typography>
            </Stack>
            <Button component={RouterLink} to="/notifications" size="small" sx={{ fontWeight: 700 }}>
              {t('actions.viewAll', { ns: 'common' })}
            </Button>
          </Stack>
          {(recentNotifications?.length ?? 0) === 0 ? (
            <Box sx={{ px: 2.5, pb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t('sections.noNotifications')}
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
              {recentNotifications!.map((notification) => (
                <Box
                  key={notification.id}
                  component={RouterLink}
                  to="/notifications"
                  sx={{
                    display: 'block',
                    px: 2.5,
                    py: 1.75,
                    textDecoration: 'none',
                    color: 'inherit',
                    bgcolor: notification.is_read ? 'transparent' : 'rgba(129, 140, 248, 0.06)',
                    '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.08)' },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ flex: 1 }}>
                      {notification.title}
                    </Typography>
                    {!notification.is_read && (
                      <Chip
                        size="small"
                        label={t('status.new', { ns: 'notifications' })}
                        sx={{
                          height: 22,
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          bgcolor: 'rgba(16, 185, 129, 0.14)',
                          color: '#059669',
                        }}
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {notification.message}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </GlassCard>
      </Box>
    );
  }

  if (isVolunteerDashboard) {
    return (
      <Box>
        <GlassCard
          sx={{
            p: { xs: 2.5, md: 3 },
            mb: 2.5,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(15,23,42,0.4) 55%)'
                : 'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(255,255,255,0.9) 55%)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                {welcomeMessage}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('volunteerSubtitle')}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<ExploreIcon />}
                label={`${t('kpis.availableMissions')}: ${formatKpiValue(data?.kpis ?? {}, 'available_missions')}`}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                icon={<NotificationsActiveIcon />}
                color={(data?.kpis?.unread_notifications ?? 0) > 0 ? 'primary' : 'default'}
                label={`${t('kpis.unreadNotifications')}: ${formatKpiValue(data?.kpis ?? {}, 'unread_notifications')}`}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Stack>
        </GlassCard>

        {isError && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, borderRadius: 2.5 }}
            action={
              <GhostButton
                size="small"
                startIcon={<RefreshOutlinedIcon />}
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {t('actions.retry')}
              </GhostButton>
            }
          >
            {t('errors.loadFailed')}
          </Alert>
        )}

        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
          {t('quickActions.title')}
        </Typography>
        <Grid container spacing={1.75} sx={{ mb: 3 }}>
          {volunteerActions.map((action) => (
            <Grid key={action.to} size={{ xs: 12, sm: 6, md: 4 }}>
              <QuickActionCard {...action} />
            </Grid>
          ))}
        </Grid>

        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
          {t('sections.overview')}
        </Typography>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {kpis.map((kpi) => (
            <Grid key={kpi.key} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
              <KpiCard
                title={kpi.title}
                value={isLoading ? '—' : kpi.value}
                icon={kpi.icon}
                accent={kpi.accent}
                to={kpi.to}
              />
            </Grid>
          ))}
        </Grid>

        {!isLoading && data?.charts && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
              {t('sections.charts')}
            </Typography>
            <VolunteerDashboardChartsSection charts={data.charts} />
          </Box>
        )}

        <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2.5, pt: 2, pb: 1.5 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <MailOutlineOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={800}>
                {t('sections.recentNotifications')}
              </Typography>
            </Stack>
            <Button component={RouterLink} to="/notifications" size="small" sx={{ fontWeight: 700 }}>
              {t('actions.viewAll', { ns: 'common' })}
            </Button>
          </Stack>
          {(recentNotifications?.length ?? 0) === 0 ? (
            <Box sx={{ px: 2.5, pb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t('sections.noNotifications')}
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
              {recentNotifications!.map((notification) => (
                <Box
                  key={notification.id}
                  component={RouterLink}
                  to="/notifications"
                  sx={{
                    display: 'block',
                    px: 2.5,
                    py: 1.75,
                    textDecoration: 'none',
                    color: 'inherit',
                    bgcolor: notification.is_read ? 'transparent' : 'rgba(34, 211, 238, 0.05)',
                    '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.08)' },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ flex: 1 }}>
                      {notification.title}
                    </Typography>
                    {!notification.is_read && (
                      <Chip
                        size="small"
                        label={t('status.new', { ns: 'notifications' })}
                        sx={{
                          height: 22,
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          bgcolor: 'rgba(16, 185, 129, 0.14)',
                          color: '#059669',
                        }}
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {notification.message}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </GlassCard>
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {t('title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {welcomeMessage}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
            {t('subtitle')}
          </Typography>
        </Box>

        <GlassCard sx={{ p: 1.5, minWidth: { md: 280 } }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
            {t('quickActions.title')}
          </Typography>
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
            <Button component={RouterLink} to="/disasters" size="small" variant="outlined">
              {t('quickActions.disasters')}
            </Button>
            <Button component={RouterLink} to="/missions" size="small" variant="outlined">
              {t('quickActions.missions')}
            </Button>
            <Button component={RouterLink} to="/volunteers" size="small" variant="outlined">
              {t('quickActions.volunteers')}
            </Button>
            <Button component={RouterLink} to="/notifications" size="small" variant="outlined">
              {t('quickActions.notifications')}
            </Button>
          </Stack>
        </GlassCard>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('actions.error', { ns: 'common' })}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.key} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
            <KpiCard
              title={kpi.title}
              value={isLoading ? '—' : kpi.value}
              icon={kpi.icon}
              accent={kpi.accent}
            />
          </Grid>
        ))}
      </Grid>

      {!isLoading && data?.charts && <DashboardChartsSection charts={data.charts} />}
    </Box>
  );
}

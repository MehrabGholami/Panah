import DashboardIcon from '@mui/icons-material/Dashboard';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HistoryIcon from '@mui/icons-material/History';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  type Theme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { logout } from '@/app/slices/authSlice';
import { toggleSidebar } from '@/app/slices/uiPreferencesSlice';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { ThemeToggle, UserAvatar } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import type { UnreadCountResponse } from '@/shared/types';

const SIDEBAR_WIDTH = 272;
const SIDEBAR_COLLAPSED = 72;
const APP_BAR_HEIGHT = 72;

const sidebarTransition = (theme: Theme) =>
  theme.transitions.create(['width', 'margin', 'margin-left', 'padding', 'min-width', 'max-width'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.standard,
  });

const fadeTransition = (theme: Theme) =>
  theme.transitions.create(['opacity', 'max-width', 'margin'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.standard,
  });

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  permission?: string;
}

const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'مدیر اصلی', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.16)' },
  coordinator: { label: 'هماهنگ کننده', color: '#818CF8', bg: 'rgba(129, 140, 248, 0.16)' },
  volunteer: { label: 'داوطلب', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.14)' },
};

export function DashboardLayout() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const collapsed = useAppSelector((state) => state.uiPreferences.sidebarCollapsed);
  const { hasPermission, hasAnyRole } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await apiClient.get<UnreadCountResponse>(
        endpoints.notifications.unreadCount,
      );
      return data;
    },
    refetchInterval: 30_000,
    enabled: Boolean(user),
  });

  const unreadCount = unreadData?.unread_count ?? 0;
  const isCollapsedDesktop = collapsed && !isMobile;
  const showProfileNav =
    hasAnyRole(['volunteer']) && !hasAnyRole(['admin', 'coordinator']);

  const navItems: NavItem[] = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: <DashboardIcon /> },
    {
      label: t('nav.disasters'),
      path: '/disasters',
      icon: <CrisisAlertIcon />,
      roles: ['admin', 'coordinator'],
      permission: 'disasters.view',
    },
    {
      label: t('nav.missions'),
      path: '/missions',
      icon: <AssignmentIcon />,
      roles: ['admin', 'coordinator'],
      permission: 'missions.view',
    },
    {
      label: t('nav.availableMissions'),
      path: '/missions/available',
      icon: <ExploreOutlinedIcon />,
      roles: ['volunteer'],
      permission: 'missions.view',
    },
    {
      label: t('nav.myMissions'),
      path: '/my-missions',
      icon: <AssignmentIndOutlinedIcon />,
      roles: ['volunteer'],
    },
    {
      label: t('nav.volunteers'),
      path: '/volunteers',
      icon: <PeopleIcon />,
      roles: ['admin', 'coordinator'],
      permission: 'volunteers.view',
    },
    {
      label: t('nav.users'),
      path: '/admin/users',
      icon: <ManageAccountsOutlinedIcon />,
      roles: ['admin', 'coordinator'],
      permission: 'accounts.view_users',
    },
    {
      label: t('nav.reports'),
      path: '/reports',
      icon: <DescriptionIcon />,
      roles: ['admin', 'coordinator'],
      permission: 'reports.view',
    },
    {
      label: t('nav.notifications'),
      path: '/notifications',
      icon: <NotificationsIcon />,
    },
    {
      label: t('nav.tickets'),
      path: '/tickets',
      icon: <ConfirmationNumberIcon />,
      permission: 'tickets.view',
    },
    {
      label: t('nav.roles'),
      path: '/admin/roles',
      icon: <AdminPanelSettingsIcon />,
      roles: ['admin'],
      permission: 'accounts.manage_roles',
    },
    {
      label: t('nav.audit'),
      path: '/admin/audit',
      icon: <HistoryIcon />,
      roles: ['admin'],
      permission: 'audit.view',
    },
  ];

  const visibleNav = navItems.filter((item) => {
    if (item.permission && !hasPermission(item.permission) && !hasAnyRole(['admin'])) {
      return false;
    }
    if (item.path === '/my-missions' && hasAnyRole(['admin', 'coordinator'])) {
      return false;
    }
    if (item.path === '/missions/available' && hasAnyRole(['admin', 'coordinator'])) {
      return false;
    }
    if (item.roles && !hasAnyRole(item.roles)) {
      return false;
    }
    return true;
  });

  const sidebarWidth = isCollapsedDesktop ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
  const primaryRole = (user?.roles ?? [])[0] ?? 'user';
  const currentRole = roleMeta[primaryRole] ?? {
    label: primaryRole,
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.16)',
  };

  const handleLogout = async () => {
    setLogoutOpen(false);
    await dispatch(logout());
    navigate('/login');
  };

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileOpen(true);
    } else {
      dispatch(toggleSidebar());
    }
  };

  const sidebarHeader = (
    <Box
      sx={{
        px: 2,
        height: APP_BAR_HEIGHT,
        minHeight: APP_BAR_HEIGHT,
        maxHeight: APP_BAR_HEIGHT,
        boxSizing: 'border-box',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'rgba(34, 211, 238, 0.04)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        overflow: 'hidden',
        transition: sidebarTransition(theme),
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #22D3EE 0%, #818CF8 100%)',
          }}
        >
          <VolunteerActivismIcon sx={{ color: '#0B0F1A', fontSize: 22 }} />
        </Box>
        <Box
          sx={{
            minWidth: 0,
            overflow: 'hidden',
            opacity: isCollapsedDesktop ? 0 : 1,
            maxWidth: isCollapsedDesktop ? 0 : 180,
            transition: fadeTransition(theme),
          }}
        >
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2} noWrap>
            {t('appName')}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', lineHeight: 1.4, mt: 0.25 }}
            noWrap
          >
            {t('appTagline')}
          </Typography>
        </Box>
      </Box>
      {!isMobile && (
        <IconButton
          size="small"
          onClick={() => dispatch(toggleSidebar())}
          aria-label={isCollapsedDesktop ? 'باز کردن منو' : 'بستن منو'}
          sx={{
            color: 'text.secondary',
            flexShrink: 0,
            transform: isCollapsedDesktop ? 'rotate(180deg)' : 'none',
            transition: theme.transitions.create('transform', {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          <MenuOpenIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );

  const sidebar = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {sidebarHeader}
      <List sx={{ flex: 1, px: 1, py: 1.5, overflowY: 'auto' }}>
        {visibleNav.map((item) => {
          const active = location.pathname.startsWith(item.path);
          const button = (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={active}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: isCollapsedDesktop ? 1.25 : 1.5,
                py: 1,
                justifyContent: isCollapsedDesktop ? 'center' : 'flex-start',
                transition: sidebarTransition(theme),
                '&:hover': {
                  bgcolor: 'rgba(34, 211, 238, 0.08)',
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(34, 211, 238, 0.12)',
                  borderRight: '3px solid',
                  borderColor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(34, 211, 238, 0.16)',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isCollapsedDesktop ? 0 : 40,
                  color: active ? 'primary.main' : 'text.secondary',
                  justifyContent: 'center',
                  transition: sidebarTransition(theme),
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  m: 0,
                  opacity: isCollapsedDesktop ? 0 : 1,
                  maxWidth: isCollapsedDesktop ? 0 : 200,
                  overflow: 'hidden',
                  transition: fadeTransition(theme),
                }}
                primaryTypographyProps={{
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.9rem',
                  noWrap: true,
                }}
              />
            </ListItemButton>
          );

          return (
            <Tooltip
              key={item.path}
              title={isCollapsedDesktop ? item.label : ''}
              placement="right"
              disableHoverListener={!isCollapsedDesktop}
              disableFocusListener={!isCollapsedDesktop}
            >
              {button}
            </Tooltip>
          );
        })}
      </List>
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
        {showProfileNav && (
          <Tooltip title={isCollapsedDesktop ? t('nav.profile') : ''} placement="right">
            <ListItemButton
              component={RouterLink}
              to="/profile"
              selected={location.pathname.startsWith('/profile')}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 1,
                justifyContent: isCollapsedDesktop ? 'center' : 'flex-start',
                '&.Mui-selected': {
                  bgcolor: 'rgba(34, 211, 238, 0.12)',
                  borderRight: '3px solid',
                  borderColor: 'primary.main',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isCollapsedDesktop ? 0 : 40,
                  color: location.pathname.startsWith('/profile') ? 'primary.main' : 'text.secondary',
                  justifyContent: 'center',
                }}
              >
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary={t('nav.profile')}
                sx={{
                  m: 0,
                  opacity: isCollapsedDesktop ? 0 : 1,
                  maxWidth: isCollapsedDesktop ? 0 : 200,
                  overflow: 'hidden',
                  transition: fadeTransition(theme),
                }}
              />
            </ListItemButton>
          </Tooltip>
        )}
        <Tooltip title={isCollapsedDesktop ? t('nav.logout') : ''} placement="right">
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => setLogoutOpen(true)}
            startIcon={<LogoutIcon />}
            sx={{
              borderRadius: 2,
              py: 1.1,
              minWidth: isCollapsedDesktop ? 48 : undefined,
              px: isCollapsedDesktop ? 0 : 2,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
              transition: sidebarTransition(theme),
              '& .MuiButton-startIcon': {
                margin: isCollapsedDesktop ? 0 : undefined,
                transition: fadeTransition(theme),
              },
              '&:hover': {
                boxShadow: '0 6px 18px rgba(239, 68, 68, 0.35)',
              },
            }}
          >
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                overflow: 'hidden',
                maxWidth: isCollapsedDesktop ? 0 : 120,
                opacity: isCollapsedDesktop ? 0 : 1,
                transition: fadeTransition(theme),
                whiteSpace: 'nowrap',
              }}
            >
              {t('nav.logout')}
            </Box>
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="nav"
        sx={{
          width: { md: sidebarWidth },
          flexShrink: { md: 0 },
          transition: sidebarTransition(theme),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          anchor="left"
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          anchor="left"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
              transition: sidebarTransition(theme),
              overflowX: 'hidden',
            },
          }}
        >
          {sidebar}
        </Drawer>
      </Box>

      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          ml: { md: `${sidebarWidth}px` },
          height: APP_BAR_HEIGHT,
          minHeight: APP_BAR_HEIGHT,
          boxSizing: 'border-box',
          transition: sidebarTransition(theme),
          backdropFilter: 'blur(12px)',
          bgcolor: 'rgba(18, 24, 42, 0.72)',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            height: '100%',
            minHeight: 'unset',
            boxSizing: 'border-box',
            px: { xs: 2, sm: 3 },
          }}
        >
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleSidebarToggle}
              aria-label="باز کردن منو"
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flex: 1 }} />
          <ThemeToggle />
          <IconButton
            component={RouterLink}
            to="/notifications"
            color="inherit"
            aria-label={t('nav.notifications')}
            sx={{ mx: 1 }}
          >
            <Badge badgeContent={unreadCount} color="error" invisible={unreadCount === 0}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Chip
            icon={<WorkspacePremiumIcon sx={{ color: `${currentRole.color} !important` }} />}
            label={currentRole.label}
            size="small"
            sx={{
              mx: 0.75,
              px: 0.5,
              height: 32,
              borderRadius: 2.5,
              fontWeight: 800,
              color: currentRole.color,
              bgcolor: currentRole.bg,
              border: '1px solid',
              borderColor: 'rgba(148, 163, 184, 0.28)',
              '& .MuiChip-label': { px: 1 },
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          />
          {showProfileNav ? (
            <IconButton
              component={RouterLink}
              to="/profile"
              aria-label={t('nav.profile')}
              sx={{ mx: 1 }}
            >
              <UserAvatar
                name={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || user?.email}
                src={user?.avatar}
                sx={{ width: 36, height: 36 }}
              />
            </IconButton>
          ) : (
            <Box sx={{ mx: 1 }}>
              <UserAvatar
                name={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || user?.email}
                src={user?.avatar}
                sx={{ width: 36, height: 36 }}
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          mt: `${APP_BAR_HEIGHT}px`,
          transition: sidebarTransition(theme),
        }}
      >
        <Outlet />
      </Box>

      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('logoutConfirm.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('logoutConfirm.message')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutOpen(false)} variant="outlined">
            {t('actions.cancel')}
          </Button>
          <Button onClick={() => void handleLogout()} color="error" variant="contained" autoFocus>
            {t('nav.logout')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

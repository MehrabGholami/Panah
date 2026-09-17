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
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
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
  keyframes,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { logout } from '@/app/slices/authSlice';
import { toggleSidebar } from '@/app/slices/uiPreferencesSlice';
import panahLogo from '@/assets/images/panah-logo.png';
import {
  OnboardingProvider,
  OnboardingTour,
  pathToTourSlug,
  useOnboarding,
} from '@/features/onboarding';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { ThemeToggle, UserAvatar } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import type { UnreadCountResponse } from '@/shared/types';

const SIDEBAR_WIDTH = 272;
const SIDEBAR_COLLAPSED = 72;
const APP_BAR_HEIGHT = 72;

const guidePulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.45); }
  70% { box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
`;

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
  return (
    <OnboardingProvider>
      <DashboardLayoutInner />
    </OnboardingProvider>
  );
}

function DashboardLayoutInner() {
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
  const { showPulse, startTour, setGuideAnchorEl, registerMobileDrawerControl } = useOnboarding();

  const guideItemRef = useCallback(
    (node: HTMLElement | null) => {
      setGuideAnchorEl(node);
    },
    [setGuideAnchorEl],
  );

  useEffect(() => {
    registerMobileDrawerControl(setMobileOpen);
    return () => registerMobileDrawerControl(null);
  }, [registerMobileDrawerControl]);

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
      label: t('nav.coordinatorMyMissions'),
      path: '/missions/mine',
      icon: <AssignmentIndOutlinedIcon />,
      roles: ['coordinator'],
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
      label: t('nav.coordinationRequests'),
      path: '/missions/coordinator-requests',
      icon: <HowToRegOutlinedIcon />,
      roles: ['admin'],
      permission: 'missions.assign',
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
    {
      label: t('nav.opsBackup'),
      path: '/admin/ops',
      icon: <BackupOutlinedIcon />,
      roles: ['admin'],
      permission: 'ops.view_backups',
    },
  ];

  const visibleNav = navItems.filter((item) => {
    if (item.permission && !hasPermission(item.permission) && !hasAnyRole(['admin'])) {
      return false;
    }
    if (item.path === '/my-missions' && hasAnyRole(['admin', 'coordinator'])) {
      return false;
    }
    if (item.path === '/missions/mine' && hasAnyRole(['admin'])) {
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

  const handleGuideClick = () => {
    setMobileOpen(false);
    startTour();
  };

  const renderSidebarHeader = () => (
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
          component="img"
          src={panahLogo}
          alt={t('appName')}
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            objectFit: 'contain',
            display: 'block',
            filter: theme.palette.mode === 'dark' ? 'invert(1) brightness(1.05)' : 'none',
          }}
        />
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

  const navPaths = visibleNav.map((item) => item.path);

  const renderGuideButton = (tourAnchor: boolean) => (
    <ListItemButton
      data-tour="nav-guide"
      ref={tourAnchor ? guideItemRef : undefined}
      onClick={handleGuideClick}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        px: isCollapsedDesktop ? 1.25 : 1.5,
        py: 1,
        justifyContent: isCollapsedDesktop ? 'center' : 'flex-start',
        transition: sidebarTransition(theme),
        animation: showPulse ? `${guidePulse} 2.4s ease-out infinite` : 'none',
        bgcolor: showPulse ? 'rgba(34, 211, 238, 0.08)' : undefined,
        '&:hover': {
          bgcolor: 'rgba(34, 211, 238, 0.08)',
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: isCollapsedDesktop ? 0 : 40,
          color: showPulse ? 'primary.main' : 'text.secondary',
          justifyContent: 'center',
          transition: sidebarTransition(theme),
        }}
      >
        <HelpOutlineRoundedIcon />
      </ListItemIcon>
      <ListItemText
        primary={t('nav.guide')}
        sx={{
          m: 0,
          opacity: isCollapsedDesktop ? 0 : 1,
          maxWidth: isCollapsedDesktop ? 0 : 200,
          overflow: 'hidden',
          transition: fadeTransition(theme),
        }}
        primaryTypographyProps={{
          fontWeight: showPulse ? 700 : 500,
          fontSize: '0.9rem',
          noWrap: true,
        }}
      />
      {showPulse && !isCollapsedDesktop && (
        <Chip
          label={t('onboarding.newBadge')}
          size="small"
          color="primary"
          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
        />
      )}
    </ListItemButton>
  );

  /** Must be a fresh tree per Drawer — reusing one element mounts into the hidden modal drawer. */
  const renderSidebar = (variant: 'mobile' | 'desktop') => (
    <Box
      data-tour-drawer={variant}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}
    >
      {renderSidebarHeader()}
      <List data-tour="nav-rail" sx={{ flex: 1, px: 1, py: 1.5, overflowY: 'auto' }}>
        {visibleNav.map((item) => {
          const pathname = location.pathname;
          const exact = pathname === item.path;
          const nested = pathname.startsWith(`${item.path}/`);
          const hasMoreSpecificMatch = nested
            ? navPaths.some(
                (path) =>
                  path !== item.path &&
                  (path === pathname ||
                    (path.startsWith(`${item.path}/`) &&
                      (pathname === path || pathname.startsWith(`${path}/`)))),
              )
            : false;
          const active = exact || (nested && !hasMoreSpecificMatch);
          const tourAttr = `nav-${pathToTourSlug(item.path)}`;
          const button = (
            <ListItemButton
              key={`${variant}-${item.path}`}
              component={RouterLink}
              to={item.path}
              data-tour={tourAttr}
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
              key={`${variant}-${item.path}`}
              title={isCollapsedDesktop ? item.label : ''}
              placement="right"
              disableHoverListener={!isCollapsedDesktop}
              disableFocusListener={!isCollapsedDesktop}
            >
              {button}
            </Tooltip>
          );
        })}
        <Tooltip
          title={isCollapsedDesktop ? t('nav.guide') : ''}
          placement="right"
          disableHoverListener={!isCollapsedDesktop}
          disableFocusListener={!isCollapsedDesktop}
        >
          {renderGuideButton(variant === (isMobile ? 'mobile' : 'desktop'))}
        </Tooltip>
      </List>
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
        {showProfileNav && (
          <Tooltip title={isCollapsedDesktop ? t('nav.profile') : ''} placement="right">
            <ListItemButton
              component={RouterLink}
              to="/profile"
              data-tour="nav-profile"
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
              justifyContent: isCollapsedDesktop ? 'center' : 'flex-start',
              minWidth: 0,
              px: isCollapsedDesktop ? 1.25 : 2,
              '& .MuiButton-startIcon': {
                m: isCollapsedDesktop ? 0 : undefined,
              },
            }}
          >
            <Box
              component="span"
              sx={{
                opacity: isCollapsedDesktop ? 0 : 1,
                maxWidth: isCollapsedDesktop ? 0 : 200,
                overflow: 'hidden',
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
      data-tour="app-shell"
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
          {renderSidebar('mobile')}
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
          {renderSidebar('desktop')}
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
            data-tour="notifications-bell"
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
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          mt: `${APP_BAR_HEIGHT}px`,
          minWidth: 0,
          overflowX: 'hidden',
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

      <OnboardingTour />
    </Box>
  );
}

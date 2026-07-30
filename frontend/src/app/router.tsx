import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AppLoadingScreen } from '@/shared/components/ui';
import { ProtectedRoute, GuestRoute } from './ProtectedRoute';

const LandingPage = lazy(() => import('@/features/landing/LandingPage'));
const AboutPage = lazy(() => import('@/features/about/AboutPage'));
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const VolunteersPage = lazy(() => import('@/features/volunteers/VolunteersPage'));
const DisastersPage = lazy(() => import('@/features/disasters/DisastersPage'));
const MissionsPage = lazy(() => import('@/features/missions/MissionsPage'));
const CoordinatorMyMissionsPage = lazy(() => import('@/features/missions/CoordinatorMyMissionsPage'));
const MissionDetailPage = lazy(() => import('@/features/missions/MissionDetailPage'));
const CoordinatorRequestsPage = lazy(() => import('@/features/missions/CoordinatorRequestsPage'));
const AvailableMissionsPage = lazy(() => import('@/features/missions/AvailableMissionsPage'));
const AvailableMissionDetailPage = lazy(() => import('@/features/missions/AvailableMissionDetailPage'));
const MyMissionsPage = lazy(() => import('@/features/assignments/MyMissionsPage'));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'));
const TicketsPage = lazy(() => import('@/features/tickets/TicketsPage'));
const TicketDetailPage = lazy(() => import('@/features/tickets/TicketDetailPage'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
const RolesPage = lazy(() => import('@/features/admin/RolesPage'));
const UsersPage = lazy(() => import('@/features/admin/UsersPage'));
const AuditLogsPage = lazy(() => import('@/features/admin/AuditLogsPage'));
const OpsBackupPage = lazy(() => import('@/features/admin/OpsBackupPage'));

function PageLoader() {
  return <AppLoadingScreen fullScreen />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>

        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route
              path="disasters"
              element={
                <ProtectedRoute roles={['admin', 'coordinator']} permissions={['disasters.view']}>
                  <DisastersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="missions"
              element={
                <ProtectedRoute roles={['admin', 'coordinator']} permissions={['missions.view']}>
                  <MissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="missions/mine"
              element={
                <ProtectedRoute
                  roles={['coordinator']}
                  excludeRoles={['admin']}
                  permissions={['missions.view']}
                >
                  <CoordinatorMyMissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="missions/coordinator-requests"
              element={
                <ProtectedRoute roles={['admin']} permissions={['missions.assign']}>
                  <CoordinatorRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="missions/:id"
              element={
                <ProtectedRoute roles={['admin', 'coordinator']} permissions={['missions.view']}>
                  <MissionDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="missions/available"
              element={
                <ProtectedRoute roles={['volunteer']} permissions={['missions.view']}>
                  <AvailableMissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="missions/available/:id"
              element={
                <ProtectedRoute roles={['volunteer']} permissions={['missions.view']}>
                  <AvailableMissionDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-missions"
              element={
                <ProtectedRoute
                  roles={['volunteer']}
                  excludeRoles={['admin', 'coordinator']}
                >
                  <MyMissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="volunteers"
              element={
                <ProtectedRoute roles={['admin', 'coordinator']} permissions={['volunteers.view']}>
                  <VolunteersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute roles={['admin', 'coordinator']} permissions={['reports.view']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="tickets"
              element={
                <ProtectedRoute permissions={['tickets.view']}>
                  <TicketsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="tickets/:id"
              element={
                <ProtectedRoute permissions={['tickets.view']}>
                  <TicketDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/roles"
              element={
                <ProtectedRoute roles={['admin']} permissions={['accounts.manage_roles']}>
                  <RolesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute
                  roles={['admin', 'coordinator']}
                  permissions={['accounts.manage_users', 'accounts.view_users']}
                >
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/audit"
              element={
                <ProtectedRoute roles={['admin']} permissions={['audit.view']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/ops"
              element={
                <ProtectedRoute roles={['admin']} permissions={['ops.view_backups']}>
                  <OpsBackupPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

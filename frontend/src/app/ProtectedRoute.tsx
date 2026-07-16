import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from '@/shared/hooks/useAuth';
import { AppLoadingScreen } from '@/shared/components/ui';
import { getPostLoginPath, shouldRedirectToProfileAfterLogin } from '@/shared/utils/profileCompletion';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  roles?: string[];
  excludeRoles?: string[];
  permissions?: string[];
  requireAllPermissions?: boolean;
}

export function ProtectedRoute({
  children,
  roles,
  excludeRoles,
  permissions,
  requireAllPermissions = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized } = useAuth();
  const { hasAnyRole, hasPermission } = usePermissions();
  const location = useLocation();

  if (!isInitialized) {
    return <AppLoadingScreen fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (excludeRoles?.length && hasAnyRole(excludeRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (roles?.length && !hasAnyRole(roles) && !hasAnyRole(['admin'])) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permissions?.length) {
    const allowed = requireAllPermissions
      ? permissions.every((p) => hasPermission(p))
      : permissions.some((p) => hasPermission(p));

    if (!allowed && !hasAnyRole(['admin'])) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}

export function GuestRoute({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user } = useAuth();

  if (!isInitialized) {
    return <AppLoadingScreen fullScreen />;
  }

  if (isAuthenticated && user) {
    const destination = getPostLoginPath(user);
    if (shouldRedirectToProfileAfterLogin(user)) {
      return <Navigate to={destination} replace state={{ completeProfileInvite: true }} />;
    }
    return <Navigate to={destination} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

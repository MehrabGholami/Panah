import { useAppSelector } from '@/app/store';

export function useAuth() {
  const { user, isAuthenticated, isLoading, isInitialized, error } = useAppSelector(
    (state) => state.auth,
  );

  return { user, isAuthenticated, isLoading, isInitialized, error };
}

export function usePermissions() {
  const user = useAppSelector((state) => state.auth.user);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.some((role) => user.roles.includes(role));
  };

  return { hasPermission, hasRole, hasAnyRole, permissions: user?.permissions ?? [], roles: user?.roles ?? [] };
}

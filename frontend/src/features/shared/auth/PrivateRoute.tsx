import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import type { UserRole } from '../../../types/user.types';

interface PrivateRouteProps {
  /** Roles permitted to access the wrapped routes */
  allowedRoles?: UserRole[];
}

/**
 * PrivateRoute
 * - Unauthenticated → /login (preserves attempted URL via state.from)
 * - Wrong role       → /unauthorized
 * - Otherwise        → renders child routes via <Outlet />
 */
export const PrivateRoute = ({ allowedRoles }: PrivateRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

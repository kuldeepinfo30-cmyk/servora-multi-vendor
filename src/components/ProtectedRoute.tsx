import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '@/lib/types';
import { useAuth } from '@/store/auth';

export function ProtectedRoute({ role }: { role: Role }) {
  const user = useAuth((s) => s.user);
  const location = useLocation();

  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (user.role !== role) {
    return <Navigate to="/403" replace state={{ from: location.pathname, attempted: role }} />;
  }

  return <Outlet />;
}

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';

/** Keeps signed-in users away from login/register. */
export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/documents" replace /> : <Outlet />;
}
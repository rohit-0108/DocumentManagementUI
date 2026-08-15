import { ShieldAlert } from 'lucide-react';
import { Navigate, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';
import type { UserRole } from '@/types';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  /** Redirect instead of showing the 403 screen. */
  redirectTo?: string;
}

/** Restricts a branch of the route tree to specific roles. */
export function RoleRoute({ allowedRoles, redirectTo }: RoleRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!user || !allowedRoles.includes(user.role)) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Access denied</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Your role ({user?.roleName}) doesn't have permission to view this page.
          Required: {allowedRoles.join(' or ')}.
        </p>
        <Button className="mt-6" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return <Outlet />;
}
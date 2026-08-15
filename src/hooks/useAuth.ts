import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { login as loginAction, logout as logoutAction } from '@/store/authSlice';
import { UserRole, type LoginRequest } from '@/types';

/** Convenience wrapper around the auth slice. */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, error, initialised } = useAppSelector((s) => s.auth);

  const login = useCallback(
    (payload: LoginRequest) => dispatch(loginAction(payload)).unwrap(),
    [dispatch],
  );

  const logout = useCallback(() => dispatch(logoutAction()).unwrap(), [dispatch]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => Boolean(user && roles.includes(user.role)),
    [user],
  );

  return {
    user,
    isAuthenticated,
    loading,
    error,
    initialised,
    login,
    logout,
    hasRole,
    isAdmin: user?.role === UserRole.Admin,
    isApprover: user?.role === UserRole.Approver,
    isUser: user?.role === UserRole.User,
    canApprove: user?.role === UserRole.Admin || user?.role === UserRole.Approver,
  };
}
import { useEffect, type ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { PageSpinner } from '@/components/ui';
import { loadCurrentUser } from '@/store/authSlice';

/** Restores the session from localStorage before rendering the router. */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const initialised = useAppSelector((s) => s.auth.initialised);
  const theme = useAppSelector((s) => s.ui.theme);

  useEffect(() => {
    dispatch(loadCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (!initialised) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageSpinner label="Starting up…" />
      </div>
    );
  }

  return <>{children}</>;
}
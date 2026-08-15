import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, Sidebar } from '@/components/common';
import { PageSpinner } from '@/components/ui';

/** Authenticated shell: navbar on top, sidebar on the left, routed content in the middle. */
export function AppLayout() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="min-h-[calc(100vh-4rem)] flex-1 overflow-x-hidden p-4 sm:p-6">
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
import { FileCheck2, ShieldCheck, Users } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';

/** Split layout for login/register with a marketing panel. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 font-bold">
            DPS
          </div>
          <span className="text-lg font-semibold">{APP_NAME}</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Manage documents with a complete audit trail.
            </h1>
            <p className="mt-4 text-primary-foreground/80">
              Upload, review and approve documents by department — every action recorded and traceable.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { Icon: FileCheck2, text: 'Departmental upload and approval workflow' },
              { Icon: ShieldCheck, text: 'Immutable, correlation-linked audit logging' },
              { Icon: Users, text: 'Role-based access for Admin, Approver and User' },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-primary-foreground/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
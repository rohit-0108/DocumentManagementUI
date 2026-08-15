import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  ScrollText,
  Upload,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';
import { setSidebarOpen } from '@/store/uiSlice';
import { UserRole } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.Admin, UserRole.Approver],
  },
  {
    to: '/documents',
    label: 'Documents',
    icon: FileText,
    roles: [UserRole.Admin, UserRole.Approver, UserRole.User],
  },
  {
    to: '/documents/upload',
    label: 'Upload',
    icon: Upload,
    roles: [UserRole.Admin, UserRole.Approver, UserRole.User],
  },
  {
    to: '/approvals',
    label: 'Approval queue',
    icon: ClipboardCheck,
    roles: [UserRole.Admin, UserRole.Approver],
  },
  { to: '/admin/users', label: 'Manage users', icon: Users, roles: [UserRole.Admin] },
  { to: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText, roles: [UserRole.Admin] },
];

export function Sidebar() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.sidebarOpen);

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 border-r bg-card pt-16 transition-transform lg:static lg:z-0 lg:translate-x-0 lg:pt-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b p-4 lg:hidden">
          <span className="text-sm font-semibold">Navigation</span>
          <Button variant="ghost" size="icon" onClick={() => dispatch(setSidebarOpen(false))}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="space-y-1 p-3">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/documents'}
              onClick={() => window.innerWidth < 1024 && dispatch(setSidebarOpen(false))}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t p-4">
          <p className="text-xs text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user?.roleName}</span>
          </p>
        </div>
      </aside>
    </>
  );
}
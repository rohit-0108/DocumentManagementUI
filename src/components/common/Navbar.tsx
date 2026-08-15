import { ChevronDown, LogOut, Menu, Moon, Sun, User as UserIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { RoleBadge } from '@/components/common';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';
import { APP_NAME } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import { toggleSidebar, toggleTheme } from '@/store/uiSlice';

export function Navbar() {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/documents" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            DPS
          </div>
          <span className="hidden text-base font-semibold sm:block">{APP_NAME}</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch(toggleTheme())}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {getInitials(user?.fullName ?? user?.username)}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight">{user?.fullName ?? user?.username}</p>
              <p className="text-xs leading-tight text-muted-foreground">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-md border bg-popover p-1 shadow-lg animate-fade-in">
              <div className="border-b px-3 py-2">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                <div className="mt-1.5">{user && <RoleBadge role={user.roleName} />}</div>
              </div>

              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <UserIcon className="h-4 w-4" />
                My profile
              </Link>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
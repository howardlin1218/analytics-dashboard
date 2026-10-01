import React from 'react';
import { LogOut, Menu, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SiteSelector } from './SiteSelector';
import { DateRangePicker } from '../ui/date-range-picker';
import { ThemeToggle } from './ThemeToggle';
import { RoleBadge } from '../common/RoleBadge';
import { Button } from '../ui/button';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden h-8 w-8"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
          <img
            src="/favicons/google-analytics-black.png"
            alt="Analytics"
            className="h-6 w-6 object-contain dark:invert"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <span className="hidden sm:inline-block text-base font-bold text-primary">
            Analytics
          </span>
        </div>

        <div className="hidden sm:block h-5 w-px bg-border mx-1" />

        <SiteSelector />
        <div className="hidden md:block">
          <DateRangePicker />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="md:hidden">
          <DateRangePicker />
        </div>

        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                {user.displayName || user.email}
              </span>
              <div className="flex items-center gap-1">
                <RoleBadge role={user.role} className="text-[10px] py-0 px-1.5" />
                {user.role === 'analyst' && user.permission && user.permission.length > 0 && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    ({user.permission.join(', ')})
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 px-2.5 h-8"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

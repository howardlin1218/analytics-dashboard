import { LogOut, Menu } from 'lucide-react';
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
    <header className="sticky top-0 z-40 flex h-14 w-full items-center border-b border-border bg-card">
      <div className="flex flex-1 items-center h-full">
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

        <span className="hidden sm:flex items-center justify-center text-base font-bold text-primary w-56 border-r border-border h-full">
          tracky
        </span>

        {/* <div className="hidden sm:block self-stretch w-px bg-border" /> */}

        <div className="flex justify-center items-center gap-2 md:px-6 lg:px-8">
          <SiteSelector />
        
          <div className="hidden md:block">
            <DateRangePicker />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="md:hidden">
          <DateRangePicker />
        </div>

        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="hidden lg:flex flex-row gap-2 justify-center items-center">
              <span className="text-base font-semibold text-foreground truncate max-w-[150px]">
                {user.displayName || user.email}
              </span>
              <div className="flex items-center gap-1">
                <RoleBadge role={user.role} className="text-sm py-0 px-1.5" />
                {/* {user.role === 'analyst' && user.permission && user.permission.length > 0 && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    ({user.permission.join(', ')})
                  </span>
                )} */}
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

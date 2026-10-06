import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SiteSelector } from './SiteSelector';
import { DateRangePicker } from '../ui/date-range-picker';
import { ThemeToggle } from './ThemeToggle';
import { RoleBadge } from '../common/RoleBadge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

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
          <DateRangePicker />
        </div>
      </div>

      <div className="flex items-center h-full gap-2 pr-4 md:pr-6 lg:pr-8">
        <ThemeToggle />

        {user && (
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-9 w-9 rounded-full bg-muted hover:bg-accent text-foreground flex items-center justify-center font-semibold text-sm border border-border shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  aria-label="User menu"
                  title={user.displayName || user.email}
                >
                  {(user.displayName || user.email || 'U').trim().charAt(0)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1">
                <DropdownMenuItem
                  className="flex items-center justify-between cursor-default select-none focus:bg-transparent"
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="text-sm text-muted-foreground font-medium">
                    {(user.displayName || 'U').trim()}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center justify-between cursor-default select-none focus:bg-transparent"
                  onSelect={(e) => e.preventDefault()}
                >
                  {/* <span className="text-xs text-muted-foreground font-medium">
                    {(user.displayName || 'U').trim()}
                  </span> */}

                  <span className="text-sm text-muted-foreground font-medium">
                    {(user.email || 'U').trim()}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center justify-between gap-2 cursor-default select-none focus:bg-transparent"
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="text-sm text-muted-foreground font-medium">Role</span>
                  <RoleBadge role={user.role} className="text-sm py-0 px-1.5" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer px-2 py-1.5 text-sm rounded-sm outline-none text-left"
                  >
                    {/* <LogOut className="h-4 w-4" /> */}
                    <span>Sign Out</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Activity,
  AlertTriangle,
  Users,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { user } = useAuth();

  const role = user?.role || 'viewer';
  const permissions = user?.permission || [];

  const canAccessOverview = role === 'super admin' || role === 'guest' || role === 'analyst';
  const canAccessPerf = role === 'super admin' || role === 'guest' || (role === 'analyst' && permissions.includes('performance'));
  const canAccessErrors = role === 'super admin' || role === 'guest' || (role === 'analyst' && permissions.includes('errors'));
  const canAccessSessions = role === 'super admin' || role === 'guest' || (role === 'analyst' && permissions.includes('sessions'));
  const canAccessAdmin = role === 'super admin';

  const navItems = [
    { to: '/overview', label: 'Overview', icon: BarChart3, accessible: canAccessOverview },
    { to: '/performance', label: 'Performance', icon: Activity, accessible: canAccessPerf },
    { to: '/errors', label: 'Errors', icon: AlertTriangle, accessible: canAccessErrors },
    { to: '/sessions', label: 'Sessions', icon: Users, accessible: canAccessSessions },
    { to: '/reports', label: 'Reports', icon: FileText, accessible: true },
    { to: '/admin', label: 'Admin Panel', icon: Shield, accessible: canAccessAdmin },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 md:static',
          collapsed ? 'w-16' : 'w-56',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-14 items-center justify-between px-3 border-b border-border">
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
              Navigation
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ml-auto"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative group',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    !item.accessible && 'opacity-60'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!item.accessible && !collapsed && (
                  <Lock className="h-3 w-3 ml-auto opacity-50 text-muted-foreground" />
                )}

                {/* Tooltip for collapsed mode */}
                {collapsed && (
                  <div className="absolute left-full ml-2 hidden rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block z-50 whitespace-nowrap">
                    {item.label} {!item.accessible && '(Restricted)'}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

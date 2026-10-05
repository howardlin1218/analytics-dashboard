import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/skeleton';

export function AppShell() {
  const { user, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('_sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('_sidebar_collapsed', String(next));
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col bg-background p-6 space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="flex flex-1 gap-4">
          <Skeleton className="w-56 h-full rounded-md" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-48 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
            </div>
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <Navbar onToggleSidebar={() => setMobileOpen((prev) => !prev)} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <main id="app-viewport" className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

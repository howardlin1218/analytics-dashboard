import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { AppShell } from './components/layout/AppShell';
import { Toaster } from './components/ui/toast';

import { OverviewView } from './views/OverviewView';
import { PerformanceView } from './views/PerformanceView';
import { ErrorsView } from './views/ErrorsView';
import { SessionsView } from './views/SessionsView';
import { ReportsView } from './views/ReportsView';
import { AdminView } from './views/AdminView';
import { LoginPage } from './views/LoginPage';
import { LandingPage } from './views/LandingPage';
import { PermissionGate } from './components/common/PermissionGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Helper component to smoothly redirect legacy hash links (e.g., #/performance -> /performance)
function LegacyHashRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
      const targetPath = hash.replace('#', '');
      navigate(targetPath, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <FilterProvider>
            <LegacyHashRedirector />
            <Toaster position="top-right" richColors />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login.html" element={<Navigate to="/login" replace />} />
              <Route path="/landing.html" element={<Navigate to="/" replace />} />
              <Route path="/dashboard.html" element={<Navigate to="/overview" replace />} />

              {/* Protected Dashboard Routes inside AppShell */}
              <Route element={<AppShell />}>
                <Route
                  path="/overview"
                  element={
                    <PermissionGate roles={['super admin', 'analyst', 'guest']}>
                      <OverviewView />
                    </PermissionGate>
                  }
                />
                <Route
                  path="/performance"
                  element={
                    <PermissionGate permission="performance">
                      <PerformanceView />
                    </PermissionGate>
                  }
                />
                <Route
                  path="/errors"
                  element={
                    <PermissionGate permission="errors">
                      <ErrorsView />
                    </PermissionGate>
                  }
                />
                <Route
                  path="/sessions"
                  element={
                    <PermissionGate permission="sessions">
                      <SessionsView />
                    </PermissionGate>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <PermissionGate>
                      <ReportsView />
                    </PermissionGate>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PermissionGate roles="super admin">
                      <AdminView />
                    </PermissionGate>
                  }
                />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </FilterProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

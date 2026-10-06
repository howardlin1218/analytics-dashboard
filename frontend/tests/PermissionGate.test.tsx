import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PermissionGate } from '../src/components/common/PermissionGate';
import * as AuthContextModule from '../src/context/AuthContext';

describe('PermissionGate Component', () => {
  const mockChildText = 'Protected Child Content';
  const ProtectedComponent = () => <div>{mockChildText}</div>;

  it('renders loading skeleton while auth state is resolving', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      refreshUser: vi.fn(),
      login: vi.fn(),
      loginGuest: vi.fn(),
      logout: vi.fn(),
      updateCurrentUserLocal: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <PermissionGate permission="performance">
          <ProtectedComponent />
        </PermissionGate>
      </MemoryRouter>
    );

    expect(screen.queryByText(mockChildText)).not.toBeInTheDocument();
    // Skeleton elements should be rendered
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('redirects unauthenticated user to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      refreshUser: vi.fn(),
      login: vi.fn(),
      loginGuest: vi.fn(),
      logout: vi.fn(),
      updateCurrentUserLocal: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <PermissionGate permission="performance">
                <ProtectedComponent />
              </PermissionGate>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText(mockChildText)).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders AccessDenied and does NOT render children when user lacks permissions', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 2,
        email: 'viewer@demo.local',
        displayName: 'Viewer',
        role: 'viewer',
        permission: [],
      },
      isLoading: false,
      isAuthenticated: true,
      refreshUser: vi.fn(),
      login: vi.fn(),
      loginGuest: vi.fn(),
      logout: vi.fn(),
      updateCurrentUserLocal: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PermissionGate permission="sessions">
          <ProtectedComponent />
        </PermissionGate>
      </MemoryRouter>
    );

    // Protected child must NOT be mounted
    expect(screen.queryByText(mockChildText)).not.toBeInTheDocument();
    // AccessDenied message rendered with auto-generated label
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.getByText(/Super Admin, Sessions Analyst/i)).toBeInTheDocument();
  });

  it('renders children when super admin accesses any route', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 1,
        email: 'admin@demo.local',
        displayName: 'Super Admin',
        role: 'super admin',
        permission: [],
      },
      isLoading: false,
      isAuthenticated: true,
      refreshUser: vi.fn(),
      login: vi.fn(),
      loginGuest: vi.fn(),
      logout: vi.fn(),
      updateCurrentUserLocal: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PermissionGate permission="sessions">
          <ProtectedComponent />
        </PermissionGate>
      </MemoryRouter>
    );

    expect(screen.getByText(mockChildText)).toBeInTheDocument();
  });

  it('renders children when analyst has specific section permission', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 3,
        email: 'analyst@demo.local',
        displayName: 'Analyst',
        role: 'analyst',
        permission: ['sessions'],
      },
      isLoading: false,
      isAuthenticated: true,
      refreshUser: vi.fn(),
      login: vi.fn(),
      loginGuest: vi.fn(),
      logout: vi.fn(),
      updateCurrentUserLocal: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PermissionGate permission="sessions">
          <ProtectedComponent />
        </PermissionGate>
      </MemoryRouter>
    );

    expect(screen.getByText(mockChildText)).toBeInTheDocument();
  });

  it('renders children when guest accesses allowed views', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 4,
        email: 'guest@demo.local',
        displayName: 'Guest Demo',
        role: 'guest',
        permission: [],
      },
      isLoading: false,
      isAuthenticated: true,
      refreshUser: vi.fn(),
      login: vi.fn(),
      loginGuest: vi.fn(),
      logout: vi.fn(),
      updateCurrentUserLocal: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PermissionGate roles={['super admin', 'analyst', 'guest']}>
          <ProtectedComponent />
        </PermissionGate>
      </MemoryRouter>
    );

    expect(screen.getByText(mockChildText)).toBeInTheDocument();
  });

  it('renders children for any authenticated role (including viewer) on reports', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 5,
        email: 'viewer@demo.local',
        displayName: 'Viewer',
        role: 'viewer',
        permission: [],
      },
      isLoading: false,
      isAuthenticated: true,
      refreshUser: vi.fn(),
      login: vi.fn(),
      loginGuest: vi.fn(),
      logout: vi.fn(),
      updateCurrentUserLocal: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PermissionGate>
          <ProtectedComponent />
        </PermissionGate>
      </MemoryRouter>
    );

    expect(screen.getByText(mockChildText)).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { AuthProvider } from '../src/context/AuthContext';
import { AdminView } from '../src/views/AdminView';

describe('AdminView Component', () => {
  it('renders users list and Add User form for super admin', async () => {
    // Override auth to return super admin
    server.use(
      http.get('*/api/dashboard', () => {
        return HttpResponse.json({
          user: {
            id: 1,
            email: 'admin@demo.local',
            displayName: 'Super Admin',
            role: 'super admin',
            permission: [],
          },
        });
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <AdminView />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify existing users table renders
    await waitFor(() => {
      expect(screen.getByText('admin@demo.local')).toBeInTheDocument();
      expect(screen.getByText('analyst@demo.local')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    // Verify Add User form elements
    expect(screen.getByText('Add New User')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('analyst@example.com')).toBeInTheDocument();
  });
});

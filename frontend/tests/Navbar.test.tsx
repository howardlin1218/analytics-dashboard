import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { AuthProvider } from '../src/context/AuthContext';
import { FilterProvider } from '../src/context/FilterContext';
import { Navbar } from '../src/components/layout/Navbar';

describe('Navbar user avatar dropdown menu', () => {
  it('displays the user name as a circular button icon with first initial instead of actual name, and toggles dropdown menu on click', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <FilterProvider>
              <Navbar />
            </FilterProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Initial "D" for "Demo Analyst" inside the circular button icon
    const avatarButton = await screen.findByRole('button', { name: /user menu/i });
    expect(avatarButton).toBeInTheDocument();
    expect(avatarButton).toHaveTextContent('D');
    expect(avatarButton).toHaveClass('rounded-full');

    // Actual full name should NOT be displayed
    expect(screen.queryByText('Demo Analyst')).not.toBeInTheDocument();

    // Role and Sign Out button should NOT be displayed by default
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    expect(screen.queryByText('Analyst')).not.toBeInTheDocument();

    // Click circular avatar button to open dropdown menu
    await user.click(avatarButton);

    // Dropdown menu should reveal role and Sign Out button
    expect(await screen.findByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Analyst')).toBeInTheDocument();
    const signOutBtn = screen.getByText('Sign Out');
    expect(signOutBtn).toBeInTheDocument();

    // Click Sign Out and verify logout
    await user.click(signOutBtn);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /user menu/i })).not.toBeInTheDocument();
    });
  });

  it('displays "b" for a user named "bob"', async () => {
    server.use(
      http.get('*/api/dashboard', () => {
        return HttpResponse.json({
          user: {
            id: 2,
            email: 'bob@example.com',
            displayName: 'bob',
            role: 'viewer',
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
            <FilterProvider>
              <Navbar />
            </FilterProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Circular button should display "b"
    const avatarButton = await screen.findByRole('button', { name: /user menu/i });
    expect(avatarButton).toHaveTextContent('b');
    expect(screen.queryByText('bob')).not.toBeInTheDocument();
  });

  it('has pr-4 md:pr-6 lg:pr-8 padding on the right container matching page content', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <FilterProvider>
              <Navbar />
            </FilterProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const avatarButton = await screen.findByRole('button', { name: /user menu/i });
    const rightContainer = avatarButton.parentElement;
    expect(rightContainer).toHaveClass('pr-4');
    expect(rightContainer).toHaveClass('md:pr-6');
    expect(rightContainer).toHaveClass('lg:pr-8');
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { FilterProvider } from '../src/context/FilterContext';
import { SessionsView } from '../src/views/SessionsView';

describe('SessionsView Component', () => {
  it('renders user sessions list and placeholder', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <FilterProvider>
              <SessionsView />
            </FilterProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify session card renders in sidebar
    await waitFor(() => {
      expect(screen.getByText(/ID: sess-abc/i)).toBeInTheDocument();
      expect(screen.getByText('14 actions')).toBeInTheDocument();
    });

    // Verify placeholder prompt
    expect(screen.getByText('No Session Selected')).toBeInTheDocument();
  });
});

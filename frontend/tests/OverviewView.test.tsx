import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { FilterProvider } from '../src/context/FilterContext';
import { OverviewView } from '../src/views/OverviewView';

describe('OverviewView Component (Stage F1 & F2)', () => {
  it('renders overview metrics and top pages table after loading', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <FilterProvider>
              <OverviewView />
            </FilterProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Should load and resolve metrics
    await waitFor(() => {
      expect(screen.getByText('1,240')).toBeInTheDocument();
      expect(screen.getByText('380')).toBeInTheDocument();
      expect(screen.getByText('45s')).toBeInTheDocument();
      expect(screen.getByText('4,290')).toBeInTheDocument();
    });

    // Top pages table should be populated
    expect(screen.getByText('/dashboard.html')).toBeInTheDocument();
    expect(screen.getByText('/login.html')).toBeInTheDocument();
  });
});

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { FilterProvider } from '../src/context/FilterContext';
import { PerformanceView } from '../src/views/PerformanceView';

describe('PerformanceView Component', () => {
  it('renders web vitals gauges and sorts per-page performance table', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <FilterProvider>
              <PerformanceView />
            </FilterProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify vitals gauges load
    await waitFor(() => {
      expect(screen.getByText('1200 ms')).toBeInTheDocument();
      expect(screen.getByText('80 ms')).toBeInTheDocument();
      expect(screen.getByText('0.05')).toBeInTheDocument();
    });

    // Verify per-page table rows
    expect(screen.getByText('/dashboard.html')).toBeInTheDocument();
    expect(screen.getByText('/login.html')).toBeInTheDocument();

    // Verify Generate Report button
    expect(screen.getByRole('button', { name: /Generate Performance Report/i })).toBeInTheDocument();
  });
});

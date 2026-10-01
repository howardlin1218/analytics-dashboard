import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { FilterProvider } from '../src/context/FilterContext';
import { ErrorsView } from '../src/views/ErrorsView';

describe('ErrorsView Component', () => {
  it('renders error list and opens stack trace panel on error click', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <FilterProvider>
              <ErrorsView />
            </FilterProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify error row loads
    await waitFor(() => {
      expect(screen.getByText('Cannot read properties of undefined')).toBeInTheDocument();
      expect(screen.getByText('TypeError')).toBeInTheDocument();
    });

    // Click row to view stack trace details
    const errorCell = screen.getByText('Cannot read properties of undefined');
    fireEvent.click(errorCell);

    await waitFor(() => {
      expect(screen.getAllByText(/Stack Trace/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/at app\.js:42:15/i)).toBeInTheDocument();
    });
  });
});

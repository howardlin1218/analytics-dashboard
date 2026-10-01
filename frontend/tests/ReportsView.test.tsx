import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { ReportsView } from '../src/views/ReportsView';

describe('ReportsView Component', () => {
  it('renders saved reports cards with download links', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <ReportsView />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify report card renders
    await waitFor(() => {
      expect(screen.getByText('Performance Report - 9/30/2026')).toBeInTheDocument();
      expect(screen.getByText(/"Initial benchmark"/i)).toBeInTheDocument();
      expect(screen.getByText(/View \/ Download PDF/i)).toBeInTheDocument();
    });
  });
});

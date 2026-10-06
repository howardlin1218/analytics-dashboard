import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { FilterProvider } from '../src/context/FilterContext';
import { SiteSelector } from '../src/components/layout/SiteSelector';

describe('SiteSelector Component', () => {
  it('filters out localhost from the site options list', async () => {
    // Override /api/overview/sites to return localhost along with other sites
    server.use(
      http.get('*/api/overview/sites', () => {
        return HttpResponse.json({
          success: true,
          sites: ['localhost', 'reporting.howard1218.site', 'collector.howard1218.site'],
        });
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FilterProvider>
            <SiteSelector />
          </FilterProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Initial button shows All Sites or loading then All Sites
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveTextContent('All Sites');
    });

    // Open the dropdown
    fireEvent.click(screen.getByRole('combobox'));

    // Verify valid sites and "All Sites" are displayed
    expect(screen.getByRole('button', { name: /all sites/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reporting\.howard1218\.site/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collector\.howard1218\.site/i })).toBeInTheDocument();

    // Verify "localhost" is NOT displayed
    expect(screen.queryByRole('button', { name: /^localhost$/i })).not.toBeInTheDocument();
  });
});

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  it('renders chronological journey in a scrollable container when a session is selected', async () => {
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

    // Wait for session card to render and click it
    const sessionCard = await screen.findByText(/ID: sess-abc/i);
    fireEvent.click(sessionCard);

    // Verify Chronological Journey renders
    const journeyTitle = await screen.findByText(/Chronological Journey \(2 events\)/i);
    expect(journeyTitle).toBeInTheDocument();

    // Verify the container has overflow-y-auto and bounded max-height so it stays within one page
    const journeyCard = journeyTitle.closest('.rounded-xl') || journeyTitle.closest('div');
    const scrollContainer = journeyCard?.querySelector('.overflow-y-auto');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer?.className).toContain('overflow-y-auto');
    expect(scrollContainer?.className).toContain('max-h-');
  });

  it('allows the user to expand the journey to a popup modal to view and scroll through', async () => {
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

    // Select session
    const sessionCard = await screen.findByText(/ID: sess-abc/i);
    fireEvent.click(sessionCard);

    // Find and click "Expand Journey" button
    const expandBtn = await screen.findByRole('button', { name: /expand journey/i });
    expect(expandBtn).toBeInTheDocument();
    fireEvent.click(expandBtn);

    // Verify modal dialog is opened
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Verify modal contains the scrollable journey container
    const modalScrollContainer = dialog.querySelector('.overflow-y-auto');
    expect(modalScrollContainer).toBeInTheDocument();
    expect(modalScrollContainer?.className).toContain('overflow-y-auto');
    expect(modalScrollContainer?.className).toContain('overscroll-contain');
  });
});

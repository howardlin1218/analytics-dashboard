import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { FilterProvider, useFilters } from '../src/context/FilterContext';
import { DateRangePicker } from '../src/components/ui/date-range-picker';
import { format, subDays } from 'date-fns';

const TestConsumer = () => {
  const { dateRange } = useFilters();
  return (
    <div data-testid="date-range-display">
      {format(dateRange.startDate, 'yyyy-MM-dd')} to {format(dateRange.endDate, 'yyyy-MM-dd')}
    </div>
  );
};

describe('DateRangePicker & FilterContext (Stage F1)', () => {
  it('renders with default date range and opens presets', async () => {
    render(
      <MemoryRouter>
        <FilterProvider>
          <DateRangePicker />
          <TestConsumer />
        </FilterProvider>
      </MemoryRouter>
    );

    // Initial render should show button with formatted dates
    const trigger = screen.getByRole('button', { name: /select date range/i });
    expect(trigger).toBeInTheDocument();

    // Click to open popover
    fireEvent.click(trigger);

    // Presets should be visible
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();

    // Click 'Today' preset
    fireEvent.click(screen.getByText('Today'));

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await waitFor(() => {
      expect(screen.getByTestId('date-range-display')).toHaveTextContent(`${todayStr} to ${todayStr}`);
    });
  });

  it('updates date range when Last 7 Days preset is clicked', async () => {
    render(
      <MemoryRouter>
        <FilterProvider>
          <DateRangePicker />
          <TestConsumer />
        </FilterProvider>
      </MemoryRouter>
    );

    const trigger = screen.getByRole('button', { name: /select date range/i });
    fireEvent.click(trigger);

    fireEvent.click(screen.getByText('Last 7 Days'));

    const expectedStart = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const expectedEnd = format(new Date(), 'yyyy-MM-dd');

    await waitFor(() => {
      expect(screen.getByTestId('date-range-display')).toHaveTextContent(`${expectedStart} to ${expectedEnd}`);
    });
  });

  it('updates date range when All Time preset is clicked', async () => {
    render(
      <MemoryRouter>
        <FilterProvider>
          <DateRangePicker />
          <TestConsumer />
        </FilterProvider>
      </MemoryRouter>
    );

    const trigger = screen.getByRole('button', { name: /select date range/i });
    fireEvent.click(trigger);

    expect(screen.getByText('All Time')).toBeInTheDocument();
    fireEvent.click(screen.getByText('All Time'));

    await waitFor(() => {
      expect(trigger).toHaveTextContent('All Time');
    });
  });
});

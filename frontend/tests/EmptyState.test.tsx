import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from '../src/components/common/EmptyState';
import { Button } from '../src/components/ui/button';

describe('EmptyState Component (Stage F1)', () => {
  it('renders custom title, description, and optional action', () => {
    render(
      <EmptyState
        title="No Telemetry Found"
        description="There are no pageviews logged for this site."
        action={<Button>Create Log</Button>}
      />
    );

    expect(screen.getByText('No Telemetry Found')).toBeInTheDocument();
    expect(screen.getByText('There are no pageviews logged for this site.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Log' })).toBeInTheDocument();
  });
});

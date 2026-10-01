import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LoginPage } from '../src/views/LoginPage';
import { AccessDenied } from '../src/components/common/AccessDenied';

describe('AuthFlow and RBAC Guards (Stage F2)', () => {
  it('renders login page with email, password, and guest login button', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByText(/Try Demo Mode/i)).toBeInTheDocument();
  });

  it('renders AccessDenied component with required permission message', () => {
    render(
      <MemoryRouter>
        <AccessDenied requiredRole="Super Admin" />
      </MemoryRouter>
    );

    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Overview/i })).toBeInTheDocument();
  });
});

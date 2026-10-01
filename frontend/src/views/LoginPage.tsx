import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

export function LoginPage() {
  const { user, login, loginGuest } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  // If already authenticated, redirect to overview
  if (user) {
    return <Navigate to="/overview" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/overview');
    } else {
      setErrorMessage(result.error || 'Invalid email or password.');
    }
  };

  const handleGuestLogin = async () => {
    setErrorMessage('');
    setIsGuestLoading(true);

    const result = await loginGuest();
    setIsGuestLoading(false);

    if (result.success) {
      navigate('/overview');
    } else {
      setErrorMessage(result.error || 'Network error during guest login.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md shadow-xl border-border bg-card">
        <div className="h-1.5 w-full bg-primary rounded-t-xl" />
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">Analytics Dashboard</CardTitle>
          <CardDescription>Sign in to view your reports and operational health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-red-100 text-red-900 border border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-10 font-semibold shadow">
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-card px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              OR
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isGuestLoading}
            onClick={handleGuestLogin}
            className="w-full h-10 border-dashed border-primary text-primary hover:bg-accent flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            {isGuestLoading ? 'Loading Demo...' : 'Try Demo Mode (Guest Access)'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

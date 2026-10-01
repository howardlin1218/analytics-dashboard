import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface AccessDeniedProps {
  requiredRole?: string;
  message?: string;
}

export function AccessDenied({
  requiredRole = 'Super Admin or Analyst',
  message = "You don't have the required permissions to view this section.",
}: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mb-4 text-destructive">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Access Restricted</h2>
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-xs text-muted-foreground mb-6">
        <span>Required:</span>
        <strong className="text-foreground">{requiredRole}</strong>
      </div>
      <Button
        onClick={() => navigate('/overview')}
        className="flex items-center gap-2"
        variant="outline"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Overview
      </Button>
    </div>
  );
};

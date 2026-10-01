import React from 'react';
import { Badge } from '../ui/badge';
import { Role } from '../../types/auth';

interface RoleBadgeProps {
  role: Role | string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const normalized = (role || 'viewer').toLowerCase().trim();

  let variant: 'success' | 'warning' | 'info' | 'purple' | 'secondary' = 'secondary';
  let label = role;

  if (normalized === 'super admin') {
    variant = 'success';
    label = 'Super Admin';
  } else if (normalized === 'analyst') {
    variant = 'warning';
    label = 'Analyst';
  } else if (normalized === 'viewer') {
    variant = 'info';
    label = 'Viewer';
  } else if (normalized === 'guest') {
    variant = 'purple';
    label = 'Guest';
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};

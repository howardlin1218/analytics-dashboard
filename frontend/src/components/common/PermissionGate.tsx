import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from './AccessDenied';
import { Skeleton } from '../ui/skeleton';
import { Role, Permission } from '../../types/auth';

interface PermissionGateProps {
  permission?: Permission;
  roles?: Role | Role[];
  label?: string;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  roles,
  label,
  children,
}: PermissionGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const { role, permission: userPerms = [] } = user;
  const perms = (Array.isArray(userPerms) ? userPerms : []) as string[];

  let hasAccess = false;

  if (permission) {
    // Analyst permission section: super admin, guest, or analyst with the specific permission
    hasAccess = role === 'super admin' || role === 'guest' || (role === 'analyst' && perms.includes(permission));
  } else if (roles) {
    // Role-gated section: must match one of the allowed roles
    const allowed = Array.isArray(roles) ? roles : [roles];
    hasAccess = allowed.includes(role);
  } else {
    // Universal authenticated section (e.g. Reports)
    hasAccess = true;
  }

  if (!hasAccess) {
    const defaultLabel = permission
      ? `Super Admin, ${permission.charAt(0).toUpperCase() + permission.slice(1)} Analyst`
      : Array.isArray(roles)
        ? "Super Admin, Analyst"
        : 'Super Admin';

    return <AccessDenied requiredRole={label || defaultLabel} />;
  }

  return <>{children}</>;
}

import React from 'react';
import { UserPlus, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Role } from '../../types/auth';

interface CreateUserCardProps {
  email: string;
  setEmail: (email: string) => void;
  name: string;
  setName: (name: string) => void;
  password: string;
  setPassword: (password: string) => void;
  role: Role;
  setRole: (role: Role) => void;
  permissions: string[];
  setPermissions: React.Dispatch<React.SetStateAction<string[]>>;
  permissionOptions: string[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const CreateUserCard: React.FC<CreateUserCardProps> = ({
  email,
  setEmail,
  name,
  setName,
  password,
  setPassword,
  role,
  setRole,
  permissions,
  setPermissions,
  permissionOptions,
  isSubmitting,
  onSubmit,
}) => {
  const handleTogglePermission = (perm: string) => {
    setPermissions((current) =>
      current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm]
    );
  };

  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" /> Add New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form id="add-user-form" onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="new-email">
                Email
              </label>
              <input
                id="new-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@example.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="new-name">
                Display Name
              </label>
              <input
                id="new-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Doe"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="new-password">
                Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="new-role">
                Role
              </label>
              <select
                id="new-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="super admin">Super Admin</option>
              </select>
            </div>
          </div>

          {role === 'analyst' && (
            <div className="space-y-2 pt-2 border-t border-border" id="permissions-group">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Analyst Permissions
              </label>
              <div className="flex flex-wrap gap-3">
                {permissionOptions.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-md border border-border px-3 py-1.5 hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm)}
                      onChange={() => handleTogglePermission(perm)}
                      className="rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="capitalize">{perm}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting} className="btn-submit gap-2">
              <Plus className="w-4 h-4" /> Add User
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

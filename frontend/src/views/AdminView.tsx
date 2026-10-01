import React, { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../api/useUsers';
import { AccessDenied } from '../components/common/AccessDenied';
import { RoleBadge } from '../components/common/RoleBadge';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from '../components/ui/toast';
import { UserRecord } from '../types/api';
import { Role } from '../types/auth';

export function AdminView() {
  const { user: currentUser, updateCurrentUserLocal } = useAuth();
  const { data, isLoading, isError, error } = useUsers();

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Add User State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('viewer');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Role>('viewer');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  // Role Guard: Super Admin Only
  if (currentUser?.role !== 'super admin') {
    return <AccessDenied requiredRole="Super Admin" />;
  }

  const users = data?.data || [];

  const handleTogglePermission = (
    perm: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(
      current.includes(perm)
        ? current.filter((p) => p !== perm)
        : [...current, perm]
    );
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createUserMutation.mutateAsync({
        email: newEmail,
        displayName: newName,
        password: newPassword,
        role: newRole,
        permissions: newRole === 'analyst' ? newPermissions : [],
      });

      if (res.success) {
        toast.success('User created successfully');
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNewRole('viewer');
        setNewPermissions([]);
      } else {
        toast.error(res.error || 'Failed to create user');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating user');
    }
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setEditName(u.display_name);
    setEditRole(u.role);
    let perms: string[] = [];
    try {
      perms = typeof u.permission === 'string' ? JSON.parse(u.permission) : (u.permission || []);
    } catch {
      perms = [];
    }
    setEditPermissions(Array.isArray(perms) ? perms : []);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const res = await updateUserMutation.mutateAsync({
        id: editingUser.id,
        displayName: editName,
        role: editRole,
        permissions: editRole === 'analyst' ? editPermissions : [],
      });

      if (res.success) {
        toast.success('User updated successfully');
        // If current user updated themselves, sync state
        if (currentUser && currentUser.id === editingUser.id) {
          updateCurrentUserLocal({
            displayName: editName,
            role: editRole,
            permission: editRole === 'analyst' ? editPermissions : [],
          });
        }
        setEditingUser(null);
      } else {
        toast.error(res.error || 'Failed to update user');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating user');
    }
  };

  const handleDeleteUser = async (u: UserRecord) => {
    if (!window.confirm(`Delete user ${u.email}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await deleteUserMutation.mutateAsync(u.id);
      if (res.success) {
        toast.success('User deleted successfully');
      } else {
        toast.error(res.error || 'Failed to delete user');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting user');
    }
  };

  const permissionOptions = ['performance', 'errors', 'sessions'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage user accounts, roles, and analyst permissions.</p>
      </div>

      {/* Users Table */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Existing Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody id="user-table-body">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-sm text-destructive">
                    Failed to load users: {(error as Error)?.message}
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u: UserRecord) => {
                  let perms: string[] = [];
                  try {
                    perms = typeof u.permission === 'string' ? JSON.parse(u.permission) : (u.permission || []);
                  } catch {
                    perms = [];
                  }
                  const permDisplay = u.role === 'super admin' ? 'All' : perms.length > 0 ? perms.join(', ') : 'None';

                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs font-medium">{u.email}</TableCell>
                      <TableCell className="text-xs">{u.display_name}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{permDisplay}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(u)}
                          className="h-8 px-2 text-xs gap-1 btn btn-edit"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(u)}
                          className="h-8 px-2 text-xs gap-1 btn btn-delete"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Card */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> Add New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form id="add-user-form" onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="new-email">
                  Email
                </label>
                <input
                  id="new-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
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
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
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
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="super admin">Super Admin</option>
                </select>
              </div>
            </div>

            {newRole === 'analyst' && (
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
                        checked={newPermissions.includes(perm)}
                        onChange={() => handleTogglePermission(perm, newPermissions, setNewPermissions)}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <span className="capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={createUserMutation.isPending} className="btn-submit gap-2">
                <Plus className="w-4 h-4" /> Add User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as Role)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="super admin">Super Admin</option>
              </select>
            </div>

            {editRole === 'analyst' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Permissions
                </label>
                <div className="flex flex-wrap gap-2">
                  {permissionOptions.map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-md border border-border px-2.5 py-1 hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={editPermissions.includes(perm)}
                        onChange={() => handleTogglePermission(perm, editPermissions, setEditPermissions)}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <span className="capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

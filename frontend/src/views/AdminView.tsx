import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../api/useUsers';
import { AccessDenied } from '../components/common/AccessDenied';
import { toast } from '../components/ui/toast';
import { UserRecord } from '../types/api';
import { Role } from '../types/auth';
import { UserTable } from '../components/admin/UserTable';
import { CreateUserCard } from '../components/admin/CreateUserCard';
import { EditUserDialog } from '../components/admin/EditUserDialog';

export function AdminView() {
  const { user: currentUser, updateCurrentUserLocal } = useAuth();

  // Role Guard calculation
  const isSuperAdmin = currentUser?.role === 'super admin';

  // 1. Hooks called unconditionally at top level
  // 2. Query execution is gated by enabled: isSuperAdmin
  const { data, isLoading, isError, error } = useUsers({
    enabled: isSuperAdmin,
  });

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
  if (!isSuperAdmin) {
    return <AccessDenied requiredRole="Super Admin" />;
  }

  const users = data?.data || [];
  const permissionOptions = ['performance', 'errors', 'sessions'];

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
      </div>

      <UserTable
        users={users}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onEditUser={openEditModal}
        onDeleteUser={handleDeleteUser}
      />

      <CreateUserCard
        email={newEmail}
        setEmail={setNewEmail}
        name={newName}
        setName={setNewName}
        password={newPassword}
        setPassword={setNewPassword}
        role={newRole}
        setRole={setNewRole}
        permissions={newPermissions}
        setPermissions={setNewPermissions}
        permissionOptions={permissionOptions}
        isSubmitting={createUserMutation.isPending}
        onSubmit={handleCreateUser}
      />

      <EditUserDialog
        editingUser={editingUser}
        onClose={() => setEditingUser(null)}
        editName={editName}
        setEditName={setEditName}
        editRole={editRole}
        setEditRole={setEditRole}
        editPermissions={editPermissions}
        setEditPermissions={setEditPermissions}
        permissionOptions={permissionOptions}
        onSave={handleUpdateUser}
        isSaving={updateUserMutation.isPending}
      />
    </div>
  );
}

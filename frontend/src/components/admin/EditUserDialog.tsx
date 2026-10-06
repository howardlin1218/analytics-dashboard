import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { UserRecord } from '../../types/api';
import { Role } from '../../types/auth';

interface EditUserDialogProps {
  editingUser: UserRecord | null;
  onClose: () => void;
  editName: string;
  setEditName: (name: string) => void;
  editRole: Role;
  setEditRole: (role: Role) => void;
  editPermissions: string[];
  setEditPermissions: React.Dispatch<React.SetStateAction<string[]>>;
  permissionOptions: string[];
  onSave: () => void;
  isSaving: boolean;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  editingUser,
  onClose,
  editName,
  setEditName,
  editRole,
  setEditRole,
  editPermissions,
  setEditPermissions,
  permissionOptions,
  onSave,
  isSaving,
}) => {
  const handleTogglePermission = (perm: string) => {
    setEditPermissions((current) =>
      current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm]
    );
  };

  return (
    <Dialog open={!!editingUser} onOpenChange={(open) => !open && onClose()}>
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
                      onChange={() => handleTogglePermission(perm)}
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

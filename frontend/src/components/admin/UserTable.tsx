import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import { RoleBadge } from '../common/RoleBadge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { UserRecord } from '../../types/api';

interface UserTableProps {
  users: UserRecord[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onEditUser: (user: UserRecord) => void;
  onDeleteUser: (user: UserRecord) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  isError,
  error,
  onEditUser,
  onDeleteUser,
}) => {
  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-3 pl-4">
        <CardTitle className="text-lg font-bold">Users</CardTitle>
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
                <TableRow key={`user-skel-${i}`}>
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
                        onClick={() => onEditUser(u)}
                        className="h-8 px-2 text-xs gap-1 btn btn-edit"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteUser(u)}
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
  );
};

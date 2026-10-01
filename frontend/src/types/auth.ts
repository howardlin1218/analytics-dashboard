export type Role = 'super admin' | 'analyst' | 'viewer' | 'guest';

export type Permission = 'performance' | 'errors' | 'sessions' | 'reports' | 'overview';

export interface User {
  id: number;
  email: string;
  displayName: string;
  role: Role;
  permission: (Permission | string)[];
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCurrentUserLocal: (updates: Partial<User>) => void;
}

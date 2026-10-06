import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { UsersResponse } from '../types/api';

export const useUsers = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async ({ signal }): Promise<UsersResponse> => {
      return await apiClient<UsersResponse>('/api/users', { signal });
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      email: string;
      displayName: string;
      password: string;
      role: string;
      permissions: string[];
    }) => {
      return await apiClient<{ success: boolean; error?: string }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      displayName,
      role,
      permissions,
    }: {
      id: number;
      displayName: string;
      role: string;
      permissions?: string[];
    }) => {
      return await apiClient<{ success: boolean; error?: string }>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ displayName, role, permissions }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await apiClient<{ success: boolean; error?: string }>(`/api/users/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

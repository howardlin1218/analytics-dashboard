import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ReportsResponse } from '../types/api';

export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async (): Promise<ReportsResponse> => {
      return await apiClient<ReportsResponse>('/api/reports');
    },
    staleTime: 30_000,
  });
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      section,
      comments,
      dataSnapshot,
    }: {
      section: string;
      comments: string;
      dataSnapshot: any;
    }) => {
      return await apiClient<{ success: boolean; url: string; message: string }>('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ section, comments, dataSnapshot }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, section }: { reportId: number; section?: string }) => {
      return await apiClient<{ success: boolean; message: string }>(`/api/reports/${reportId}`, {
        method: 'DELETE',
        body: JSON.stringify({ section }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

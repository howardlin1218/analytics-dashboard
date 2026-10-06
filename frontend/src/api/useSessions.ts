import { useQuery } from '@tanstack/react-query';
import { useFilters } from '../context/FilterContext';
import { apiClient } from './client';
import { SessionsListResponse, SessionDetailResponse } from '../types/api';

export const useSessions = (options?: { enabled?: boolean }) => {
  const { selectedSite, dateRange } = useFilters();

  return useQuery({
    queryKey: [
      'sessions',
      selectedSite,
      dateRange.isAllTime ? 'all-time' : dateRange.startDate.toISOString(),
      dateRange.isAllTime ? 'all-time' : dateRange.endDate.toISOString(),
    ],
    queryFn: async ({ signal }): Promise<SessionsListResponse> => {
      const params = new URLSearchParams();
      if (selectedSite && selectedSite !== 'all') {
        params.set('siteId', selectedSite);
      }
      if (!dateRange.isAllTime) {
        params.set('startDate', dateRange.startDate.toISOString());
        params.set('endDate', dateRange.endDate.toISOString());
      }

      return await apiClient<SessionsListResponse>(`/api/sessions?${params.toString()}`, { signal });
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
};

export const useSessionDetail = (sessionId: string | null, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['session-detail', sessionId],
    queryFn: async ({ signal }): Promise<SessionDetailResponse> => {
      if (!sessionId) throw new Error('No session ID provided');
      return await apiClient<SessionDetailResponse>(`/api/sessions/${encodeURIComponent(sessionId)}`, { signal });
    },
    enabled: (options?.enabled ?? true) && Boolean(sessionId),
    staleTime: 60_000,
  });
};

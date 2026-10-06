import { useQuery } from '@tanstack/react-query';
import { useFilters } from '../context/FilterContext';
import { apiClient } from './client';
import { OverviewResponse } from '../types/api';
import { filterItemsByDateRange } from '../utils/dateFilter';

export const useSites = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async ({ signal }) => {
      const res = await apiClient<{ success: boolean; sites: string[] }>('/api/overview/sites', { signal });
      return (res.sites || []).filter(
        (site) => site.trim().toLowerCase() !== 'localhost'
      );
    },
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
};

export const useOverview = (options?: { enabled?: boolean }) => {
  const { selectedSite, dateRange } = useFilters();

  return useQuery({
    queryKey: [
      'overview',
      selectedSite,
      dateRange.isAllTime ? 'all-time' : dateRange.startDate.toISOString(),
      dateRange.isAllTime ? 'all-time' : dateRange.endDate.toISOString(),
    ],
    queryFn: async ({ signal }): Promise<OverviewResponse> => {
      const params = new URLSearchParams();
      if (selectedSite && selectedSite !== 'all') {
        params.set('siteId', selectedSite);
      }
      if (!dateRange.isAllTime) {
        params.set('startDate', dateRange.startDate.toISOString());
        params.set('endDate', dateRange.endDate.toISOString());
      }

      const data = await apiClient<OverviewResponse>(`/api/overview?${params.toString()}`, { signal });

      return {
        ...data,
        rawLogs: data.rawLogs && Array.isArray(data.rawLogs)
          ? filterItemsByDateRange(data.rawLogs, dateRange)
          : data.rawLogs,
      };
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
};

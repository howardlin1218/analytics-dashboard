import { useQuery } from '@tanstack/react-query';
import { useFilters } from '../context/FilterContext';
import { apiClient } from './client';
import { OverviewResponse } from '../types/api';
import { filterItemsByDateRange } from '../utils/dateFilter';

export const useSites = () => {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; sites: string[] }>('/api/overview/sites');
      return res.sites || [];
    },
    staleTime: 60_000,
  });
};

export const useOverview = () => {
  const { selectedSite, dateRange } = useFilters();

  return useQuery({
    queryKey: ['overview', selectedSite, dateRange.startDate.toISOString(), dateRange.endDate.toISOString()],
    queryFn: async (): Promise<OverviewResponse> => {
      const params = new URLSearchParams();
      if (selectedSite && selectedSite !== 'all') {
        params.set('siteId', selectedSite);
      }
      params.set('startDate', dateRange.startDate.toISOString());
      params.set('endDate', dateRange.endDate.toISOString());

      const data = await apiClient<OverviewResponse>(`/api/overview?${params.toString()}`);

      // Client-side date filter safeguard if rawLogs are returned
      if (data.rawLogs && Array.isArray(data.rawLogs)) {
        data.rawLogs = filterItemsByDateRange(data.rawLogs, dateRange);
      }

      return data;
    },
    staleTime: 30_000,
  });
};

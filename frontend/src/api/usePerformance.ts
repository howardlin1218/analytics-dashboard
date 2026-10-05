import { useQuery } from '@tanstack/react-query';
import { useFilters } from '../context/FilterContext';
import { apiClient } from './client';
import { PerformanceResponse } from '../types/api';

export const usePerformance = () => {
  const { selectedSite, dateRange } = useFilters();

  return useQuery({
    queryKey: [
      'performance',
      selectedSite,
      dateRange.isAllTime ? 'all-time' : dateRange.startDate.toISOString(),
      dateRange.isAllTime ? 'all-time' : dateRange.endDate.toISOString(),
    ],
    queryFn: async (): Promise<PerformanceResponse> => {
      const params = new URLSearchParams();
      if (selectedSite && selectedSite !== 'all') {
        params.set('siteId', selectedSite);
      }
      if (!dateRange.isAllTime) {
        params.set('startDate', dateRange.startDate.toISOString());
        params.set('endDate', dateRange.endDate.toISOString());
      }

      return await apiClient<PerformanceResponse>(`/api/performance?${params.toString()}`);
    },
    staleTime: 30_000,
  });
};

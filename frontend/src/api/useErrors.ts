import { useQuery } from '@tanstack/react-query';
import { useFilters } from '../context/FilterContext';
import { apiClient } from './client';
import { ErrorsResponse } from '../types/api';

export const useErrors = () => {
  const { selectedSite, dateRange } = useFilters();

  return useQuery({
    queryKey: [
      'errors',
      selectedSite,
      dateRange.isAllTime ? 'all-time' : dateRange.startDate.toISOString(),
      dateRange.isAllTime ? 'all-time' : dateRange.endDate.toISOString(),
    ],
    queryFn: async (): Promise<ErrorsResponse> => {
      const params = new URLSearchParams();
      if (selectedSite && selectedSite !== 'all') {
        params.set('siteId', selectedSite);
      }
      if (!dateRange.isAllTime) {
        params.set('startDate', dateRange.startDate.toISOString());
        params.set('endDate', dateRange.endDate.toISOString());
      }

      return await apiClient<ErrorsResponse>(`/api/errors?${params.toString()}`);
    },
    staleTime: 30_000,
  });
};

import React, { createContext, useContext, useState } from 'react';
import { subDays, endOfDay, startOfDay } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  isAllTime?: boolean;
}

export interface FilterContextType {
  selectedSite: string;
  setSelectedSite: (site: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  // Initialize site from localStorage or default to 'all'
  const [selectedSite, setSelectedSiteState] = useState<string>(() => {
    const fromStorage = localStorage.getItem('_dashboard_selected_site');
    if (fromStorage && fromStorage.trim().toLowerCase() === 'localhost') {
      return 'all';
    }
    return fromStorage || 'all';
  });

  // Initialize date range from localStorage or default to Last 30 Days
  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    try {
      const stored = localStorage.getItem('_dashboard_date_range');
      if (stored) {
        const parsed = JSON.parse(stored);
        const parsedStart = new Date(parsed.startDate);
        const cappedStart = parsedStart.getFullYear() < 2000 ? startOfDay(new Date(2000, 0, 1)) : parsedStart;
        return {
          startDate: cappedStart,
          endDate: new Date(parsed.endDate),
          isAllTime: !!parsed.isAllTime,
        };
      }
    } catch { /* ignore corrupt data */ }
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, 30));
    return { startDate: start, endDate: end, isAllTime: false };
  });

  const setSelectedSite = (site: string) => {
    setSelectedSiteState(site);
    localStorage.setItem('_dashboard_selected_site', site);
  };

  const setDateRange = (range: DateRange) => {
    const cappedStart = range.startDate.getFullYear() < 2000 ? startOfDay(new Date(2000, 0, 1)) : range.startDate;
    const cappedRange = { ...range, startDate: cappedStart };
    setDateRangeState(cappedRange);
    localStorage.setItem('_dashboard_date_range', JSON.stringify({
      startDate: cappedRange.startDate.toISOString(),
      endDate: cappedRange.endDate.toISOString(),
      isAllTime: !!cappedRange.isAllTime,
    }));
  };

  return (
    <FilterContext.Provider value={{ selectedSite, setSelectedSite, dateRange, setDateRange }}>
      {children}
    </FilterContext.Provider>
  );
};

const defaultFilterContext: FilterContextType = {
  selectedSite: 'all',
  setSelectedSite: () => {},
  dateRange: {
    startDate: startOfDay(subDays(new Date(), 30)),
    endDate: endOfDay(new Date()),
    isAllTime: false,
  },
  setDateRange: () => {},
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  return context || defaultFilterContext;
};

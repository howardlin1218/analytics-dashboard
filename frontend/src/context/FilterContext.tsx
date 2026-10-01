import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subDays, format, parseISO, isValid, endOfDay, startOfDay } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FilterContextType {
  selectedSite: string;
  setSelectedSite: (site: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize site from URL or localStorage or default to 'all'
  const [selectedSite, setSelectedSiteState] = useState<string>(() => {
    const fromUrl = searchParams.get('siteId');
    if (fromUrl) return fromUrl;
    const fromStorage = localStorage.getItem('_dashboard_selected_site');
    return fromStorage || 'all';
  });

  // Initialize date range from URL or default to Last 30 Days (Stage F1)
  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');

    const end = endParam && isValid(parseISO(endParam)) ? endOfDay(parseISO(endParam)) : endOfDay(new Date());
    const start = startParam && isValid(parseISO(startParam)) ? startOfDay(parseISO(startParam)) : startOfDay(subDays(end, 30));

    return { startDate: start, endDate: end };
  });

  // Sync state to URL search parameters and localStorage
  const setSelectedSite = (site: string) => {
    setSelectedSiteState(site);
    localStorage.setItem('_dashboard_selected_site', site);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (site === 'all') next.delete('siteId');
      else next.set('siteId', site);
      return next;
    });
  };

  const setDateRange = (range: DateRange) => {
    setDateRangeState(range);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('startDate', format(range.startDate, 'yyyy-MM-dd'));
      next.set('endDate', format(range.endDate, 'yyyy-MM-dd'));
      return next;
    });
  };

  // Watch URL params if updated externally (e.g. back/forward navigation)
  useEffect(() => {
    const siteParam = searchParams.get('siteId') || 'all';
    if (siteParam !== selectedSite) {
      setSelectedSiteState(siteParam);
    }
  }, [searchParams, selectedSite]);

  return (
    <FilterContext.Provider value={{ selectedSite, setSelectedSite, dateRange, setDateRange }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within FilterProvider');
  return context;
};

import React, { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useSites } from '../../api/useOverview';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

export function SiteSelector() {
  const { selectedSite, setSelectedSite } = useFilters();
  const { data: sites = [], isLoading } = useSites();
  const [open, setOpen] = useState(false);

  const siteList = ['all', ...sites.filter((s) => s !== 'all')];
  const currentLabel = selectedSite === 'all' ? 'All Sites' : selectedSite;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 px-3 text-xs md:text-sm font-medium border-border bg-background hover:bg-accent flex items-center gap-2 max-w-[200px] md:max-w-[260px]"
        >
          <Globe className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{isLoading ? 'Loading sites...' : currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1 shadow-lg bg-popover" align="start">
        <div className="flex flex-col max-h-60 overflow-y-auto">
          {siteList.map((site) => {
            const isSelected = selectedSite === site;
            const label = site === 'all' ? 'All Sites' : site;
            return (
              <button
                key={site}
                type="button"
                className={cn(
                  'flex items-center justify-between w-full px-2.5 py-1.5 text-xs md:text-sm rounded-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground',
                  isSelected && 'bg-accent text-foreground font-semibold'
                )}
                onClick={() => {
                  setSelectedSite(site);
                  setOpen(false);
                }}
              >
                <span className="truncate">{label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary ml-2" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

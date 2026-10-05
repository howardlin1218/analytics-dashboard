import React, { useState } from 'react';
import { format, subDays, startOfDay, endOfDay, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../../utils/cn';

export function DateRangePicker() {
  const { dateRange, setDateRange } = useFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(() => format(dateRange.startDate, 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(() => format(dateRange.endDate, 'yyyy-MM-dd'));

  const presets = [
    {
      label: 'Today',
      getValue: () => ({
        startDate: startOfDay(new Date()),
        endDate: endOfDay(new Date()),
        isAllTime: false,
      }),
    },
    {
      label: 'Yesterday',
      getValue: () => ({
        startDate: startOfDay(subDays(new Date(), 1)),
        endDate: endOfDay(subDays(new Date(), 1)),
        isAllTime: false,
      }),
    },
    {
      label: 'Last 7 Days',
      getValue: () => ({
        startDate: startOfDay(subDays(new Date(), 7)),
        endDate: endOfDay(new Date()),
        isAllTime: false,
      }),
    },
    {
      label: 'Last 30 Days',
      getValue: () => ({
        startDate: startOfDay(subDays(new Date(), 30)),
        endDate: endOfDay(new Date()),
        isAllTime: false,
      }),
    },
    {
      label: 'All Time',
      getValue: () => ({
        startDate: new Date(0),
        endDate: endOfDay(new Date()),
        isAllTime: true,
      }),
    },
  ];

  const handleApplyCustom = () => {
    const s = parseISO(customStart);
    const e = parseISO(customEnd);
    if (isValid(s) && isValid(e) && s <= e) {
      setDateRange({ startDate: startOfDay(s), endDate: endOfDay(e), isAllTime: false });
      setIsOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-sm font-medium h-9 bg-card hover:bg-accent border-input"
            aria-label="Select date range"
          >
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span className="whitespace-nowrap">
              {dateRange.isAllTime
                ? 'All Time'
                : `${format(dateRange.startDate, 'MMM d, yyyy')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 shadow-lg bg-popover" align="end">
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Quick Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'justify-start text-xs font-medium hover:bg-accent',
                      preset.label === 'All Time' && 'col-span-1'
                    )}
                    onClick={() => {
                      const range = preset.getValue();
                      setDateRange(range);
                      if (!range.isAllTime) {
                        setCustomStart(format(range.startDate, 'yyyy-MM-dd'));
                        setCustomEnd(format(range.endDate, 'yyyy-MM-dd'));
                      }
                      setIsOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-2.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Custom Range
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-10 text-muted-foreground">Start:</span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-10 text-muted-foreground">End:</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs"
                  />
                </div>
                <Button size="sm" className="w-full mt-1 text-xs" onClick={handleApplyCustom}>
                  Apply Range
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

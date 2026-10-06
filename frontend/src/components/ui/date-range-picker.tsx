import React, { useState } from 'react';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, AlertCircle } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { toast } from './toast';
import { cn } from '../../utils/cn';

function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 2000) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

export function DateRangePicker() {
  const { dateRange, setDateRange } = useFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(() => {
    const start = dateRange.startDate.getFullYear() < 2000 ? new Date(2000, 0, 1) : dateRange.startDate;
    return format(start, 'yyyy-MM-dd');
  });
  const [customEnd, setCustomEnd] = useState(() => format(dateRange.endDate, 'yyyy-MM-dd'));
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      label: 'Today',
      getValue: () => ({
        startDate: startOfDay(new Date()),
        endDate: endOfDay(new Date()),
        isAllTime: false,
      }),
    },
    // {
    //   label: 'Yesterday',
    //   getValue: () => ({
    //     startDate: startOfDay(subDays(new Date(), 1)),
    //     endDate: endOfDay(subDays(new Date(), 1)),
    //     isAllTime: false,
    //   }),
    // },
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
        startDate: startOfDay(new Date(2000, 0, 1)),
        endDate: endOfDay(new Date()),
        isAllTime: true,
      }),
    },
  ];

  const handleApplyCustom = () => {
    const sYearMatch = /^(\d{4})/.exec(customStart?.trim() || '');
    const eYearMatch = /^(\d{4})/.exec(customEnd?.trim() || '');
    const sYear = sYearMatch ? parseInt(sYearMatch[1], 10) : null;
    const eYear = eYearMatch ? parseInt(eYearMatch[1], 10) : null;

    if ((sYear !== null && sYear < 2000) || (eYear !== null && eYear < 2000)) {
      const msg = 'Invalid date: Year cannot be earlier than 2000.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!customStart || !customEnd || !isValidDateString(customStart) || !isValidDateString(customEnd)) {
      const msg = 'Invalid date: Selected date does not exist or is invalid.';
      setError(msg);
      toast.error(msg);
      return;
    }

    const s = parseISO(customStart);
    const e = parseISO(customEnd);

    if (s.getFullYear() < 2000 || e.getFullYear() < 2000) {
      const msg = 'Invalid date: Year cannot be earlier than 2000.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (s > e) {
      const msg = 'Invalid date range: Start date cannot be after end date.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setError(null);
    setDateRange({ startDate: startOfDay(s), endDate: endOfDay(e), isAllTime: false });
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setError(null);
        }}
      >
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
        <PopoverContent className="w-72 p-3 shadow-lg bg-popover" align="start">
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
                      setError(null);
                      const range = preset.getValue();
                      setDateRange(range);
                      if (!range.isAllTime) {
                        setCustomStart(format(range.startDate, 'yyyy-MM-dd'));
                        setCustomEnd(format(range.endDate, 'yyyy-MM-dd'));
                      } else {
                        setCustomStart('2000-01-01');
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
                    min="2000-01-01"
                    value={customStart}
                    onChange={(e) => {
                      setCustomStart(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyCustom();
                    }}
                    className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs"
                    aria-label="Start date"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-10 text-muted-foreground">End:</span>
                  <input
                    type="date"
                    min="2000-01-01"
                    value={customEnd}
                    onChange={(e) => {
                      setCustomEnd(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyCustom();
                    }}
                    className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs"
                    aria-label="End date"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-md bg-destructive/15 text-destructive border border-destructive/30 px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow-sm animate-in fade-in-0"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 leading-tight">{error}</span>
                  </div>
                )}

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

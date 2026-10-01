import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  status?: string;
  statusColor?: string;
  borderColor?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  status,
  statusColor,
  borderColor,
  icon,
  subtitle,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 hover:shadow-md border-border',
        className
      )}
      style={borderColor ? { borderTop: `4px solid ${borderColor}` } : undefined}
    >
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div
          className="text-2xl font-bold tracking-tight text-foreground"
          style={statusColor ? { color: statusColor } : undefined}
        >
          {value}
        </div>
        {(status || subtitle) && (
          <div className="mt-3 flex items-center gap-2">
            {status && (
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                  status.toLowerCase() === 'good' && "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-900",
                  status.toLowerCase() === 'needs work' && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900",
                  status.toLowerCase() === 'poor' && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900",
                  !['good', 'needs work', 'poor'].includes(status.toLowerCase()) && "bg-muted text-foreground border-border"
                )}
              >
                {status}
              </span>
            )}
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

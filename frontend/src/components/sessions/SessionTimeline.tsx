import React from 'react';
import { Maximize2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { SessionTimelineEvent } from '../../types/telemetry';

interface SessionTimelineProps {
  timeline: SessionTimelineEvent[];
  onExpand?: () => void;
  isModal?: boolean;
}

export function renderTimelineEventItem(event: SessionTimelineEvent, index: number) {
  const timeObj = new Date(event.time);
  const timeStr = isNaN(timeObj.getTime())
    ? 'Unknown Time'
    : timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const d = event.details || {};
  const stableKey = `${event.time || ''}-${event.action}-${index}`;

  if (event.action === 'mousemove') {
    return (
      <div
        key={stableKey}
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block mr-1 my-0.5 hover:bg-primary transition-colors cursor-pointer"
        title={`Mouse moved to X:${d.x}, Y:${d.y} at ${timeStr}`}
      />
    );
  }

  if (event.action === 'heartbeat') {
    return (
      <div
        key={stableKey}
        className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1 my-0.5"
        title={`Heartbeat ping at ${timeStr}`}
      />
    );
  }

  let icon = '⚡';
  if (event.action === 'pageview') {
    icon = '📄';
  } else if (event.action === 'click') {
    icon = '🖱️';
  } else if (event.action === 'error' || event.action === 'noscript') {
    icon = '🚨';
  } else if (event.action === 'scroll_depth' || event.action === 'scroll_final') {
    icon = '📜';
  } else if (event.action === 'idle_break_start' || event.action === 'idle_break_end') {
    icon = '⏸️';
  }

  return (
    <div key={stableKey} className="relative pl-6 pb-6 border-l-2 border-border last:border-0 last:pb-0 timeline-item">
      <div className="absolute -left-2 top-0.5 w-3.5 h-3.5 rounded-full bg-card border-2 border-primary" />
      <div className="rounded-lg border border-border bg-card p-3 shadow-sm text-xs space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <span>{icon}</span>
            <span className="uppercase tracking-wider font-mono text-[11px]">{event.action.replace(/_/g, ' ')}</span>
          </div>
          <span className="text-muted-foreground text-[11px]">{timeStr}</span>
        </div>

        <div className="font-mono text-muted-foreground truncate" title={event.url}>
          {event.url}
        </div>

        {event.action === 'pageview' && (
          <div className="space-y-1">
            {d.title && <div className="font-semibold text-foreground">{d.title}</div>}
            {d.referrer && <div className="text-muted-foreground">Referrer: {d.referrer}</div>}
            {d.timing && (
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                {d.timing.ttfb !== undefined && (
                  <div className="bg-muted p-1.5 rounded">TTFB: {d.timing.ttfb.toFixed(1)}ms</div>
                )}
                {d.timing.domInteractive !== undefined && (
                  <div className="bg-muted p-1.5 rounded">DOM: {d.timing.domInteractive.toFixed(1)}ms</div>
                )}
                {d.timing.totalLoadTime !== undefined && (
                  <div className="bg-muted p-1.5 rounded">Load: {d.timing.totalLoadTime.toFixed(1)}ms</div>
                )}
              </div>
            )}
          </div>
        )}

        {event.action === 'click' && (
          <div className="space-y-1">
            <div className="text-foreground">
              Clicked: <strong>"{d.text || 'Element'}"</strong>
            </div>
            {d.element && <code className="block bg-muted px-1.5 py-0.5 rounded text-[11px]">{d.element}</code>}
            <div className="text-muted-foreground">Coords: (X:{d.x}, Y:{d.y})</div>
          </div>
        )}

        {event.action === 'scroll_depth' && (
          <div className="text-muted-foreground">
            Scrolled past <strong>{d.threshold}%</strong> (Max: {d.maxDepth}%)
          </div>
        )}

        {event.action === 'scroll_final' && (
          <div className="text-muted-foreground">
            Final scroll depth before exit: <strong>{d.maxDepth}%</strong>
          </div>
        )}

        {event.action === 'idle_break_start' && (
          <div className="text-muted-foreground">User went idle...</div>
        )}

        {event.action === 'idle_break_end' && (
          <div className="text-muted-foreground">
            User resumed after <strong>{d.durationMs ? (d.durationMs / 1000).toFixed(1) : 0}s</strong>
          </div>
        )}

        {event.action === 'error' && (
          <div className="space-y-1 text-destructive">
            <div className="font-semibold">{d.error?.message || 'Error occurred'}</div>
            {d.error?.stack && (
              <pre className="bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200 border border-red-300 dark:border-red-900 p-2 rounded text-[10px] overflow-auto max-h-32">
                {d.error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  timeline,
  onExpand,
}) => {
  return (
    <Card className="shadow-sm border-border flex flex-col flex-1 min-h-0 overflow-hidden max-h-[450px] lg:max-h-none">
      <CardHeader className="py-2.5 px-4 sm:px-6 border-b border-border shrink-0 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-bold">Chronological Journey ({timeline.length} events)</CardTitle>
        {onExpand && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs shrink-0"
            onClick={onExpand}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Expand Journey
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar max-h-[450px] lg:max-h-none">
        {timeline.length > 0 ? (
          <div className="space-y-4 timeline-track pl-2">
            {timeline.map((event, index) => renderTimelineEventItem(event, index))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No activity logs recorded for this session.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

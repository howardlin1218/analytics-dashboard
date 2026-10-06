import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../utils/cn';
import { SessionListItem } from '../../types/telemetry';

interface SessionListProps {
  sessions: SessionListItem[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isLoading: boolean;
  isError: boolean;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  isLoading,
  isError,
}) => {
  return (
    <div
      className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-[400px] lg:max-h-none"
      id="session-list"
    >
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`session-skel-${i}`} className="h-20 w-full rounded-xl" />
        ))
      ) : isError ? (
        <div className="p-4 text-center text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-900 rounded-lg">
          Failed to load sessions.
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
          No session data found.
        </div>
      ) : (
        sessions.map((session: SessionListItem) => {
          const isSelected = selectedSessionId === session.session_id;
          const dateStr = new Date(session.start_time).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const shortId = session.session_id.substring(0, 8) + '...';

          return (
            <Card
              key={session.session_id}
              onClick={() => onSelectSession(session.session_id)}
              className={cn(
                'cursor-pointer transition-all hover:border-primary text-left p-3.5 shadow-sm session-card',
                isSelected ? 'border-primary ring-1 ring-primary bg-accent active' : 'border-border'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <strong className="text-xs font-mono text-foreground font-semibold">
                  ID: {shortId}
                </strong>
                <Badge variant="secondary" className="text-[11px] font-mono">
                  {session.total_actions} actions
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground">{dateStr}</div>
            </Card>
          );
        })
      )}
    </div>
  );
};

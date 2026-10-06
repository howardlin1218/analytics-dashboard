import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { SessionTimelineEvent, SessionProfile } from '../../types/telemetry';
import { renderTimelineEventItem } from './SessionTimeline';

interface JourneyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  timeline: SessionTimelineEvent[];
  profile?: SessionProfile | null;
}

export const JourneyModal: React.FC<JourneyModalProps> = ({
  isOpen,
  onOpenChange,
  timeline,
  profile,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-4xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b border-border shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            Chronological Journey
            <Badge variant="secondary" className="font-mono text-xs">
              {timeline.length} events
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {profile ? `Detailed event timeline for session ${profile.id} (${profile.ip})` : 'Session activity timeline'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar px-6 py-4">
          {timeline.length > 0 ? (
            <div className="space-y-4 timeline-track pl-2">
              {timeline.map((event, index) => renderTimelineEventItem(event, index))}
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No activity logs recorded for this session.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

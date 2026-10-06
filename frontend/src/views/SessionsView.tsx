import React, { useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSessions, useSessionDetail } from '../api/useSessions';
import { AccessDenied } from '../components/common/AccessDenied';
import { ReportModal } from '../components/common/ReportModal';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { SessionList } from '../components/sessions/SessionList';
import { SessionProfileCard } from '../components/sessions/SessionProfileCard';
import { SessionTimeline } from '../components/sessions/SessionTimeline';
import { JourneyModal } from '../components/sessions/JourneyModal';

export function SessionsView() {
  const { user } = useAuth();

  // Role Guard
  const role = user?.role || 'viewer';
  const permissions = user?.permission || [];
  const hasAccess =
    role === 'super admin' ||
    role === 'guest' ||
    (role === 'analyst' && permissions.includes('sessions'));

  // 1. All hooks remain unconditionally at top level
  // 2. Query execution is gated by enabled: hasAccess
  const { data: sessionsData, isLoading: isListLoading, isError: isListError } = useSessions({
    enabled: hasAccess,
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);

  const sessions = sessionsData?.data || [];
  // Derive valid selection inline without synchronous cascading setState useEffect
  const activeSessionId = sessions.some((s) => s.session_id === selectedSessionId)
    ? selectedSessionId
    : null;

  const {
    data: detailData,
    isLoading: isDetailLoading,
  } = useSessionDetail(activeSessionId, {
    enabled: hasAccess && Boolean(activeSessionId),
  });

  const profile = detailData?.profile;
  const timeline = detailData?.timeline || [];

  // Snapshot builder for report generator
  const buildReportDataSnapshot = () => {
    if (activeSessionId && profile) {
      const stats = {
        'OS / Platform': profile.os,
        Browser: profile.browser,
        Hardware: profile.cores !== 'Unknown' ? `${profile.cores} Cores / ${profile.memory}GB RAM` : 'Unknown',
        'Screen Res': `${profile.screen} (@${profile.pixelRatio}x)`,
        Viewport: profile.viewport,
        Timezone: profile.timezone,
        Theme: profile.colorScheme,
        Connection: `${profile.network} (${profile.downlink}Mbps, ${profile.rtt}ms)`,
        Language: profile.language,
        'Unique Pages': profile.uniquePages,
        'Max Scroll': `${profile.maxScroll}%`,
        'Avg LCP Load': profile.avgLcp ? `${profile.avgLcp}ms` : 'N/A',
      };

      const eventSummary = {
        totalTimelineEvents: timeline.length,
        pageviews: timeline.filter((e) => e.action === 'pageview').length,
        clicks: timeline.filter((e) => e.action === 'click').length,
        errors: timeline.filter((e) => e.action === 'error' || e.action === 'noscript').length,
      };

      return {
        reportType: 'Deep Dive User Trace',
        targetSession: profile.id,
        sessionMeta: `IP: ${profile.ip} • Duration: ${profile.totalDurationSecs}s • ${profile.totalActions} actions`,
        hardwareAndEnvironment: stats,
        timelineSummary: eventSummary,
      };
    }

    // Sessions overview
    const listSummary: Record<string, string> = {};
    sessions.slice(0, 5).forEach((s, idx) => {
      listSummary[`Recent Session ${idx + 1}`] = `${s.session_id.substring(0, 8)}... - ${new Date(s.start_time).toLocaleString()} (${s.total_actions} actions)`;
    });

    return {
      reportType: 'Sessions Overview',
      totalAvailableSessions: sessions.length,
      latestActivity: Object.keys(listSummary).length ? listSummary : 'No sessions logged yet',
    };
  };

  // Safe early return after all hooks are evaluated
  if (!hasAccess) {
    return <AccessDenied requiredRole="Super Admin, Sessions Analyst" />;
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">User Sessions</h1>
        </div>
        <Button
          onClick={() => setIsReportModalOpen(true)}
          className="gap-2 shadow-sm shrink-0"
        >
          <FileText className="w-4 h-4" /> Generate Sessions Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 lg:overflow-hidden">
        {/* Sessions List Column */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0 space-y-2">
          <SessionList
            sessions={sessions}
            selectedSessionId={activeSessionId}
            onSelectSession={setSelectedSessionId}
            isLoading={isListLoading}
            isError={isListError}
          />
        </div>

        {/* Timeline & Profile Detail Column */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0">
          {!activeSessionId ? (
            <Card className="h-full flex flex-col items-center justify-center p-8 sm:p-16 text-center border-dashed text-muted-foreground min-h-[300px]">
              <Search className="w-10 h-10 mb-3 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground mb-1">No Session Selected</h3>
              <p className="text-sm max-w-sm">Select a user session from the list on the left to trace their journey.</p>
            </Card>
          ) : isDetailLoading ? (
            <div className="space-y-3 h-full flex flex-col">
              <Skeleton className="h-44 w-full rounded-xl shrink-0" />
              <Skeleton className="flex-1 w-full rounded-xl min-h-[250px]" />
            </div>
          ) : !profile ? (
            <Card className="h-full flex items-center justify-center p-12 text-center text-muted-foreground min-h-[300px]">
              No detailed profile data available for this session.
            </Card>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col h-full space-y-3">
              <SessionProfileCard profile={profile} />
              <SessionTimeline
                timeline={timeline}
                onExpand={() => setIsJourneyModalOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        section="sessions"
        dataSnapshotBuilder={buildReportDataSnapshot}
      />

      <JourneyModal
        isOpen={isJourneyModalOpen}
        onOpenChange={setIsJourneyModalOpen}
        timeline={timeline}
        profile={profile}
      />
    </div>
  );
}

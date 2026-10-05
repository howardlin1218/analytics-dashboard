import React, { useState, useEffect } from 'react';
import { Users, FileText, Search, Monitor, Smartphone, Globe, Shield, Wifi, Cpu, Layers, Maximize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSessions, useSessionDetail } from '../api/useSessions';
import { AccessDenied } from '../components/common/AccessDenied';
import { EmptyState } from '../components/common/EmptyState';
import { ReportModal } from '../components/common/ReportModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '../utils/cn';
import { SessionListItem, SessionTimelineEvent } from '../types/telemetry';

export function SessionsView() {
  const { user } = useAuth();
  const { data: sessionsData, isLoading: isListLoading, isError: isListError } = useSessions();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);

  const {
    data: detailData,
    isLoading: isDetailLoading,
  } = useSessionDetail(selectedSessionId);

  const sessions = sessionsData?.data || [];
  const profile = detailData?.profile;
  const timeline = detailData?.timeline || [];

  useEffect(() => {
    if (selectedSessionId && sessions.length > 0 && !sessions.some((s) => s.session_id === selectedSessionId)) {
      setSelectedSessionId(null);
    }
  }, [sessions, selectedSessionId]);

  // Role Guard
  const role = user?.role || 'viewer';
  const permissions = user?.permission || [];
  const hasAccess =
    role === 'super admin' ||
    role === 'guest' ||
    (role === 'analyst' && permissions.includes('sessions'));

  if (!hasAccess) {
    return <AccessDenied requiredRole="Super Admin, Sessions Analyst" />;
  }

  // Snapshot builder for report generator
  const buildReportDataSnapshot = () => {
    if (selectedSessionId && profile) {
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

  const renderTimelineEvent = (event: SessionTimelineEvent, index: number) => {
    const timeObj = new Date(event.time);
    const timeStr = isNaN(timeObj.getTime())
      ? 'Unknown Time'
      : timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const d = event.details || {};

    if (event.action === 'mousemove') {
      return (
        <div
          key={index}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block mr-1 my-0.5 hover:bg-primary transition-colors cursor-pointer"
          title={`Mouse moved to X:${d.x}, Y:${d.y} at ${timeStr}`}
        />
      );
    }

    if (event.action === 'heartbeat') {
      return (
        <div
          key={index}
          className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1 my-0.5"
          title={`Heartbeat ping at ${timeStr}`}
        />
      );
    }

    let badgeVariant: 'info' | 'success' | 'destructive' | 'warning' | 'purple' | 'secondary' = 'secondary';
    let icon = '⚡';

    if (event.action === 'pageview') {
      badgeVariant = 'info';
      icon = '📄';
    } else if (event.action === 'click') {
      badgeVariant = 'secondary';
      icon = '🖱️';
    } else if (event.action === 'error' || event.action === 'noscript') {
      badgeVariant = 'destructive';
      icon = '🚨';
    } else if (event.action === 'scroll_depth' || event.action === 'scroll_final') {
      badgeVariant = 'warning';
      icon = '📜';
    } else if (event.action === 'idle_break_start' || event.action === 'idle_break_end') {
      badgeVariant = 'purple';
      icon = '⏸️';
    }

    return (
      <div key={index} className="relative pl-6 pb-6 border-l-2 border-border last:border-0 last:pb-0 timeline-item">
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
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">User Sessions</h1>
          {/* <p className="text-sm text-muted-foreground">
            Explore active user sessions, device technographics, and step-by-step user journeys.
          </p> */}
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
          {/* <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Logged Sessions ({sessions.length})
            </span>
          </div> */}

          <div
            className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-[400px] lg:max-h-none"
            id="session-list"
          >
            {isListLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : isListError ? (
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
                    onClick={() => setSelectedSessionId(session.session_id)}
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
        </div>

        {/* Timeline & Profile Detail Column */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0">
          {!selectedSessionId ? (
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
              {/* Profile Card */}
              <Card className="shadow-sm border-border overflow-hidden shrink-0 session-profile-card">
                <CardHeader className="bg-muted p-3.5 sm:px-5 border-b border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-primary shrink-0 text-xl">
                      {profile.deviceType === 'Mobile' ? '📱' : '💻'}
                    </div>
                    <div className="flex-1 min-w-0 profile-title">
                      <h3 className="text-base font-bold truncate">Session: {profile.id}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        IP: <strong className="text-foreground">{profile.ip}</strong> • Duration:{' '}
                        <strong className="text-foreground">
                          {profile.totalDurationSecs > 0 ? `${profile.totalDurationSecs}s` : 'N/A'}
                        </strong>{' '}
                        • {profile.totalActions} actions
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {profile.capabilities.js ? (
                          <Badge variant="success" className="text-[10px]">JS</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">No JS</Badge>
                        )}
                        {profile.capabilities.cookies ? (
                          <Badge variant="success" className="text-[10px]">Cookies</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">No Cookies</Badge>
                        )}
                        {!profile.capabilities.images && (
                          <Badge variant="destructive" className="text-[10px]">No Img</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3 sm:px-5 profile-stats-grid">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">OS / Platform</span>
                      <strong className="truncate block val">{profile.os}</strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Browser</span>
                      <strong className="truncate block val">{profile.browser}</strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Hardware</span>
                      <strong className="truncate block val">
                        {profile.cores !== 'Unknown' ? `${profile.cores} Cores / ${profile.memory}GB` : 'Unknown'}
                      </strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Screen Res</span>
                      <strong className="truncate block val">{profile.screen} (@{profile.pixelRatio}x)</strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Viewport</span>
                      <strong className="truncate block val">{profile.viewport}</strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Timezone</span>
                      <strong className="truncate block val">{profile.timezone}</strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Theme</span>
                      <strong className="capitalize block val">{profile.colorScheme}</strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Connection</span>
                      <strong className="truncate block val">
                        {profile.network !== 'Unknown' ? `${profile.network} (${profile.downlink}M)` : 'Unknown'}
                      </strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Language</span>
                      <strong className="truncate block val">{profile.language}</strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Unique Pages</span>
                      <strong className="block val">{profile.uniquePages}</strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Max Scroll</span>
                      <strong className="block val">{profile.maxScroll}%</strong>
                    </div>
                    <div className="bg-muted p-2 rounded-lg border border-border stat-box">
                      <span className="text-[10px] text-muted-foreground block mb-0.5 label">Avg LCP</span>
                      <strong className={cn('block val', profile.avgLcp > 2500 ? 'text-destructive' : 'text-green-600')}>
                        {profile.avgLcp ? `${profile.avgLcp}ms` : 'N/A'}
                      </strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chronological Journey Timeline */}
              <Card className="shadow-sm border-border flex flex-col flex-1 min-h-0 overflow-hidden max-h-[450px] lg:max-h-none">
                <CardHeader className="py-2.5 px-4 sm:px-6 border-b border-border shrink-0 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-bold">Chronological Journey ({timeline.length} events)</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs shrink-0"
                    onClick={() => setIsJourneyModalOpen(true)}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Expand Journey
                  </Button>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar max-h-[450px] lg:max-h-none">
                  {timeline.length > 0 ? (
                    <div className="space-y-4 timeline-track pl-2">
                      {timeline.map((event, index) => renderTimelineEvent(event, index))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No activity logs recorded for this session.
                    </div>
                  )}
                </CardContent>
              </Card>
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

      {/* Expanded Journey Modal / Popup */}
      <Dialog open={isJourneyModalOpen} onOpenChange={setIsJourneyModalOpen}>
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
                {timeline.map((event, index) => renderTimelineEvent(event, index))}
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No activity logs recorded for this session.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

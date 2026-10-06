import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../utils/cn';
import { SessionProfile } from '../../types/telemetry';

interface SessionProfileCardProps {
  profile: SessionProfile;
}

export const SessionProfileCard: React.FC<SessionProfileCardProps> = ({ profile }) => {
  return (
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
  );
};

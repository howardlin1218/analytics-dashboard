export interface SessionProfile {
  id: string;
  ip: string;
  totalDurationSecs: number;
  totalActions: number;
  os: string;
  browser: string;
  deviceType: 'Desktop' | 'Mobile';
  cores: string | number;
  memory: string | number;
  screen: string;
  viewport: string;
  pixelRatio: number;
  timezone: string;
  colorScheme: string;
  network: string;
  downlink: string | number;
  rtt: string | number;
  language: string;
  uniquePages: number;
  maxScroll: number;
  avgLcp: number;
  capabilities: {
    cookies: boolean;
    js: boolean;
    css?: boolean;
    images: boolean;
  };
}

export interface SessionTimelineEvent {
  action: string;
  time: string;
  url: string;
  details: {
    x?: number;
    y?: number;
    text?: string;
    element?: string;
    value?: string;
    key?: string;
    threshold?: number;
    maxDepth?: number;
    timeOnPage?: number;
    durationMs?: number;
    errorCount?: number;
    title?: string;
    referrer?: string;
    timing?: {
      ttfb?: number;
      domInteractive?: number;
      totalLoadTime?: number;
    };
    customData?: Record<string, any>;
    error?: {
      message?: string;
      source?: string;
      line?: number;
      column?: number;
      stack?: string;
      type?: string;
    };
  };
}

export interface SessionListItem {
  session_id: string;
  total_actions: number;
  start_time: string;
  end_time: string;
  ip_address: string;
}

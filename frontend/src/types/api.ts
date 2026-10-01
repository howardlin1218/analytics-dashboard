import { SessionListItem, SessionProfile, SessionTimelineEvent } from './telemetry';
import { User, Role } from './auth';

export interface OverviewCard {
  title: string;
  value: string;
}

export interface OverviewChart {
  labels: string[];
  values: number[];
}

export interface OverviewTopPage {
  path: string;
  views: number;
  unique: number;
}

export interface OverviewResponse {
  success: boolean;
  cards: OverviewCard[];
  chart: OverviewChart;
  table: OverviewTopPage[];
  rawLogs?: any[];
}

export interface PerformanceVital {
  metric: string;
  value: string | number;
  status: string;
  color: string;
}

export interface PerformanceRow {
  page: string;
  lcp: number | string;
  inp: number | string;
  cls: number | string;
}

export interface PerformanceResponse {
  success: boolean;
  vitals: PerformanceVital[];
  chart: {
    labels: string[];
    values: number[];
  };
  table: PerformanceRow[];
}

export interface ErrorRow {
  time: string;
  type: string;
  message: string;
  count: number;
  stackTrace: string;
}

export interface ErrorsResponse {
  success: boolean;
  chart: {
    labels: string[];
    values: number[];
  };
  table: ErrorRow[];
}

export interface SessionsListResponse {
  success: boolean;
  data: SessionListItem[];
}

export interface SessionDetailResponse {
  success: boolean;
  profile: SessionProfile | null;
  timeline: SessionTimelineEvent[];
}

export interface ReportItem {
  id: number;
  title: string;
  section: string;
  author_id: number;
  comments: string;
  file_path: string;
  created_at: string;
}

export interface ReportsResponse {
  success: boolean;
  data: ReportItem[];
}

export interface UserRecord {
  id: number;
  email: string;
  display_name: string;
  role: Role;
  permission: string | string[];
  created_at?: string;
  last_login?: string;
}

export interface UsersResponse {
  success: boolean;
  data: UserRecord[];
}

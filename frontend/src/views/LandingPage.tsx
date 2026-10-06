import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  BarChart3,
  Activity,
  AlertTriangle,
  Users,
  Clock,
  Zap,
  Calendar,
  Globe,
  ShieldCheck,
  ArrowRight,
  FileText,
  CheckCircle2,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { MetricCard } from '../components/common/MetricCard';
import '../utils/chartSetup';

// Fictional data reconstructing the Overview page
const lineChartData = {
  labels: ['Sep 29', 'Sep 30', 'Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5'],
  datasets: [
    {
      label: 'Pageviews',
      data: [5420, 6180, 5890, 7240, 8100, 7650, 7810],
      borderColor: '#2563eb',
      backgroundColor: '#2563eb',
      tension: 0.2,
      fill: false,
    },
  ],
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: {
      display: true,
      text: 'Pageviews / Day',
      font: { size: 13, weight: 'bold' as const },
    },
  },
  scales: {
    x: {
      title: { display: false },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
    },
  },
};

const fictionalTopPages = [
  { path: '/', views: 24180, unique: 8920 },
  { path: '/docs/collector-api', views: 12350, unique: 5140 },
  { path: '/pricing', views: 6890, unique: 2980 },
  { path: '/dashboard/overview', views: 4870, unique: 1650 },
];

export function LandingPage() {
  const { user, loginGuest } = useAuth();
  const navigate = useNavigate();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGuestDemo = async () => {
    if (user) {
      navigate('/overview');
      return;
    }
    setIsGuestLoading(true);
    try {
      const result = await loginGuest();
      if (result.success) {
        navigate('/overview');
      } else {
        navigate('/login');
      }
    } catch {
      navigate('/login');
    } finally {
      setIsGuestLoading(false);
    }
  };

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Sticky Top Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-50 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-primary">tracky</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a
              href="#overview"
              onClick={scrollToSection('overview')}
              className="hover:text-foreground transition-colors"
            >
              Overview
            </a>
            <a
              href="#problem-solution"
              onClick={scrollToSection('problem-solution')}
              className="hover:text-foreground transition-colors"
            >
              Problem & Solution
            </a>
            <a
              href="#functionalities"
              onClick={scrollToSection('functionalities')}
              className="hover:text-foreground transition-colors"
            >
              Modules
            </a>
            <a
              href="#integration"
              onClick={scrollToSection('integration')}
              className="hover:text-foreground transition-colors"
            >
              Integration
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              Sign In
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleGuestDemo}
            disabled={isGuestLoading}
            className="gap-1.5 shadow-sm text-xs sm:text-sm font-medium"
          >
            {isGuestLoading ? 'Loading Demo...' : user ? 'Open Dashboard' : 'Live Demo'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="overview"
        className="py-14 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full text-center flex flex-col items-center scroll-mt-16 sm:scroll-mt-20"
      >
        <h1 className="text-3xl sm:text-5xl md:text-5xl font-extrabold tracking-tight max-w-4xl mb-6 text-foreground leading-tight">
          Web Analytics with{' '}
          <span className="text-primary">Absolute Data Ownership</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mb-8 leading-relaxed">
          A high-performance observability platform combining a zero-dependency client telemetry collector,
          dual-engine database fallback ingestion, real-time Google Core Web Vitals profiling,
          multi-layer error interception, and interactive session replay timelines.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14">
          <Button
            size="lg"
            onClick={handleGuestDemo}
            disabled={isGuestLoading}
            className="h-11 px-6 sm:px-8 gap-2 font-semibold shadow-sm text-sm"
          >
            {user ? 'Go to Dashboard' : 'Launch Demo Sandbox'}
            <ArrowRight className="w-4 h-4" />
          </Button>
          {/* <Link to="/login">
            <Button variant="outline" size="lg" className="h-11 px-6 sm:px-8 text-sm">
              Account Login
            </Button>
          </Link> */}
        </div>

        {/* Simplified Reconstruction of the Overview Page */}
        <div className="w-full max-w-5xl text-left border border-border rounded-xl bg-card shadow-lg overflow-hidden">
          {/* Top Window Bar mimicking Dashboard Header */}
          <div className="px-4 py-3 border-b border-border bg-card flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-border" />
              <span className="w-2.5 h-2.5 rounded-full bg-border" />
              <span className="w-2.5 h-2.5 rounded-full bg-border" />
              <span className="ml-2 text-xs font-bold text-foreground">Dashboard / Overview</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background text-muted-foreground font-medium">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>All Sites</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background text-muted-foreground font-medium">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Sep 6, 2026 - Oct 5, 2026</span>
              </div>
            </div>
          </div>

          {/* Overview Body */}
          <div className="p-4 sm:p-6 space-y-5 bg-background">
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <MetricCard
                title="Total Pageviews"
                value="48,290"
                icon={<Eye className="w-4 h-4 text-blue-500" />}
                className="bg-card border-border shadow-none"
              />
              <MetricCard
                title="Unique Sessions"
                value="12,415"
                icon={<Users className="w-4 h-4 text-emerald-500" />}
                className="bg-card border-border shadow-none"
              />
              <MetricCard
                title="Avg Time on Page"
                value="2m 45s"
                icon={<Clock className="w-4 h-4 text-amber-500" />}
                className="bg-card border-border shadow-none"
              />
              <MetricCard
                title="Total Events"
                value="184,930"
                icon={<Zap className="w-4 h-4 text-purple-500" />}
                className="bg-card border-border shadow-none"
              />
            </div>

            {/* Line Chart */}
            <Card className="p-4 shadow-none border-border bg-card">
              <div className="h-56 sm:h-64 w-full">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </Card>

            {/* Top Pages Table */}
            <Card className="shadow-none border-border bg-card">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-bold text-foreground">Top Pages</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="w-[55%] text-xs">Path</TableHead>
                      <TableHead className="text-right text-xs">Views</TableHead>
                      <TableHead className="text-right text-xs">Unique Visitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fictionalTopPages.map((row) => (
                      <TableRow key={row.path} className="border-border hover:bg-muted/40">
                        <TableCell className="font-mono text-xs text-foreground py-2.5">
                          {row.path}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs py-2.5">
                          {row.views.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs py-2.5">
                          {row.unique.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem Solved & Solution Provided Section */}
      <section
        id="problem-solution"
        className="py-16 px-4 sm:px-8 bg-card border-y border-border scroll-mt-16 sm:scroll-mt-20"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-foreground">
              Built to Solve Real Engineering Bottlenecks
            </h2>
            <p className="text-sm text-muted-foreground">
              Commercial telemetry tools introduce compliance hurdles, bundle bloat, and operational fragility.
              Here is how tracky directly addresses each constraint with concrete technical solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Problem */}
            <Card className="p-6 bg-background border-border shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-foreground">The Industry Challenges</h3>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-red-500 font-mono text-xs">01</span> Third-Party Data Privacy & Compliance Risk
                  </h4>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    External SaaS vendors ship raw user telemetry to third-party multi-tenant clouds, creating GDPR,
                    CCPA, and Global Privacy Control (GPC) legal risks while being blocked by browser tracking protections.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-red-500 font-mono text-xs">02</span> Heavyweight Client Bundle Sizes
                  </h4>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    Third-party analytics SDKs often exceed 100KB, introducing long CPU execution tasks on the main thread
                    and directly degrading Google Core Web Vitals scores like Interaction to Next Paint (INP).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-red-500 font-mono text-xs">03</span> Disconnected Telemetry Silos
                  </h4>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    Engineering organizations are forced to purchase and maintain separate subscriptions for web traffic,
                    Core Web Vitals profiling, error tracking, and session replay inspection.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-red-500 font-mono text-xs">04</span> Database Single Point of Failure
                  </h4>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    Most self-hosted analytics platforms crash or completely lose incoming telemetry beacons whenever
                    the primary database undergoes maintenance or connection pool exhaustion.
                  </p>
                </div>
              </div>
            </Card>

            {/* The Solution */}
            <Card className="p-6 bg-background border-border shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-foreground">The Architectural Solutions</h3>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-emerald-500 font-mono text-xs">01</span> 100% In-House Data Ownership
                  </h4>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    All telemetry is captured directly to your own self-hosted infrastructure. Features native GPC evaluation,
                    explicit cookie consent verification, headless bot filtering, and session-persistent sampling.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-emerald-500 font-mono text-xs">02</span> Zero-Dependency Lightweight Script
                  </h4>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    A standalone ~25KB IIFE script (<code className="font-mono text-primary">collector.js</code>) with an
                    asynchronous command queue (<code className="font-mono text-primary">_cq</code>), non-blocking beacons (<code className="font-mono text-primary">sendBeacon</code> / keepalive fetch), and offline retry buffering.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-emerald-500 font-mono text-xs">03</span> Unified Full-Stack Observability
                  </h4>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    A single unified dashboard tracks traffic trends, Google Core Web Vitals, uncaught runtime/network errors,
                    and chronological session user journey replays (clicks with CSS selectors, scroll depth, idle periods).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-emerald-500 font-mono text-xs">04</span> Dual Storage Fallback Pipeline
                  </h4>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    Simultaneously appends to local JSONL logs (<code className="font-mono text-primary">.logs/analytics.jsonl</code>)
                    and MySQL <code className="font-mono text-primary">activity_logs</code>. The API seamlessly falls back to disk streaming if the database is unreachable.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Functionalities & Dashboard Modules Section */}
      <section
        id="functionalities"
        className="py-16 px-4 sm:px-8 bg-card border-y border-border scroll-mt-16 sm:scroll-mt-20"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-foreground">
              Comprehensive Observability Modules
            </h2>
            <p className="text-sm text-muted-foreground">
              Every telemetry dimension is aggregated into dedicated, role-protected dashboard views with interactive
              visualizations and client-side filtering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1: Overview */}
            <Card className="p-5 bg-background border-border shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-primary">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">Traffic & KPI Overview</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Aggregates total pageviews, unique sessions, average visible duration on page, and total client events.
                  Includes daily pageview trend line charts with contiguous date slot pre-population up to 90 days.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>/api/overview</span>
                <span className="text-foreground font-sans font-medium">Top Pages Table</span>
              </div>
            </Card>

            {/* Module 2: Core Web Vitals */}
            <Card className="p-5 bg-background border-border shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-emerald-500">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">Core Web Vitals & Loading</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Measures real-user Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative
                  Layout Shift (CLS) via PerformanceObserver. Automatically grades benchmarks against Google field criteria (Good / Needs Work / Poor).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>/api/performance</span>
                <span className="text-foreground font-sans font-medium">Sortable Table</span>
              </div>
            </Card>

            {/* Module 3: Errors */}
            <Card className="p-5 bg-background border-border shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">Multi-Layer Error Tracking</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hooks runtime JavaScript exceptions (<code className="font-mono text-primary">window.onerror</code>),
                  broken asset 404s, unhandled promise rejections, and monkey-patches native fetch/XHR calls to intercept failed HTTP API responses (HTTP &ge; 400).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>/api/errors</span>
                <span className="text-foreground font-sans font-medium">Terminal Stack Trace</span>
              </div>
            </Card>

            {/* Module 4: Sessions */}
            <Card className="p-5 bg-background border-border shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-purple-500">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">Session Journey Replay</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Inspects client technographics (CPU cores, device memory, viewport, screen resolution, connection RTT/downlink)
                  and reconstructs second-by-second user interaction timelines (pageviews, clicks with CSS selectors, scroll depth, idle intervals).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>/api/sessions/:id</span>
                <span className="text-foreground font-sans font-medium">Expand Journey Modal</span>
              </div>
            </Card>

            {/* Module 5: PDF Reports */}
            <Card className="p-5 bg-background border-border shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-blue-500">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">Automated PDF Reporting</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Uses headless Puppeteer Chromium to render live dashboard data snapshots and analyst comments into
                  publication-grade A4 PDF documents. Stored on disk with database tracking and role-gated deletion.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>/api/reports</span>
                <span className="text-foreground font-sans font-medium">Puppeteer Headless A4</span>
              </div>
            </Card>

            {/* Module 6: RBAC & Security */}
            <Card className="p-5 bg-background border-border shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-amber-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">Role-Based Access Control</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tiered access control supporting <code className="font-mono text-primary">super admin</code>,{' '}
                  <code className="font-mono text-primary">analyst</code>, <code className="font-mono text-primary">viewer</code>, and <code className="font-mono text-primary">guest</code>.
                  Super Admins manage users, roles, and fine-grained section permission flags dynamically.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>/api/users</span>
                <span className="text-foreground font-sans font-medium">Bcrypt + Session Auth</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Integration & Implementation Snippet Section */}
      <section
        id="integration"
        className="py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full scroll-mt-16 sm:scroll-mt-20"
      >
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-foreground">
            Zero-Dependency Embed Snippet
          </h2>
          <p className="text-sm text-muted-foreground">
            Deploy telemetry tracking to any web application in seconds. The asynchronous command queue ensures tracking
            calls never block the main page load.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 font-mono text-xs text-foreground shadow-sm overflow-x-auto">
              <div className="text-muted-foreground pb-2 border-b border-border mb-3 flex items-center justify-between">
                <span>HTML Integration Snippet</span>
                <span className="text-[11px]">collector.js</span>
              </div>
              <pre className="text-foreground leading-relaxed">
                <code>{`<!-- 1. Initialize Async Command Queue (_cq) -->
<script>
  window._cq = window._cq || [];
  _cq.push(['init', {
    endpoint: 'https://collector.howard1218.site/collect',
    siteId: 'production-app',
    enableVitals: true,
    enableErrors: true,
    respectConsent: true,
    detectBots: true,
    sampleRate: 1.0
  }]);
</script>

<!-- 2. Asynchronous Script Ingestion -->
<script async src="collector.js"></script>

<!-- 3. Optional Plugins (Clicks, Scroll, Idle) -->
<script defer src="ext-clicks.js"></script>
<script defer src="ext-scroll.js"></script>`}</code>
              </pre>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-bold text-base text-foreground">Technical Integration Highlights</h3>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Asynchronous Queue Proxy
                </span>
                <p>
                  Host pages call tracking methods before the script finishes loading. The array is replaced with a live dispatcher proxy upon bootstrap.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Non-Blocking Delivery
                </span>
                <p>
                  Telemetry beacons use <code className="text-primary font-mono">navigator.sendBeacon</code> with fallback to <code className="text-primary font-mono">fetch({`{ keepalive: true }`})</code> so page unloads never drop exit analytics.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Dynamic Filtering & Validation
                </span>
                <p>
                  Dashboard features multi-site isolation, custom date ranges with year &ge; 2000 validation, and automatic <code className="text-primary font-mono">localhost</code> sanitization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-6 px-4 sm:px-8 text-xs text-muted-foreground bg-card">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <span className="font-bold text-foreground">tracky</span>
          <button
            type="button"
            onClick={scrollToSection('overview')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Back to top
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Zap, ArrowRight, BarChart3, Users } from 'lucide-react';
import { Button } from '../components/ui/button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-primary font-bold">
            Analytics.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:inline">
            Features
          </a>
          <a href="#api" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:inline">
            API Specs
          </a>
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/overview">
            <Button size="sm" className="gap-1.5 shadow-sm">
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent text-primary mb-6 border border-primary">
          <Zap className="w-3 h-3 text-amber-500" /> v2.0 – New Performance Modules Released
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-3xl mb-6">
          Gain absolute clarity into your{' '}
          <span className="text-primary">
            Application's Health
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          Monitor real-time active sessions, pinpoint JavaScript errors, and track endpoint performance—all securely managed with an intuitive suite of APIs.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/login">
            <Button size="lg" className="h-11 px-8 gap-2 font-semibold shadow-md">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="h-11 px-8">
              Explore Features
            </Button>
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 px-6 bg-muted border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Comprehensive Observability</h2>
            <p className="text-muted-foreground text-sm">Everything you need to monitor end-user experience and telemetry.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base">Traffic & Overview</h3>
              <p className="text-sm text-muted-foreground">
                Track pageviews over time, unique active sessions, average duration on page, and top content endpoints.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center text-green-700 dark:text-green-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base">Core Web Vitals</h3>
              <p className="text-sm text-muted-foreground">
                Benchmark real-world user experience with LCP, INP, and CLS grading directly tied to Google performance standards.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-700 dark:text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base">Session Journey Replay</h3>
              <p className="text-sm text-muted-foreground">
                Deep dive into user interaction timelines, technographics, hardware specifications, and network conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* API Architecture Showcase */}
      <section id="api" className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Powered by Modular Express APIs</h2>
          <p className="text-muted-foreground text-sm">Clean decoupled REST endpoints backed by MySQL and fallback log streaming.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" /> Secure Authentication & RBAC
            </div>
            <h3 className="text-xl font-bold">Enterprise Role-Based Access Control</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tiered permissions guarantee that Super Admins, Performance Analysts, Error Analysts, and Viewers only interact with appropriate metrics and tools.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-zinc-950 p-4 font-mono text-xs text-zinc-300 shadow-xl overflow-x-auto">
            <div className="text-zinc-500 pb-2 border-b border-zinc-800 mb-3 flex items-center justify-between">
              <span>api.js — Route Dispatcher</span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <pre className="text-zinc-400">
              <code>{`// Pluggable Route architecture
app.use('/api/log', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/overview', overviewRoute);
app.use('/api/performance', performanceRoute);
app.use('/api/errors', errorsRoute);
app.use('/api/sessions', sessionsRoute);
app.use('/api/reports', reportsRoute);`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 px-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Analytics Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
};

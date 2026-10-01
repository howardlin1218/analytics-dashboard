import React from 'react';
import { Line } from 'react-chartjs-2';
import { Eye, Users, Clock, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOverview } from '../api/useOverview';
import { AccessDenied } from '../components/common/AccessDenied';
import { MetricCard } from '../components/common/MetricCard';
import { EmptyState } from '../components/common/EmptyState';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import '../utils/chartSetup';

export function OverviewView() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useOverview();

  // Role Guard
  const role = user?.role || 'viewer';
  const hasAccess = role === 'super admin' || role === 'analyst' || role === 'guest';

  if (!hasAccess) {
    return <AccessDenied requiredRole="Super Admin, Analyst" />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to Load Overview Data"
        description={(error as Error)?.message || 'An unexpected error occurred while fetching metrics.'}
      />
    );
  }

  const cards = data?.cards || [];
  const chartData = data?.chart || { labels: [], values: [] };
  const topPages = data?.table || [];

  const icons = [
    <Eye className="w-4 h-4 text-blue-500" key="eye" />,
    <Users className="w-4 h-4 text-emerald-500" key="users" />,
    <Clock className="w-4 h-4 text-amber-500" key="clock" />,
    <Zap className="w-4 h-4 text-purple-500" key="zap" />,
  ];

  const lineChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Pageviews',
        data: chartData.values,
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
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Pageviews / Day',
        font: { size: 14, weight: 'bold' as const },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Date' },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Views' },
        ticks: { precision: 0 },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">High-level traffic summary, activity metrics, and top endpoints.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="overview-cards">
        {cards.map((card, idx) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={icons[idx % icons.length]}
          />
        ))}
      </div>

      {/* Line Chart */}
      <Card className="p-4 shadow-sm border-border">
        <div className="h-72 w-full">
          {chartData.labels.length > 0 ? (
            <Line data={lineChartData} options={lineChartOptions} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No pageview trends available for the selected range.
            </div>
          )}
        </div>
      </Card>

      {/* Top Pages Table */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Top Pages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topPages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Path</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Unique Visitors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.map((row) => (
                  <TableRow key={row.path}>
                    <TableCell className="font-mono text-xs">{row.path}</TableCell>
                    <TableCell className="text-right font-medium">{row.views.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.unique.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No page logs recorded for this selection.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

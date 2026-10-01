import React, { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { ArrowUpDown, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePerformance } from '../api/usePerformance';
import { AccessDenied } from '../components/common/AccessDenied';
import { MetricCard } from '../components/common/MetricCard';
import { EmptyState } from '../components/common/EmptyState';
import { ReportModal } from '../components/common/ReportModal';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { PerformanceRow } from '../types/api';
import '../utils/chartSetup';

type SortColumn = 'page' | 'lcp' | 'inp' | 'cls';
type SortDirection = 'asc' | 'desc';

export function PerformanceView() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = usePerformance();

  const [sortColumn, setSortColumn] = useState<SortColumn>('lcp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Role Guard
  const role = user?.role || 'viewer';
  const permissions = user?.permission || [];
  const hasAccess =
    role === 'super admin' ||
    role === 'guest' ||
    (role === 'analyst' && permissions.includes('performance'));

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc'); // Default new column to worst first
    }
  };

  const sortedTableData = useMemo(() => {
    if (!data?.table) return [];
    const list = [...data.table];
    list.sort((a, b) => {
      let valA: string | number = a[sortColumn];
      let valB: string | number = b[sortColumn];

      if (sortColumn === 'page') {
        valA = typeof valA === 'string' ? valA.toLowerCase() : '';
        valB = typeof valB === 'string' ? valB.toLowerCase() : '';
      } else {
        valA = typeof valA === 'number' ? valA : parseFloat(String(valA)) || 0;
        valB = typeof valB === 'number' ? valB : parseFloat(String(valB)) || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [data?.table, sortColumn, sortDirection]);

  if (!hasAccess) {
    return <AccessDenied requiredRole="Super Admin, Performance Analyst" />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-44 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        title="Failed to Load Performance Data"
        description={(error as Error)?.message || 'An unexpected error occurred while fetching vitals.'}
      />
    );
  }

  const vitals = data?.vitals || [];
  const chartData = data?.chart || { labels: [], values: [] };

  const barChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Number of Pageviews',
        data: chartData.values,
        backgroundColor: '#2563eb',
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Load Time Distribution',
        font: { size: 14, weight: 'bold' as const },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Load Duration' } },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Pageviews' },
        ticks: { precision: 0 },
      },
    },
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/60 ml-1" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary ml-1" />
    );
  };

  // Build Snapshot for PDF Report Generator matching legacy scraper
  const buildReportDataSnapshot = () => {
    const vitalsObj: Record<string, string> = {};
    vitals.forEach((v) => {
      vitalsObj[v.metric] = `${v.value} (${v.status})`;
    });

    const topPages: Record<string, string> = {};
    sortedTableData.slice(0, 5).forEach((row, idx) => {
      topPages[`Rank ${idx + 1}`] = `${row.page} (LCP: ${row.lcp}, INP: ${row.inp}, CLS: ${row.cls})`;
    });

    return {
      reportType: 'Core Web Vitals & Loading',
      pagesTracked: sortedTableData.length,
      overallVitals: Object.keys(vitalsObj).length ? vitalsObj : 'No vitals rendering',
      topEndpoints: Object.keys(topPages).length ? topPages : 'No page data available',
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Web Vitals & Performance</h1>
          <p className="text-sm text-muted-foreground">
            Core Web Vitals benchmarked against Google field standards.
          </p>
        </div>
        <Button
          onClick={() => setIsReportModalOpen(true)}
          className="gap-2 shadow-sm shrink-0"
        >
          <FileText className="w-4 h-4" /> Generate Performance Report
        </Button>
      </div>

      {/* Vitals Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="vitals-gauges">
        {vitals.map((vital) => (
          <MetricCard
            key={vital.metric}
            title={vital.metric}
            value={vital.value}
            status={vital.status}
            statusColor={vital.color}
            borderColor={vital.color}
          />
        ))}
      </div>

      {/* Bar Chart */}
      <Card className="p-4 shadow-sm border-border">
        <div className="h-72 w-full">
          {chartData.labels.length > 0 ? (
            <Bar data={barChartData} options={barChartOptions} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No load time distribution recorded for this filter.
            </div>
          )}
        </div>
      </Card>

      {/* Per-Page Performance Table */}
      <Card className="shadow-sm border-border top-pages-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Per-Page Performance</CardTitle>
          <span className="text-xs text-muted-foreground">Click column headers to sort</span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => handleSort('page')}
                  className="cursor-pointer select-none hover:text-foreground"
                >
                  <div className="flex items-center">Page {getSortIcon('page')}</div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('lcp')}
                  className="cursor-pointer select-none text-right hover:text-foreground"
                >
                  <div className="flex items-center justify-end">LCP (ms) {getSortIcon('lcp')}</div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('inp')}
                  className="cursor-pointer select-none text-right hover:text-foreground"
                >
                  <div className="flex items-center justify-end">INP (ms) {getSortIcon('inp')}</div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('cls')}
                  className="cursor-pointer select-none text-right hover:text-foreground"
                >
                  <div className="flex items-center justify-end">CLS {getSortIcon('cls')}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody id="perf-tbody">
              {sortedTableData.length > 0 ? (
                sortedTableData.map((row: PerformanceRow) => (
                  <TableRow key={row.page}>
                    <TableCell className="font-mono text-xs">{row.page}</TableCell>
                    <TableCell className="text-right font-medium">{row.lcp}</TableCell>
                    <TableCell className="text-right font-medium">{row.inp}</TableCell>
                    <TableCell className="text-right font-medium">{row.cls}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                    No per-page vitals found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        section="performance"
        dataSnapshotBuilder={buildReportDataSnapshot}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { AlertCircle, FileText, Terminal, Code2, Maximize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useErrors } from '../api/useErrors';
import { AccessDenied } from '../components/common/AccessDenied';
import { EmptyState } from '../components/common/EmptyState';
import { ReportModal } from '../components/common/ReportModal';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ErrorRow } from '../types/api';
import '../utils/chartSetup';

export function ErrorsView() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useErrors();

  const [selectedError, setSelectedError] = useState<ErrorRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Role Guard
  const role = user?.role || 'viewer';
  const permissions = user?.permission || [];
  const hasAccess =
    role === 'super admin' ||
    role === 'guest' ||
    (role === 'analyst' && permissions.includes('errors'));

  if (!hasAccess) {
    return <AccessDenied requiredRole="Super Admin, Errors Analyst" />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-44 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-44" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to Load Error Tracking Data"
        description={(error as Error)?.message || 'An unexpected error occurred while fetching error logs.'}
      />
    );
  }

  const chartData = data?.chart || { labels: [], values: [] };
  const errorRows = data?.table || [];

  const lineChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Errors Over Time',
        data: chartData.values,
        borderColor: '#dc2626',
        backgroundColor: '#dc2626',
        fill: false,
        tension: 0.1,
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
        text: 'Errors Frequency Trend',
        font: { size: 14, weight: 'bold' as const },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Error Count' },
        ticks: { precision: 0 },
      },
    },
  };

  const handleSelectError = (row: ErrorRow) => {
    setSelectedError(row);
  };

  // Build Snapshot for PDF Report Generator matching legacy scraper
  const buildReportDataSnapshot = () => {
    const topErrors: Record<string, string> = {};
    let totalErrorCount = 0;

    errorRows.forEach((row, idx) => {
      totalErrorCount += Number(row.count) || 0;
      if (idx < 5) {
        topErrors[`Frequent Error ${idx + 1}`] = `[${row.type}] ${row.message} (${row.count} occurrences)`;
      }
    });

    return {
      reportType: 'JavaScript & Asset Errors',
      uniqueErrorsTracked: errorRows.length,
      totalErrorVolume: totalErrorCount,
      mostFrequentErrors: Object.keys(topErrors).length ? topErrors : 'No errors tracked',
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Error Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Aggregated uncaught runtime exceptions, network failures, and stack traces.
          </p>
        </div>
        <Button
          onClick={() => setIsReportModalOpen(true)}
          className="gap-2 shadow-sm shrink-0"
        >
          <FileText className="w-4 h-4" /> Generate Errors Report
        </Button>
      </div>

      {/* Errors Trend Chart */}
      <Card className="p-4 shadow-sm border-border">
        <div className="h-72 w-full">
          {chartData.labels.length > 0 ? (
            <Line data={lineChartData} options={lineChartOptions} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No runtime errors recorded for the selected filter.
            </div>
          )}
        </div>
      </Card>

      {/* Errors Table */}
      <Card className="shadow-sm border-border top-pages-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Recent Errors</CardTitle>
          <span className="text-xs text-muted-foreground">Click any row to view stack trace details</span>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Last Seen</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right w-24">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody id="error-tbody">
                {errorRows.length > 0 ? (
                  errorRows.map((row: ErrorRow, idx: number) => {
                    const isSelected = selectedError?.message === row.message;
                    return (
                      <TableRow
                        key={`${row.message}-${idx}`}
                        onClick={() => handleSelectError(row)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-muted font-medium' : 'hover:bg-muted'
                        }`}
                      >
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{row.time}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-[11px] font-mono">
                            {row.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-md truncate" title={row.message}>
                          {row.message}
                        </TableCell>
                        <TableCell className="text-right font-bold text-destructive">{row.count}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-6 h-6 text-green-500 opacity-80" />
                        <span>Zero errors found for the current site and date range!</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Stack Trace Panel (Legacy ID parity & instant inspection) */}
          <div
            id="stack-trace-panel"
            className="rounded-lg bg-zinc-950 p-4 font-mono text-xs text-red-300 border border-zinc-800 shadow-inner"
          >
            {selectedError ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-200">
                    <Terminal className="w-4 h-4 text-red-400" />
                    <span>Stack Trace ({selectedError.type}: {selectedError.message})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    className="h-7 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 gap-1"
                  >
                    <Maximize2 className="w-3 h-3" /> Expand
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap break-all leading-relaxed max-h-60 overflow-y-auto">
                  {selectedError.stackTrace || 'No stack trace available.'}
                </pre>
              </div>
            ) : (
              <div className="text-zinc-500 py-3 text-center">
                Select an error row above to inspect the full stack trace.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expanded Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-mono text-base">
              <Terminal className="h-5 w-5 shrink-0" />
              <span>{selectedError?.type}: {selectedError?.message}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Last seen: {selectedError?.time} • Total Occurrences: {selectedError?.count}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" /> Full Stack Trace
            </span>
            <div className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs font-mono text-red-300 border border-zinc-800 shadow-inner">
              <pre className="whitespace-pre-wrap break-all leading-relaxed">
                {selectedError?.stackTrace || 'No stack trace available.'}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        section="errors"
        dataSnapshotBuilder={buildReportDataSnapshot}
      />
    </div>
  );
};

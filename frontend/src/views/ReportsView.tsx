import React from 'react';
import { FileText, Download, Trash2, Folder, AlertCircle, Calendar } from 'lucide-react';
import { useReports, useDeleteReport } from '../api/useReports';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from '../components/ui/toast';
import { useFilters } from '../context/FilterContext';
import { filterItemsByDateRange } from '../utils/dateFilter';
import { ReportItem } from '../types/api';

export function ReportsView() {
  const { user } = useAuth();
  const { dateRange } = useFilters();
  const { data, isLoading, isError } = useReports();
  const deleteMutation = useDeleteReport();

  const rawReports = data?.data || [];
  const reports = filterItemsByDateRange(rawReports, dateRange);

  const handleDelete = async (report: ReportItem) => {
    if (!window.confirm(`Are you sure you want to delete "${report.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await deleteMutation.mutateAsync({ reportId: report.id, section: report.section });
      if (res.success) {
        toast.success('Report deleted successfully');
      } else {
        toast.error('Failed to delete report');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting report');
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section.toLowerCase()) {
      case 'errors':
        return '🚨';
      case 'sessions':
        return '👥';
      default:
        return '📊';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Saved Reports</h1>
        {/* <p className="text-sm text-muted-foreground">
          Downloadable PDF reports featuring data snapshots and analyst insights.
        </p> */}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 rounded-xl border border-red-300 dark:border-red-900">
          Failed to load the reports library. Please try again later.
        </div>
      ) : reports.length === 0 ? (
        <div className="p-16 text-center border border-dashed rounded-xl bg-card flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-primary mb-4 text-3xl">
            📁
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No Reports Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Analysts have not generated any reports yet. Reports can be generated directly from the Performance, Errors, and Sessions views.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reports-grid">
          {reports.map((report: ReportItem) => {
            const dateStr = new Date(report.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card key={report.id} className="flex flex-col justify-between shadow-sm border-border report-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold leading-tight report-title">
                        {report.title}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 report-meta">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                    <div className="text-2xl p-1.5 rounded-lg bg-muted report-icon">
                      {getSectionIcon(report.section)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border min-h-[70px] report-comments">
                    {report.comments ? (
                      <p className="line-clamp-3 italic">"{report.comments}"</p>
                    ) : (
                      <span className="italic text-muted-foreground">No analyst comments included.</span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-0 flex flex-col gap-2">
                  <a
                    href={report.file_path.startsWith('/') ? report.file_path : `/${report.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-blue-600 btn-download"
                  >
                    <Download className="w-3.5 h-3.5" /> View / Download PDF
                  </a>

                  {user?.role !== 'viewer' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report)}
                      disabled={deleteMutation.isPending}
                      className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-red-100 dark:hover:bg-red-950 gap-1.5 h-8 btn-delete-report"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Report
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

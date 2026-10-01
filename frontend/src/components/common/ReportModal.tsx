import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { useGenerateReport } from '../../api/useReports';
import { toast } from '../ui/toast';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
  dataSnapshotBuilder: () => any;
}

export function ReportModal({
  isOpen,
  onClose,
  section,
  dataSnapshotBuilder,
}: ReportModalProps) {
  const [comments, setComments] = useState('');
  const generateMutation = useGenerateReport();

  const handleGenerate = async () => {
    try {
      const dataSnapshot = dataSnapshotBuilder();
      const res = await generateMutation.mutateAsync({
        section,
        comments,
        dataSnapshot,
      });

      if (res.success) {
        toast.success('Report generated successfully!');
        onClose();
        setComments('');
        if (res.url) {
          window.open(res.url, '_blank');
        }
      } else {
        toast.error('Failed to generate report');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error generating report');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">Generate {section} Report</DialogTitle>
          <DialogDescription>
            Provide analyst insights or commentary to accompany this snapshot PDF report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label htmlFor="report-comments" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Analyst Notes & Context
          </label>
          <textarea
            id="report-comments"
            rows={5}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Document any recent regressions, deployment changes, or operational findings..."
            className="w-full rounded-md border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={generateMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="gap-2"
            id="btn-generate-report"
          >
            {generateMutation.isPending ? 'Generating PDF... ⏳' : 'Generate & Save PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

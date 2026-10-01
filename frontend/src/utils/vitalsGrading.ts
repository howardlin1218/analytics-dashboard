export interface VitalGrade {
  label: 'Good' | 'Needs Work' | 'Poor';
  color: string;
  bgClass: string;
  textClass: string;
}

export function getVitalGrade(metric: 'LCP' | 'INP' | 'CLS', val: number): VitalGrade {
  if (metric === 'LCP') {
    if (val <= 2500) return { label: 'Good', color: '#16a34a', bgClass: 'bg-green-100 dark:bg-green-950', textClass: 'text-green-700 dark:text-green-400' };
    if (val <= 4000) return { label: 'Needs Work', color: '#d97706', bgClass: 'bg-amber-100 dark:bg-amber-950', textClass: 'text-amber-700 dark:text-amber-400' };
    return { label: 'Poor', color: '#dc2626', bgClass: 'bg-red-100 dark:bg-red-950', textClass: 'text-red-700 dark:text-red-400' };
  }
  if (metric === 'INP') {
    if (val <= 200) return { label: 'Good', color: '#16a34a', bgClass: 'bg-green-100 dark:bg-green-950', textClass: 'text-green-700 dark:text-green-400' };
    if (val <= 500) return { label: 'Needs Work', color: '#d97706', bgClass: 'bg-amber-100 dark:bg-amber-950', textClass: 'text-amber-700 dark:text-amber-400' };
    return { label: 'Poor', color: '#dc2626', bgClass: 'bg-red-100 dark:bg-red-950', textClass: 'text-red-700 dark:text-red-400' };
  }
  // CLS
  if (val <= 0.1) return { label: 'Good', color: '#16a34a', bgClass: 'bg-green-100 dark:bg-green-950', textClass: 'text-green-700 dark:text-green-400' };
  if (val <= 0.25) return { label: 'Needs Work', color: '#d97706', bgClass: 'bg-amber-100 dark:bg-amber-950', textClass: 'text-amber-700 dark:text-amber-400' };
  return { label: 'Poor', color: '#dc2626', bgClass: 'bg-red-100 dark:bg-red-950', textClass: 'text-red-700 dark:text-red-400' };
}

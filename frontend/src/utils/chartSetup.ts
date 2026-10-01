import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function applyChartTheme(isDark: boolean) {
  ChartJS.defaults.color = isDark ? '#a3a3a3' : '#64748b';
  ChartJS.defaults.borderColor = isDark ? '#262626' : '#e2e8f0';
  if (ChartJS.defaults.scale) {
    if (ChartJS.defaults.scale.grid) {
      ChartJS.defaults.scale.grid.color = isDark ? '#262626' : '#e2e8f0';
    }
  }
}

// Initial application based on current document theme
if (typeof document !== 'undefined') {
  const isDarkInit = document.documentElement.classList.contains('dark') || document.documentElement.classList.contains('dark-theme');
  applyChartTheme(isDarkInit);
}

export { ChartJS };

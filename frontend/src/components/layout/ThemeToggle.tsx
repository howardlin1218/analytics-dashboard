import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { applyChartTheme } from '../../utils/chartSetup';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // Reads directly from the DOM state initialized by your head script
    return document.documentElement.classList.contains('dark');
  });

  function toggleTheme() {
    setIsDark((prev) => {
      const nextDark = !prev;
      const root = document.documentElement;

      if (nextDark) {
        root.classList.add('dark', 'dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark', 'dark-theme');
        localStorage.setItem('theme', 'light');
      }

      applyChartTheme(nextDark);
      return nextDark;
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-full text-foreground hover:bg-accent"
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? theme : 'system';

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-colors ${
          activeTheme === 'light'
            ? 'bg-white dark:bg-slate-700 shadow text-amber-500'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
        title="Light Mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-colors ${
          activeTheme === 'dark'
            ? 'bg-white dark:bg-slate-700 shadow text-indigo-400'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
        title="Dark Mode"
      >
        <Moon size={16} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition-colors ${
          activeTheme === 'system'
            ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-100'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
        title="System Preference"
      >
        <Laptop size={16} />
      </button>
    </div>
  );
}

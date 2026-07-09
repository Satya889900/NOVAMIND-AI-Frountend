'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useUiStore } from '@/store/uiStore';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProviderContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, setTheme } = useUiStore();

  const resolvedTheme =
    theme === 'system'
      ? typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const currentTheme =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;

      root.classList.remove('light', 'dark');

      root.classList.add(currentTheme);

      root.setAttribute('data-theme', currentTheme);

      root.style.colorScheme = currentTheme;
    };

    applyTheme();

    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    media.addEventListener('change', applyTheme);

    return () => {
      media.removeEventListener('change', applyTheme);
    };
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      isDark: resolvedTheme === 'dark',
    }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useThemeContext must be used inside ThemeProviderContext'
    );
  }

  return context;
}
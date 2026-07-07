import { useThemeContext } from '../context/ThemeContext';

export function useTheme() {
  const { theme, setTheme } = useThemeContext();

  return {
    theme,
    setTheme,
    isDark: theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches),
  };
}

'use client';

import React from 'react';
import { ThemeProviderContext } from '../../context/ThemeContext';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProviderContext>{children}</ThemeProviderContext>;
}

import React from 'react';
import { Navbar } from '../../components/common/Navbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

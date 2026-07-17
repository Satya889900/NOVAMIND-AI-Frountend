'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Loader } from '../../components/common/Loader';

import { DashboardSidebar } from '../../components/common/DashboardSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <Loader fullscreen size="lg" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen w-screen p-0 lg:p-4 flex gap-0 lg:gap-4 overflow-hidden bg-[#f3f4f6] dark:bg-[#07050e] lg:bg-gradient-to-tr lg:from-[#0c0721] lg:via-[#e2e8f0] lg:to-[#ffffff] lg:dark:from-[#070418] lg:dark:via-[#0e0926] lg:dark:to-[#070415] transition-colors duration-300">
      <DashboardSidebar />
      <div className="flex-1 h-full rounded-none lg:rounded-[24px] overflow-hidden bg-white dark:bg-[#0b081c] border-0 lg:border border-slate-200/50 dark:border-slate-800/40 shadow-xl flex flex-col relative">
        <main className="flex-1 overflow-hidden relative w-full h-full">
          {children}
        </main>
      </div>
    </div>
  );
}

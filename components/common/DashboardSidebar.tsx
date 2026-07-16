'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, User, Settings, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore();
  const { user } = useAuth();

  // Collapse sidebar on small screens initially and on page navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  const navItems = [
    {
      name: 'Chat Room',
      href: '/chat',
      icon: MessageSquare,
      description: 'Active conversations',
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: FileText,
      description: 'Uploaded files',
    },
    {
      name: 'My Profile',
      href: '/profile',
      icon: User,
      description: 'Account settings',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Preferences',
    },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 top-16 bg-slate-950/20 backdrop-blur-sm z-30 lg:hidden cursor-pointer"
        />
      )}

      <aside
        className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] select-none z-40 fixed lg:sticky top-16 left-0 ${
          sidebarOpen
            ? 'w-64 translate-x-0 shadow-2xl lg:shadow-none'
            : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0 overflow-hidden border-r-0 lg:border-r'
        }`}
      >
      {/* Navigation List */}
      <div className="flex-1 py-6 px-4 flex flex-col gap-6">
        <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 py-3 pr-3 rounded-r-xl transition-all border-l-4 group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/40 dark:from-indigo-950/30 dark:to-indigo-900/10 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold pl-2'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-slate-50 pl-2'
                }`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500'
                  }`}
                />
                {sidebarOpen && (
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{item.name}</span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                      {item.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info Footprint */}
      {user && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-200 dark:border-indigo-900">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-xs font-bold truncate text-slate-900 dark:text-white leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 leading-none">
                {user.email}
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  </>
  );
}

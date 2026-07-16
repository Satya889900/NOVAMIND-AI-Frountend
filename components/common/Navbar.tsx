'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useUiStore();

  return (
    <nav className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              onClick={toggleSidebar}
              className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer lg:hidden flex items-center justify-center shrink-0"
              title="Toggle Navigation Menu"
            >
              <Menu size={20} />
            </button>
          )}
          <Logo />
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200">
                  {user.name}
                </span>
              </Link>

              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

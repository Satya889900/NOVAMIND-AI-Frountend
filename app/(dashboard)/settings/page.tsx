'use client';

import React, { useState } from 'react';
import { ThemeToggle } from '../../../components/common/ThemeToggle';
import { Bell, Lock, ShieldAlert, CheckCircle, Save } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto flex flex-col gap-8 select-none">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Customize system behavior, styling settings, and security credentials.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {isSaved && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm flex items-center gap-2.5">
            <CheckCircle size={18} className="shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* Style/Theme Setting */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Theme Preferences</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Switch between light theme, dark theme, or sync with your operating system.
            </p>
          </div>
          <div className="w-fit">
            <ThemeToggle />
          </div>
        </div>

        {/* Notifications Setting */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Desktop Notifications</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receive sound alerts and popup notifications when messages arrive.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-5 w-5 cursor-pointer"
            />
          </div>
        </div>

        {/* Security / Password placeholder */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Update Password</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Change your account password. We recommend using a unique password that you do not use elsewhere.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save size={18} /> Save Settings
        </button>
      </form>
    </div>
  );
}

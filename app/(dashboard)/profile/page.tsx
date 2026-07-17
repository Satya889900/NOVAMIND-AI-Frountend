'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { useUiStore } from '../../../store/uiStore';
import { User, Mail, Shield, BookOpen, Save, CheckCircle, Menu, Sun, Moon, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useUiStore();
  const [bio, setBio] = useState('Product Engineer & UI Enthusiast. Loving NovaMind!');
  const [name, setName] = useState(user?.name || '');
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    // Simulate API update
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] dark:bg-[#0b0a1a] select-none w-full animate-in fade-in duration-300">
      
      {/* Unified Top Header Bar (h-20) */}
      <header className="h-20 border-b border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0a1b] px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-30 transition-colors duration-300">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger menu button on mobile */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 -ml-2 hover:bg-slate-50 dark:hover:bg-[#1a1738]/50 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer lg:hidden flex items-center justify-center shrink-0"
            title="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex flex-col text-left">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-850 dark:text-slate-100 leading-tight">
              My Profile
            </h2>
            <span className="text-[10px] text-slate-400 mt-0.5 leading-none">
              Manage your personal details and account presence info.
            </span>
          </div>
        </div>
        
        {/* Right side: Actions / theme / profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Save changes button */}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#794ef7] hover:bg-[#683ee3] disabled:bg-[#794ef7]/60 text-white font-semibold text-xs rounded-xl shadow-md shadow-[#794ef7]/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCircle size={13} />
            )}
            <span>Save Changes</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a1738]/50 transition-colors cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Status Profile Badge */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] dark:bg-[#15122b]/50 border border-slate-200/50 dark:border-slate-800/40 rounded-full select-none shrink-0">
              <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-[#5f3be3] to-[#794ef7] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#d2ceff]/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left min-w-[40px]">
                <span className="text-[11px] font-bold text-slate-850 dark:text-white leading-none">
                  {user.name}
                </span>
                <span className="text-[8px] text-emerald-500 font-bold flex items-center gap-0.5 mt-0.5 leading-none">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Profile Form Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full">
        <form onSubmit={handleSave} className="flex flex-col gap-6 w-full pb-10 max-w-2xl mx-auto">
          
          {isSaved && (
            <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-450 rounded-xl text-sm flex items-center gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold">Profile settings saved successfully!</span>
              </div>
            </div>
          )}

          {/* Profile Header Avatar */}
          <div className="flex items-center gap-4 p-6 bg-white dark:bg-[#12112a] border border-[#e2e8f0] dark:border-[#201e3d] rounded-2xl shadow-sm">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#f3f0ff] dark:bg-[#231d45] text-[#794ef7] dark:text-[#a78bfa] flex items-center justify-center text-xl font-bold border border-[#e2e8f0] dark:border-[#201e3d]">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</h3>
              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-1 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Active Session
              </span>
            </div>
          </div>

          {/* Input Details */}
          <div className="flex flex-col gap-5 bg-white dark:bg-[#12112a] border border-[#e2e8f0] dark:border-[#201e3d] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                Display Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0c0a1b] border border-[#e2e8f0] dark:border-[#201e3d] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#794ef7] transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-[#0c0a1b]/40 border border-slate-200/60 dark:border-[#201e3d]/80 rounded-xl text-xs text-slate-450 dark:text-slate-500 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                Bio
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-3.5 text-slate-400">
                  <BookOpen size={16} />
                </span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Write a little about yourself..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0c0a1b] border border-[#e2e8f0] dark:border-[#201e3d] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#794ef7] transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                User ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Shield size={16} />
                </span>
                <input
                  type="text"
                  value={user?.id || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-[#0c0a1b]/40 border border-slate-200/60 dark:border-[#201e3d]/80 rounded-xl text-xs text-slate-450 dark:text-slate-500 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

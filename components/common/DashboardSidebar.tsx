'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, User, Settings, ChevronLeft, ChevronRight, FileText, Sparkles, Crown, Check, ChevronDown, LogOut } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore();
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Collapse sidebar on small screens initially and on page navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const navItems = [
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageSquare,
      description: 'Active conversations',
    },
    {
      name: 'Knowledge Base',
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
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden cursor-pointer"
        />
      )}

      <aside
        className={`bg-dark-sidebar border-r border-[#23154c]/30 text-white transition-all duration-300 flex flex-col justify-between shrink-0 h-full select-none z-50 fixed lg:sticky top-0 left-0 rounded-none lg:rounded-[24px] ${
          sidebarOpen
            ? 'w-64 translate-x-0 shadow-2xl lg:shadow-none'
            : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0 overflow-hidden border-r-0 lg:border-r border-[#23154c]/20'
        }`}
      >
        {/* Header / Logo */}
        <div className="p-5 border-b border-[#23154c]/30 flex items-center justify-between shrink-0 h-20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5f3be3] to-[#794ef7] text-white font-extrabold text-lg shrink-0 shadow-glow-purple">
              N
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white leading-none">
                  NovaMind
                </span>
                <span className="text-[9px] font-medium text-[#7c6fc2] mt-0.5 tracking-wider uppercase font-semibold leading-none">
                  AI Personal Assistant
                </span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-1 hover:bg-[#1d163f] text-[#8a88a5] hover:text-white rounded-lg transition-colors cursor-pointer lg:hidden"
              title="Collapse Sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 overflow-y-auto flex flex-col gap-6">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              // Only highlight Chat on /chat, and let AI Assistant be a link but not double-highlighted
              const isActive = item.name === 'AI Assistant'
                ? false
                : pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4d3df2] to-[#794ef7] text-white font-semibold shadow-glow-purple'
                      : 'text-[#8a88a5] hover:bg-[#1a1236]/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      size={18}
                      className={`shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-[#8a88a5] group-hover:text-white'
                      }`}
                    />
                    {sidebarOpen && (
                      <span className="text-sm truncate">{item.name}</span>
                    )}
                  </div>
                  {sidebarOpen && isActive && (
                    <ChevronRight size={14} className="text-white/80 shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Pro Upgrade Card */}
          {sidebarOpen && (
            <div className="pro-card-bg rounded-[20px] p-4 flex flex-col gap-3 mt-auto border border-[#3e1f7a]/40 shadow-inner shadow-black/10">
              <div>
                <p className="text-[10px] font-bold text-[#b5a7f7] uppercase tracking-wider leading-none mb-1">
                  Unlock More with
                </p>
                <h4 className="text-base font-extrabold text-white leading-tight">
                  NovaMind Pro
                </h4>
              </div>

              <ul className="flex flex-col gap-1.5 text-xs text-[#a9a7cc]">
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-[#3b82f6] shrink-0" />
                  <span className="truncate">Unlimited conversations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-[#3b82f6] shrink-0" />
                  <span className="truncate">Advanced AI models</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-[#3b82f6] shrink-0" />
                  <span className="truncate">Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-[#3b82f6] shrink-0" />
                  <span className="truncate">Custom knowledge base</span>
                </li>
              </ul>

              <button className="w-full py-2 px-3 bg-gradient-to-r from-[#4d3df2] to-[#794ef7] hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 mt-1 transition-all active:scale-[0.98] shadow-lg shadow-[#4d3df2]/20 cursor-pointer">
                <Crown size={13} className="fill-current" />
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>

        {/* User Info Footprint */}
        {user && (
          <div className="p-4 border-t border-[#23154c]/30 flex flex-col shrink-0 relative" ref={dropdownRef}>
            <button
              onClick={() => sidebarOpen && setProfileMenuOpen(!profileMenuOpen)}
              className={`flex items-center justify-between w-full p-1 rounded-xl transition-colors hover:bg-[#1a1236]/35 ${sidebarOpen ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#5f3be3] to-[#794ef7] text-white flex items-center justify-center font-bold shrink-0 text-sm border border-[#23154c]/30">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {sidebarOpen && (
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold truncate text-white leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-[#7c6fc2] truncate mt-0.5 leading-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Online
                    </p>
                  </div>
                )}
              </div>
              {sidebarOpen && (
                <ChevronDown size={14} className={`text-[#8a88a5] transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* Profile Dropdown Popover */}
            {profileMenuOpen && sidebarOpen && (
              <div className="absolute bottom-16 left-4 right-4 bg-[#140f2f] border border-[#2c1b5a]/60 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-3 py-1.5 border-b border-[#23154c]/30">
                  <p className="text-[10px] text-[#8a88a5] truncate">Logged in as</p>
                  <p className="text-xs font-bold text-white truncate mt-0.5">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-[#201542] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

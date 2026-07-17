'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Room } from '../../types/chat';
import { useAuthStore } from '../../store/authStore';
import { useChat } from '../../hooks/useChat';
import { useTheme } from '../../hooks/useTheme';
import { Users, MoreVertical, Edit2, Trash2, Check, X, ArrowLeft, Sun, Moon, ChevronDown, Sparkles } from 'lucide-react';

interface ChatHeaderProps {
  room: Room;
}

export function ChatHeader({ room }: ChatHeaderProps) {
  const { user } = useAuthStore();
  const { renameRoom, deleteRoom, selectRoom } = useChat();
  const { theme, setTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(room.name || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNewName(room.name || '');
    setIsEditing(false);
    setIsMenuOpen(false);
    setIsDeleting(false);
  }, [room.id, room.name]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Find private chat recipient
  const recipient = !room.isGroup
    ? room.participants.find((p) => p.id !== user?.id)
    : null;

  const title = room.name && room.name !== 'New Chat'
    ? room.name
    : room.isGroup
      ? room.name
      : (recipient?.name || 'Direct Chat');

  const displayTitle = title === 'Gemini Pro' || title === 'Gemini' || title === 'Direct Chat' ? 'NovaMind AI' : title;

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await renameRoom(room.id, newName.trim());
      setIsEditing(false);
      setIsMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoom(room.id);
      setIsDeleting(false);
      setIsMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-20 border-b border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0a1b] px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-30 transition-colors duration-300">
      {/* Left side: Avatar + Title & Subtitle Badge */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Back button on mobile */}
        <button
          onClick={() => selectRoom(null)}
          className="p-1.5 hover:bg-slate-50 dark:hover:bg-[#1a1738]/50 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer lg:hidden flex items-center justify-center shrink-0"
          title="Back to conversations"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Dynamic Header Avatar */}
        <div className="relative">
          {/* Mini Cute Robot Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5f3be3] to-[#794ef7] text-white flex items-center justify-center font-bold shrink-0 border border-[#d2ceff]/30 shadow-glow-purple">
            <svg viewBox="0 0 60 60" className="w-6 h-6">
              {/* Headphones */}
              <rect x="10" y="22" width="6" height="12" rx="3" fill="#ffffff" opacity="0.8" />
              <rect x="44" y="22" width="6" height="12" rx="3" fill="#ffffff" opacity="0.8" />
              
              {/* Robot Head */}
              <rect x="14" y="16" width="32" height="26" rx="8" fill="#ffffff" />
              
              {/* Screen Face */}
              <rect x="18" y="20" width="24" height="16" rx="4" fill="#1e1b4b" />
              
              {/* Glowing Eyes */}
              <circle cx="24" cy="28" r="2.5" fill="#3b82f6" />
              <circle cx="36" cy="28" r="2.5" fill="#3b82f6" />
            </svg>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleRename} className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Conversation name..."
                autoFocus
              />
              <button
                type="submit"
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                title="Save Name"
              >
                <Check size={12} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setNewName(room.name || '');
                }}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </form>
          ) : (
            <div className="flex flex-col text-left">
              <h2 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 leading-tight flex items-center gap-1.5">
                {displayTitle}
              </h2>
              <div className="mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f0edff] dark:bg-[#1a1636] border border-[#dcd8f8]/60 dark:border-[#382b6b]/40 text-[#794ef7] dark:text-[#a78bfa] text-[9px] font-bold tracking-wide uppercase leading-none">
                  <Sparkles size={8} className="fill-current" />
                  Personal AI Assistant
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Actions / theme / profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Theme Toggle Button (Lucide Sun/Moon icon) */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a1738]/50 transition-colors cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Status Profile Pill Badge */}
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
            <ChevronDown size={11} className="text-slate-400 shrink-0" />
          </div>
        )}

        {/* Three dots dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a1738]/50 transition-colors cursor-pointer"
            title="Chat Options"
          >
            <MoreVertical size={18} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-11 w-48 bg-white dark:bg-[#121025] border border-slate-200 dark:border-[#2b2554]/60 rounded-2xl shadow-2xl z-40 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#201c45]/50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Edit2 size={13} className="text-indigo-500" />
                Rename Conversation
              </button>
              <button
                onClick={() => {
                  setIsDeleting(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-xs text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 size={13} />
                Delete Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121025] border border-slate-200 dark:border-[#2d2757]/60 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
              Delete Conversation?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to delete this conversation? This will permanently delete the conversation and all of its messages. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

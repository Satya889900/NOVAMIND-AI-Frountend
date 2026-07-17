'use client';

import React, { useEffect, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { Room } from '../../types/chat';
import { Plus, MessageSquare, Image, MapPin, Activity, Book, Bot } from 'lucide-react';

interface ChatSidebarProps {
  onCreateChat?: () => void;
}

export function ChatSidebar({ onCreateChat }: ChatSidebarProps) {
  const { rooms, activeRoom, selectRoom, fetchRooms } = useChat();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchRooms();
    setMounted(true);
  }, [fetchRooms]);

  // Format date helper matching screenshot labels
  const formatRoomDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (date >= startOfToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (date >= startOfYesterday) {
      return 'Yesterday';
    } else if (date >= startOf7DaysAgo) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    }
  };

  // Helper to dynamically select a color/icon based on conversation name
  const getRoomIconData = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('java') || lower.includes('program') || lower.includes('code') || lower.includes('help')) {
      return {
        icon: Bot,
        bg: 'bg-[#f0edff] text-[#794ef7] dark:bg-violet-950/40 dark:text-violet-400',
        border: 'border-[#dcd8f8]/60 dark:border-violet-800/30'
      };
    }
    if (lower.includes('image') || lower.includes('art') || lower.includes('paint') || lower.includes('generation')) {
      return {
        icon: Image,
        bg: 'bg-amber-55/65 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        border: 'border-amber-100 dark:border-amber-800/30'
      };
    }
    if (lower.includes('travel') || lower.includes('trip') || lower.includes('plan') || lower.includes('itinerary')) {
      return {
        icon: MapPin,
        bg: 'bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400',
        border: 'border-blue-100 dark:border-blue-800/30'
      };
    }
    if (lower.includes('fitness') || lower.includes('nutrition') || lower.includes('diet') || lower.includes('workout')) {
      return {
        icon: Activity,
        bg: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400',
        border: 'border-emerald-100 dark:border-emerald-800/30'
      };
    }
    if (lower.includes('book') || lower.includes('read') || lower.includes('summary') || lower.includes('atomic')) {
      return {
        icon: Book,
        bg: 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400',
        border: 'border-slate-150 dark:border-slate-700/30'
      };
    }
    return {
      icon: MessageSquare,
      bg: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-850/30'
    };
  };

  // Group rooms by date
  const getGroupedRooms = () => {
    const today: Room[] = [];
    const yesterday: Room[] = [];
    const previous7Days: Room[] = [];
    const older: Room[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    rooms.forEach((room) => {
      const date = new Date(room.lastMessage?.createdAt || room.createdAt || Date.now());
      if (date >= startOfToday) {
        today.push(room);
      } else if (date >= startOfYesterday) {
        yesterday.push(room);
      } else if (date >= startOf7DaysAgo) {
        previous7Days.push(room);
      } else {
        older.push(room);
      }
    });

    return { today, yesterday, previous7Days, older };
  };

  if (!mounted) return null;

  const grouped = getGroupedRooms();

  const renderRoomItem = (room: Room) => {
    const recipient = !room.isGroup
      ? room.participants.find((p) => p.id !== user?.id)
      : null;

    const title = room.name && room.name !== 'New Chat'
      ? room.name
      : room.isGroup
        ? room.name
        : (recipient?.name || 'Direct Chat');

    // Override default assistants name to "NovaMind AI" to match exact screenshot design
    const displayTitle = title === 'Gemini Pro' || title === 'Gemini' || title === 'Direct Chat' ? 'Java Programming Help' : title;

    const isSelected = activeRoom?.id === room.id;
    const iconData = getRoomIconData(displayTitle);
    const RoomIcon = iconData.icon;
    const dateText = formatRoomDate(room.lastMessage?.createdAt || room.createdAt || new Date().toISOString());

    return (
      <button
        key={room.id}
        onClick={() => selectRoom(room)}
        className={`w-full flex items-start gap-3 p-3.5 rounded-2xl transition-all text-left cursor-pointer border ${
          isSelected
            ? 'bg-white dark:bg-[#1a1636] border-[#794ef7]/35 dark:border-[#382b6b]/40 text-[#1b1248] dark:text-[#f1f0fb] shadow-md shadow-[#794ef7]/5 font-semibold'
            : 'bg-white dark:bg-[#121020] border-transparent hover:border-slate-200/50 dark:hover:border-slate-800/30 text-slate-750 dark:text-slate-350 shadow-sm'
        }`}
      >
        {/* Customized Left Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${iconData.bg} ${iconData.border}`}>
          <RoomIcon size={18} />
        </div>

        {/* Room Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="text-xs font-bold truncate text-slate-800 dark:text-white">
              {displayTitle}
            </h4>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap ml-2">
              {dateText}
            </span>
          </div>
          <p className="text-[11px] text-slate-450 dark:text-slate-500 truncate leading-normal">
            {room.lastMessage ? room.lastMessage.content : 'No messages yet'}
          </p>
        </div>

        {/* Unread Indicator */}
        {(room.unreadCount || 0) > 0 && (
          <span className="w-2 h-2 bg-[#794ef7] rounded-full shrink-0 mt-2" />
        )}
      </button>
    );
  };

  const renderSection = (title: string, items: Room[]) => {
    if (items.length === 0) return null;
    return (
      <div className="flex flex-col gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
          {title}
        </span>
        <div className="flex flex-col gap-2">
          {items.map(renderRoomItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full border-r border-slate-250/20 dark:border-slate-800/40 bg-[#f5f6fa] dark:bg-[#0e0c1b] flex flex-col shrink-0">
      {/* Top action block */}
      <div className="p-4 shrink-0">
        <button
          onClick={onCreateChat}
          className="w-full py-3.5 bg-gradient-to-r from-[#4d3df2] to-[#794ef7] hover:opacity-95 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#4d3df2]/15 transition-all active:scale-[0.98] cursor-pointer text-sm"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Grouped conversations list */}
      <div className="flex-1 overflow-y-auto px-3 py-1 flex flex-col gap-5">
        {rooms.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
            No conversations found
          </div>
        ) : (
          <>
            {renderSection('Today', grouped.today)}
            {renderSection('Yesterday', grouped.yesterday)}
            {renderSection('Previous 7 Days', grouped.previous7Days)}
            {renderSection('Older', grouped.older)}
          </>
        )}
      </div>

      {/* Cute Robot Mascot Cloud Card at bottom */}
      <div className="p-4 bg-[#f5f6fa] dark:bg-[#0e0c1b] flex flex-col items-center justify-center text-center shrink-0">
        {/* Animated Cute SVG Robot floating on Cloud */}
        <div className="w-28 h-24 relative flex items-center justify-center overflow-visible">
          {/* Cloud & Robot Unified SVG */}
          <svg viewBox="0 0 120 120" className="w-22 h-22 overflow-visible">
            {/* Clouds underneath */}
            <g className="animate-float-cloud" fill="#e0e7ff" opacity="0.8">
              <circle cx="40" cy="90" r="18" />
              <circle cx="60" cy="90" r="22" />
              <circle cx="80" cy="90" r="18" />
              <circle cx="50" cy="80" r="15" />
              <circle cx="70" cy="80" r="15" />
              <rect x="35" y="80" width="50" height="15" />
            </g>
            <g className="animate-float-cloud" fill="#ffffff">
              <circle cx="45" cy="92" r="14" />
              <circle cx="60" cy="92" r="18" />
              <circle cx="75" cy="92" r="14" />
              <rect x="42" y="84" width="36" height="12" />
            </g>

            {/* Robot Character */}
            <g className="animate-float-robot">
              {/* Body */}
              <rect x="42" y="55" width="36" height="25" rx="14" fill="#ffffff" stroke="#d5d1f6" strokeWidth="1.5" />
              {/* Belly Screen */}
              <rect x="49" y="61" width="22" height="12" rx="4" fill="#f0edff" />
              <circle cx="60" cy="67" r="2.5" fill="#794ef7" />

              {/* Limbs */}
              {/* Left Arm */}
              <rect x="33" y="58" width="8" height="14" rx="4" fill="#ffffff" stroke="#d5d1f6" strokeWidth="1" transform="rotate(-15 37 65)" />
              {/* Right Arm */}
              <rect x="79" y="58" width="8" height="14" rx="4" fill="#ffffff" stroke="#d5d1f6" strokeWidth="1" transform="rotate(15 83 65)" />

              {/* Head Connector / Neck */}
              <rect x="56" y="47" width="8" height="6" fill="#794ef7" />

              {/* Head */}
              <rect x="36" y="22" width="48" height="30" rx="12" fill="#ffffff" stroke="#d5d1f6" strokeWidth="1.5" />
              
              {/* Screen Face */}
              <rect x="41" y="27" width="38" height="20" rx="6" fill="#1e1b4b" />
              {/* Glowing Cyan/Blue Eyes */}
              <circle cx="50" cy="37" r="3" fill="#3b82f6" className="animate-pulse" />
              <circle cx="70" cy="37" r="3" fill="#3b82f6" className="animate-pulse" />
              <path d="M 57 41 Q 60 43 63 41" stroke="#3b82f6" strokeWidth="1" fill="none" strokeLinecap="round" />

              {/* Ears / Headphone discs */}
              <circle cx="34" cy="37" r="4.5" fill="#794ef7" />
              <circle cx="86" cy="37" r="4.5" fill="#794ef7" />

              {/* Antenna */}
              <line x1="60" y1="22" x2="60" y2="12" stroke="#794ef7" strokeWidth="2.5" />
              <circle cx="60" cy="10" r="3.5" fill="#a78bfa" />
            </g>
          </svg>
        </div>

        <h5 className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
          NovaMind is here to help you
        </h5>
        <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 leading-normal">
          Ask anything, get intelligent answers.
        </p>
      </div>
    </div>
  );
}

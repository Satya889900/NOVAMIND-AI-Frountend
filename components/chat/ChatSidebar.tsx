'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { Room } from '../../types/chat';
import { Search, Plus, MessageSquare, Hash } from 'lucide-react';
import { formatTime } from '../../lib/utils';

interface ChatSidebarProps {
  onCreateChat?: () => void;
}

export function ChatSidebar({ onCreateChat }: ChatSidebarProps) {
  const { rooms, activeRoom, selectRoom, fetchRooms } = useChat();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const filteredRooms = rooms.filter((room) => {
    if (room.isGroup) {
      return room.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const recipient = room.participants.find((p) => p.id !== user?.id);
    return recipient?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-80 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h1>
          <button
            onClick={onCreateChat}
            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer"
            title="New Group Chat"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500">
            No conversations found
          </div>
        ) : (
          filteredRooms.map((room) => {
            const recipient = !room.isGroup
              ? room.participants.find((p) => p.id !== user?.id)
              : null;
            const title = room.isGroup ? room.name : (recipient?.name || 'Direct Chat');
            const avatarUrl = room.isGroup ? room.avatarUrl : recipient?.avatarUrl;
            const isSelected = activeRoom?.id === room.id;
            const initial = title.charAt(0).toUpperCase();

            return (
              <button
                key={room.id}
                onClick={() => selectRoom(room)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                {/* Avatar */}
                {room.isGroup ? (
                  avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={title}
                      className="w-11 h-11 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                      <Hash size={18} />
                    </div>
                  )
                ) : (
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={title}
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold shrink-0 text-sm">
                        {initial}
                      </div>
                    )}
                    {!room.isGroup && recipient?.status === 'online' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-xs font-bold truncate text-slate-900 dark:text-white">
                      {title}
                    </h3>
                    {room.lastMessage && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                        {formatTime(room.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {room.lastMessage ? room.lastMessage.content : 'No messages yet'}
                  </p>
                </div>

                {/* Badge */}
                {(room.unreadCount || 0) > 0 && (
                  <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                    {room.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

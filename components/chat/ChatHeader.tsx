import React from 'react';
import { Room } from '../../types/chat';
import { useAuthStore } from '../../store/authStore';
import { Users, MoreVertical, Hash } from 'lucide-react';

interface ChatHeaderProps {
  room: Room;
}

export function ChatHeader({ room }: ChatHeaderProps) {
  const { user } = useAuthStore();

  // Find private chat recipient
  const recipient = !room.isGroup
    ? room.participants.find((p) => p.id !== user?.id)
    : null;

  const title = room.isGroup ? room.name : (recipient?.name || 'Direct Chat');
  const avatarUrl = room.isGroup ? room.avatarUrl : recipient?.avatarUrl;
  const initial = title.charAt(0).toUpperCase();

  const isOnline = !room.isGroup && recipient?.status === 'online';

  return (
    <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {room.isGroup ? (
          avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Hash size={18} />
            </div>
          )
        ) : (
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={title}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                {initial}
              </div>
            )}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            )}
          </div>
        )}

        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            {room.isGroup ? (
              <>
                <Users size={12} />
                {room.participants.length} members
              </>
            ) : (
              isOnline ? 'Online' : 'Offline'
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}

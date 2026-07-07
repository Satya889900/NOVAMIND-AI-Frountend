import React from 'react';
import { Message } from '../../types/chat';
import { useAuthStore } from '../../store/authStore';
import { formatTime } from '../../lib/utils';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuthStore();
  const isMe = message.senderId === user?.id;

  return (
    <div className={`flex gap-3 w-full max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
      {!isMe && (
        message.sender.avatarUrl ? (
          <img
            src={message.sender.avatarUrl}
            alt={message.sender.name}
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold shrink-0 text-sm">
            {message.sender.name.charAt(0).toUpperCase()}
          </div>
        )
      )}

      <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-1">
            {message.sender.name}
          </span>
        )}

        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isMe
              ? 'bg-indigo-600 text-white rounded-tr-none'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
          }`}
        >
          {message.content}
        </div>

        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 px-1 mt-0.5">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

import React from 'react';
import { MessageSquarePlus } from 'lucide-react';

interface EmptyStateProps {
  onCreateChat?: () => void;
}

export function EmptyState({ onCreateChat }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/10 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/50">
        <MessageSquarePlus size={28} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
        No active conversation
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        Select a conversation from the sidebar, or start a new group conversation to begin chatting.
      </p>
      {onCreateChat && (
        <button
          onClick={onCreateChat}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          New Conversation
        </button>
      )}
    </div>
  );
}

import React from 'react';

interface TypingIndicatorProps {
  typingUsers?: string[];
}

export function TypingIndicator({ typingUsers = [] }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const displayText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
      : 'Several people are typing';

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl w-fit max-w-[80%] ml-4 mb-2 animate-pulse">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {displayText}
      </span>
    </div>
  );
}

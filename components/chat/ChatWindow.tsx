'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Room } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { DocumentSummaryPanel } from './DocumentSummaryPanel';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { FileText } from 'lucide-react';

interface ChatWindowProps {
  room: Room;
}

export function ChatWindow({ room }: ChatWindowProps) {
  const { messages, sendMessage, emitTyping, typingUsers } = useChat();
  const { user } = useAuthStore();
  const roomMessages = messages[room.id] || [];
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const roomTyping = typingUsers[room.id] || [];

  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    setShowSummary(!!room.documentId);
  }, [room.id, room.documentId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages, roomTyping]);

  // Determine whether to show suggestions (when the last message is from the assistant/bot)
  const lastMessage = roomMessages[roomMessages.length - 1];
  const isLastMessageAssistant = lastMessage && (
    typeof lastMessage.senderId === 'object'
      ? (lastMessage.senderId as any)._id !== user?.id
      : lastMessage.senderId !== user?.id
  );

  const getSuggestions = () => {
    const lower = room.name?.toLowerCase() || '';
    if (lower.includes('java') || roomMessages.some(m => m.content?.toLowerCase().includes('java'))) {
      return [
        'Explain OOP in Java',
        'Java vs Python',
        'Write a Hello World in Java',
        'Best IDE for Java'
      ];
    }
    return [
      'Explain OOP concepts',
      'Compare Python and JavaScript',
      'Write a simple API server',
      'Recommended coding practices'
    ];
  };

  return (
    <div className="flex-1 flex h-full min-w-0 overflow-hidden relative">
      {/* Left side: Main Chat Window */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#ffffff] dark:bg-[#0c0a1b]">
        <ChatHeader room={room} />

        {/* Floating Toggle Summary Panel Button */}
        {room.documentId && (
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="absolute top-[88px] right-6 z-20 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md text-slate-500 hover:text-[#794ef7] dark:hover:text-[#a78bfa] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            title={showSummary ? "Hide Document Summary" : "Show Document Summary"}
          >
            <FileText size={14} />
            <span className="text-[11px] sm:text-xs font-bold">
              {showSummary ? "Hide Info" : "Show Info"}
            </span>
          </button>
        )}

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {roomMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            roomMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}

          {/* Suggestion Pills underneath the last message */}
          {isLastMessageAssistant && (
            <div className="flex flex-wrap gap-2 mt-2 justify-start px-1 sm:pl-12 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {getSuggestions().map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(room.id, s)}
                  className="px-4 py-2.5 text-[11px] font-bold text-[#794ef7] dark:text-[#a78bfa] bg-[#f0edff] dark:bg-[#1a1636] hover:bg-[#e5e1ff] dark:hover:bg-[#231e4a] border border-[#dcd8f8]/60 dark:border-[#382b6b]/40 rounded-full transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        <TypingIndicator typingUsers={roomTyping} />

        <ChatInput
          onSendMessage={(content, type, fileUrl, fileName, model) => sendMessage(room.id, content, type, fileUrl, fileName, model)}
          onTyping={(isTyping) => emitTyping(room.id, isTyping)}
        />
      </div>

      {/* Right side: Summary panel */}
      {room.documentId && showSummary && (
        <DocumentSummaryPanel
          documentId={room.documentId}
          onAskQuestion={(question) => sendMessage(room.id, question)}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}

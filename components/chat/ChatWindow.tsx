'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Room, Message } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { DocumentSummaryPanel } from './DocumentSummaryPanel';
import { useChat } from '../../hooks/useChat';
import { FileText } from 'lucide-react';

interface ChatWindowProps {
  room: Room;
}

export function ChatWindow({ room }: ChatWindowProps) {
  const { messages, sendMessage, emitTyping, typingUsers } = useChat();
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

  return (
    <div className="flex-1 flex h-full min-w-0 overflow-hidden relative">
      {/* Left side: Main Chat Window */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50/50 dark:bg-slate-900/10">
        <ChatHeader room={room} />

        {/* Floating Toggle Summary Panel Button */}
        {room.documentId && (
          <button
            onClick={() => setShowSummary(!showSummary)}
            className={`absolute top-[76px] right-6 z-20 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95`}
            title={showSummary ? "Hide Document Summary" : "Show Document Summary"}
          >
            <FileText size={15} />
            <span className="text-[11px] sm:text-xs font-bold">
              {showSummary ? "Hide Info" : "Show Info"}
            </span>
          </button>
        )}

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {roomMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            roomMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
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


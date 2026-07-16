'use client';

import React, { useRef, useEffect } from 'react';
import { Room, Message } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { useChat } from '../../hooks/useChat';

interface ChatWindowProps {
  room: Room;
}

export function ChatWindow({ room }: ChatWindowProps) {
  const { messages, sendMessage, emitTyping, typingUsers } = useChat();
  const roomMessages = messages[room.id] || [];
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const roomTyping = typingUsers[room.id] || [];

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages, roomTyping]);


  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/10">
      <ChatHeader room={room} />

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
  );
}

'use client';

import React, { useState } from 'react';
import { ChatSidebar } from '../../../components/chat/ChatSidebar';
import { ChatWindow } from '../../../components/chat/ChatWindow';
import { EmptyState } from '../../../components/chat/EmptyState';
import { useChat } from '../../../hooks/useChat';
import { useUiStore } from '../../../store/uiStore';
import { X, Plus, Users } from 'lucide-react';

export default function ChatPage() {
  const { activeRoom, createRoom, selectRoom } = useChat();
  const { chatListOpen } = useUiStore();
  
  const handleCreateNewChat = async () => {
    try {
      // Instantly create a "New Chat" conversation with the AI assistant included
      const room = await createRoom({
        name: 'New Chat',
        isGroup: false,
        participantIds: ['6a4f70cea2ba595922f0714b'],
      });
      // Select it immediately
      selectRoom(room);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full relative w-full">
      {/* Conversations list sidebar */}
      <div
        className={`shrink-0 h-full transition-all duration-300 ease-in-out ${
          chatListOpen
            ? 'w-full lg:w-80 border-r border-slate-200/50 dark:border-slate-800/40'
            : 'w-0 opacity-0 overflow-hidden pointer-events-none border-0'
        } ${activeRoom ? 'max-lg:hidden' : 'w-full'}`}
      >
        <ChatSidebar onCreateChat={handleCreateNewChat} />
      </div>

      {/* Active chat window or empty state container */}
      <div className={`h-full flex flex-col flex-1 min-w-0 transition-all duration-300 ${activeRoom ? 'w-full' : 'max-lg:hidden flex-1'}`}>
        {activeRoom ? (
          <ChatWindow room={activeRoom} />
        ) : (
          <EmptyState onCreateChat={handleCreateNewChat} />
        )}
      </div>
    </div>
  );
}

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
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)] relative w-full">
      {/* Conversations list sidebar */}
      <div className={`shrink-0 h-full ${activeRoom ? 'chat-sidebar-responsive-hidden chat-sidebar-responsive-visible' : 'w-full lg:w-80 flex flex-col'}`}>
        <ChatSidebar onCreateChat={handleCreateNewChat} />
      </div>

      {/* Active chat window or empty state container */}
      <div className={`h-full flex flex-col ${activeRoom ? 'chat-window-responsive-full chat-window-responsive-desktop' : 'max-lg:hidden lg:flex flex-1'}`}>

        {activeRoom ? (
          <ChatWindow room={activeRoom} />
        ) : (
          <EmptyState onCreateChat={handleCreateNewChat} />
        )}
      </div>
    </div>
  );
}

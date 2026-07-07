'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { socketService } from '../services/socket.service';

interface ChatContextType {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, content: string) => void;
  emitTyping: (roomId: string, isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  const { addMessage, setTyping, updateUserStatus } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = socketService.connect(token);

    socket.on('message_received', (message) => {
      addMessage(message.roomId, message);
    });

    socket.on('user_typing', (data) => {
      setTyping(data.roomId, data.userName, data.isTyping);
    });

    socket.on('user_status_changed', (data) => {
      updateUserStatus(data.userId, data.status);
    });

    return () => {
      socket.off('message_received');
      socket.off('user_typing');
      socket.off('user_status_changed');
    };
  }, [isAuthenticated, token, addMessage, setTyping, updateUserStatus]);

  const value = {
    joinRoom: (roomId: string) => socketService.joinRoom(roomId),
    leaveRoom: (roomId: string) => socketService.leaveRoom(roomId),
    sendMessage: (roomId: string, content: string) => socketService.sendMessage(roomId, content),
    emitTyping: (roomId: string, isTyping: boolean) => socketService.emitTyping(roomId, isTyping),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

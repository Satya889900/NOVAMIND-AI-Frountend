'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { socketService } from '../services/socket.service';
import { messageService } from '../services/message.service';
import { chatService } from '../services/chat.service';
import { Message } from '../types/chat';

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

    socket.on('message_received', (raw: any) => {
      // Normalize Mongoose document shape (_id → id, populated senderId)
      const populated = raw.senderId && typeof raw.senderId === 'object' ? raw.senderId : null;
      const normalizedMsg: Message = {
        id: raw._id || raw.id,
        roomId: raw.roomId || raw.conversationId,
        senderId: populated ? populated._id || populated.id : raw.senderId,
        sender: populated
          ? {
              id: populated._id || populated.id,
              name: populated.name || '',
              email: populated.email || '',
              avatarUrl: populated.avatarUrl,
              status: (populated.status as 'online' | 'offline' | 'away') || 'offline',
              createdAt: populated.createdAt || new Date().toISOString(),
              updatedAt: populated.updatedAt || new Date().toISOString(),
            }
          : {
              id: raw.senderId,
              name: '',
              email: '',
              status: 'offline' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
        content: raw.content,
        type: raw.type || 'text',
        isEdited: raw.isEdited,
        fileUrl: raw.fileUrl,
        fileName: raw.fileName,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };
      addMessage(normalizedMsg.roomId, normalizedMsg);
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
    joinRoom: (roomId: string) => {
      try {
        socketService.joinRoom(roomId);
      } catch (e) {}
    },
    leaveRoom: (roomId: string) => {
      try {
        socketService.leaveRoom(roomId);
      } catch (e) {}
    },
    sendMessage: async (roomId: string, content: string) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      // 1. Try sending via socket (real-time broadcast to other users)
      try {
        socketService.sendMessage(roomId, content);
      } catch (e) {}

      // 2. Persist the message via REST API to the Express backend
      try {
        const result = await messageService.sendChatMessage(roomId, {
          content,
          type: 'text',
        });

        const apiMsg = result.data;
        const newMessage: Message = {
          id: apiMsg._id,
          roomId: apiMsg.conversationId,
          senderId: apiMsg.senderId,
          sender: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            status: 'online',
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: user.updatedAt || new Date().toISOString(),
          },
          content: apiMsg.content,
          type: apiMsg.type,
          createdAt: apiMsg.createdAt,
          updatedAt: apiMsg.updatedAt,
        };

        addMessage(roomId, newMessage);

        // Refresh rooms in background so sidebar updates (e.g. last message preview)
        useChatStore.getState().fetchRooms();
      } catch (err) {
        // Fallback: add message locally if backend API fails
        const fallbackMessage: Message = {
          id: `msg-${Date.now()}`,
          roomId,
          senderId: user.id,
          sender: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            status: 'online',
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: user.updatedAt || new Date().toISOString(),
          },
          content,
          type: 'text',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addMessage(roomId, fallbackMessage);
      }
    },
    emitTyping: (roomId: string, isTyping: boolean) => {
      try {
        socketService.emitTyping(roomId, isTyping);
      } catch (e) {}
    },
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

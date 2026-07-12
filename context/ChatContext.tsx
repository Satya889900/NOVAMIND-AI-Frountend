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

      // --- OPTIMISTIC UI: Show the message instantly ---
      const tempMessageId = `temp-msg-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempMessageId,
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

      const { addMessage, removeMessageLocally, setTyping, fetchRooms } = useChatStore.getState();
      
      // Instantly add user's message to UI
      addMessage(roomId, optimisticMessage);
      
      // Instantly show AI is typing... (simulate waiting for AI)
      setTyping(roomId, 'NovaMind AI', true);

      // 2. Persist the message via REST API to the Express backend (and get AI reply)
      try {
        const result = await messageService.sendChatMessage(roomId, {
          content,
          type: 'text',
        });

        // Turn off AI typing indicator
        setTyping(roomId, 'NovaMind AI', false);

        // Remove the temporary optimistic user message
        removeMessageLocally(roomId, tempMessageId);

        const apiUserMsg = result.data.userMessage;
        const apiAiMsg = result.data.aiReply;

        const newUserMessage: Message = {
          id: apiUserMsg._id,
          roomId: apiUserMsg.conversationId,
          senderId: apiUserMsg.senderId,
          sender: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            status: 'online',
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: user.updatedAt || new Date().toISOString(),
          },
          content: apiUserMsg.content,
          type: apiUserMsg.type,
          createdAt: apiUserMsg.createdAt,
          updatedAt: apiUserMsg.updatedAt,
        };

        // Add real user message from DB
        addMessage(roomId, newUserMessage);

        // Add real AI message
        if (apiAiMsg) {
          const aiMessage: Message = {
            id: apiAiMsg._id,
            roomId: apiAiMsg.conversationId,
            senderId: apiAiMsg.senderId,
            sender: {
              id: apiAiMsg.senderId,
              name: 'NovaMind AI',
              email: 'novamind-ai@novamind.ai',
              avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&h=80&fit=crop',
              status: 'online',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            content: apiAiMsg.content,
            type: apiAiMsg.type,
            createdAt: apiAiMsg.createdAt,
            updatedAt: apiAiMsg.updatedAt,
          };
          addMessage(roomId, aiMessage);
        }

        // Refresh rooms in background so sidebar updates (e.g. last message preview)
        fetchRooms();
      } catch (err) {
        setTyping(roomId, 'NovaMind AI', false);
        // If API fails, keep the optimistic message but don't add an AI reply
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

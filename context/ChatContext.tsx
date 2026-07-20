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
  sendMessage: (
    roomId: string,
    content: string,
    type?: 'text' | 'image' | 'file',
    fileUrl?: string,
    fileName?: string,
    model?: string
  ) => void;
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
    sendMessage: async (
      roomId: string,
      content: string,
      type?: 'text' | 'image' | 'file',
      fileUrl?: string,
      fileName?: string,
      model?: string
    ) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      // --- OPTIMISTIC UI: Show the message instantly ---
      const tempUserMsgId = `temp-user-msg-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempUserMsgId,
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
        type: type || 'text',
        fileUrl,
        fileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { 
        addMessage, 
        removeMessageLocally, 
        setTyping, 
        fetchRooms,
        upsertStreamingMessage,
        finalizeStreamingMessage
      } = useChatStore.getState();
      
      // Instantly add user's message to UI
      addMessage(roomId, optimisticMessage);
      
      // Instantly show AI is typing... (simulate waiting for AI)
      setTyping(roomId, 'NovaMind AI', true);

      const streamingMsgId = `streaming-ai-msg-${Date.now()}`;
      let accumulatedText = '';

      // Detect FLUX image generation model upfront
      const isFluxModel = model?.toLowerCase().includes('flux') ?? false;

      // 1. Try sending via socket (real-time broadcast to other users)
      try {
        socketService.sendMessage(roomId, content, type || 'text');
      } catch (e) {}

      // ── FLUX Shimmer: Immediately show the shimmer skeleton ──
      // FLUX bypasses text streaming and goes straight to image generation,
      // so no onToken callbacks fire during the wait. We pre-inject the
      // sentinel text that ChatMessage.tsx checks to show the shimmer.
      if (isFluxModel) {
        setTyping(roomId, 'NovaMind AI', false);
        accumulatedText = 'Generating image using FLUX';
        upsertStreamingMessage(roomId, streamingMsgId, accumulatedText, 'text', model);
      }

      // 2. Stream message and AI responses via SSE
      messageService.streamChatMessage(
        roomId,
        {
          content,
          type: type || 'text',
          fileUrl,
          fileName,
          model,
        },
        // onToken chunk received
        (token) => {
          // For FLUX, tokens shouldn't arrive — but if they do, accumulate normally
          if (isFluxModel) return;
          accumulatedText += token;
          // Hide generic typing bubble once the actual text stream begins
          setTyping(roomId, 'NovaMind AI', false);
          // Update message bubble content in real-time
          upsertStreamingMessage(roomId, streamingMsgId, accumulatedText, 'text', model);
        },
        // onDone completed
        (data: any) => {
          setTyping(roomId, 'NovaMind AI', false);

          const apiAiMsg = data?.message;
          const apiUserMsg = data?.userMessage;

          // Swap optimistic streaming message with database final AI message
          if (apiAiMsg) {
            const finalAiMsg: Message = {
              id: apiAiMsg._id || apiAiMsg.id,
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
              model: apiAiMsg.model,
              fileUrl: apiAiMsg.fileUrl,
              fileName: apiAiMsg.fileName,
              createdAt: apiAiMsg.createdAt,
              updatedAt: apiAiMsg.updatedAt,
            };
            finalizeStreamingMessage(roomId, streamingMsgId, finalAiMsg);
          } else {
            removeMessageLocally(roomId, streamingMsgId);
          }

          // Swap optimistic user message with database final User message IN-PLACE
          // (must use finalizeStreamingMessage to keep position above AI reply,
          //  NOT remove + re-append which would push it below the AI answer)
          if (apiUserMsg) {
            const finalUserMsg: Message = {
              id: apiUserMsg._id || apiUserMsg.id,
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
              fileUrl: apiUserMsg.fileUrl,
              fileName: apiUserMsg.fileName,
              createdAt: apiUserMsg.createdAt,
              updatedAt: apiUserMsg.updatedAt,
            };
            // Swap temp ID → real DB ID at the same array position
            finalizeStreamingMessage(roomId, tempUserMsgId, finalUserMsg);
          }

          // Refresh rooms list in sidebar
          fetchRooms();
        },
        // onError occurred
        (err) => {
          setTyping(roomId, 'NovaMind AI', false);
          
          if (accumulatedText) {
            // If streaming had already started, append the error note to the bubble
            upsertStreamingMessage(
              roomId,
              streamingMsgId,
              `${accumulatedText}\n\n⚠️ *Streaming interrupted: ${err.message}*`,
              'text',
              model
            );
          } else {
            // Remove the empty streaming bubble and show a full error bubble
            removeMessageLocally(roomId, streamingMsgId);
            const errMessage: Message = {
              id: `err-msg-${Date.now()}`,
              roomId,
              senderId: 'novamind-ai-bot',
              sender: {
                id: 'novamind-ai-bot',
                name: 'NovaMind AI',
                email: 'novamind-ai@novamind.ai',
                avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&h=80&fit=crop',
                status: 'online',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              content: `⚠️ **NovaMind AI Error**\n\nFailed to generate AI response: ${err.message}`,
              type: 'text',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            addMessage(roomId, errMessage);
          }
        }
      );
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

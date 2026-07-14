import { create } from 'zustand';
import { ActiveChatState, Room, Message } from '../types/chat';
import { User } from '../types/user';
import { messageService } from '../services/message.service';
import { conversationService } from '../services/conversation.service';
import { useAuthStore } from './authStore';

interface ChatActions {
  fetchRooms: () => Promise<void>;
  createRoom: (data: { name?: string; isGroup?: boolean; participantIds?: string[] }) => Promise<Room>;
  selectRoom: (room: Room | null) => void;
  fetchMessages: (roomId: string) => Promise<void>;
  addMessage: (roomId: string, message: Message) => void;
  editMessage: (roomId: string, messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (roomId: string, messageId: string) => Promise<void>;
  removeMessageLocally: (roomId: string, messageId: string) => void;
  setTyping: (roomId: string, userName: string, isTyping: boolean) => void;
  updateUserStatus: (userId: string, status: 'online' | 'offline' | 'away') => void;
  renameRoom: (roomId: string, name: string) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
}

export const useChatStore = create<ActiveChatState & ChatActions>((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: {},
  isLoading: false,
  error: null,
  typingUsers: {},

  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await conversationService.getConversations();
      const apiRooms: Room[] = result.data.map((conv) => ({
        id: conv._id,
        name: conv.name,
        isGroup: conv.isGroup,
        avatarUrl: conv.avatarUrl || undefined,
        participants: conv.participants.map((p) => ({
          id: p._id,
          name: p.name,
          email: p.email,
          avatarUrl: p.avatarUrl || undefined,
          status: (p.status as 'online' | 'offline' | 'away') || 'offline',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        lastMessage: conv.lastMessage
          ? {
              id: conv.lastMessage._id,
              roomId: conv._id,
              senderId: conv.lastMessage.senderId,
              sender: {
                id: conv.lastMessage.senderId,
                name: '',
                email: '',
                status: 'offline' as const,
                createdAt: '',
                updatedAt: '',
              },
              content: conv.lastMessage.content,
              type: conv.lastMessage.type || 'text',
              fileUrl: conv.lastMessage.fileUrl || undefined,
              fileName: conv.lastMessage.fileName || undefined,
              createdAt: conv.lastMessage.createdAt,
              updatedAt: conv.lastMessage.createdAt,
            }
          : undefined,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));

      set({ rooms: apiRooms, isLoading: false });
    } catch (err: any) {
      set({ rooms: [], isLoading: false, error: 'Failed to load conversations.' });
    }
  },

  createRoom: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await conversationService.createConversation({
        name: data.name,
        isGroup: data.isGroup,
        participantIds: data.participantIds,
      });

      const conv = result.data;
      const room: Room = {
        id: conv._id,
        name: conv.name,
        isGroup: conv.isGroup,
        avatarUrl: conv.avatarUrl || undefined,
        participants: conv.participants.map((p) => ({
          id: p._id,
          name: p.name,
          email: p.email,
          avatarUrl: p.avatarUrl || undefined,
          status: (p.status as 'online' | 'offline' | 'away') || 'offline',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };

      set((state) => ({
        rooms: [room, ...state.rooms],
        isLoading: false,
      }));
      return room;
    } catch (err: any) {
      set({ isLoading: false, error: 'Failed to create room.' });
      throw err;
    }
  },

  selectRoom: (room) => {
    set({ activeRoom: room });
    if (room) {
      get().fetchMessages(room.id);
    }
  },

  fetchMessages: async (roomId) => {
    // If already have messages cached, skip re-fetch
    if (get().messages[roomId]?.length > 0) return;

    set({ isLoading: true, error: null });
    try {
      const result = await messageService.getMessages(roomId);
      const apiMessages: Message[] = result.data.map((m) => {
        // Backend populates senderId with the user object; extract sender info from it
        const populated =
          m.senderId && typeof (m.senderId as any) === 'object'
            ? (m.senderId as any)
            : null;
        const sender: User = m.sender
          ? (m.sender as unknown as User)
          : populated
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
              id: typeof m.senderId === 'string' ? m.senderId : '',
              name: '',
              email: '',
              status: 'offline' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
        return {
          id: (m as any)._id || m.id,
          roomId: m.roomId || m.conversationId,
          senderId: populated ? populated._id || populated.id : (m.senderId as string),
          sender,
          content: m.content,
          type: m.type,
          fileUrl: m.fileUrl,
          fileName: m.fileName,
          isEdited: m.isEdited,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        };
      });

      set((state) => ({
        messages: {
          ...state.messages,
          [roomId]: apiMessages,
        },
        isLoading: false,
      }));

      // Update lastMessage on the room
      if (apiMessages.length > 0) {
        const lastMsg = apiMessages[apiMessages.length - 1];
        set((state) => ({
          rooms: state.rooms.map((r) =>
            r.id === roomId ? { ...r, lastMessage: lastMsg } : r
          ),
        }));
      }
    } catch (err: any) {
      set({ error: 'Failed to load messages.', isLoading: false });
    }
  },

  addMessage: (roomId, message) => {
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      // Avoid duplicates
      if (roomMessages.some((m) => m.id === message.id)) return state;

      const updatedRooms = state.rooms.map((r) => {
        if (r.id === roomId) {
          return {
            ...r,
            lastMessage: message,
            unreadCount: state.activeRoom?.id === roomId ? 0 : (r.unreadCount || 0) + 1,
          };
        }
        return r;
      });

      return {
        messages: {
          ...state.messages,
          [roomId]: [...roomMessages, message],
        },
        rooms: updatedRooms,
      };
    });
  },

  editMessage: async (roomId, messageId, newContent) => {
    try {
      const result = await messageService.editMessage(messageId, newContent);
      const updatedMsg = result.data;

      set((state) => {
        const roomMessages = state.messages[roomId] || [];
        const updatedMessages = roomMessages.map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              content: updatedMsg.content,
              isEdited: true,
              updatedAt: updatedMsg.updatedAt,
            };
          }
          return m;
        });

        return {
          messages: {
            ...state.messages,
            [roomId]: updatedMessages,
          },
        };
      });
    } catch (err: any) {
      set({ error: 'Failed to edit message.' });
    }
  },

  deleteMessage: async (roomId, messageId) => {
    try {
      await messageService.deleteMessage(messageId);

      set((state) => {
        const roomMessages = (state.messages[roomId] || []).filter(
          (m) => m.id !== messageId
        );

        const updatedRooms = state.rooms.map((r) => {
          if (r.id === roomId) {
            return {
              ...r,
              lastMessage: roomMessages.length > 0 ? roomMessages[roomMessages.length - 1] : undefined,
            };
          }
          return r;
        });

        return {
          messages: {
            ...state.messages,
            [roomId]: roomMessages,
          },
          rooms: updatedRooms,
        };
      });
    } catch (err: any) {
      set({ error: 'Failed to delete message.' });
    }
  },

  removeMessageLocally: (roomId, messageId) => {
    set((state) => {
      const roomMessages = (state.messages[roomId] || []).filter(
        (m) => m.id !== messageId
      );

      const updatedRooms = state.rooms.map((r) => {
        if (r.id === roomId) {
          return {
            ...r,
            lastMessage: roomMessages.length > 0 ? roomMessages[roomMessages.length - 1] : undefined,
          };
        }
        return r;
      });

      return {
        messages: {
          ...state.messages,
          [roomId]: roomMessages,
        },
        rooms: updatedRooms,
      };
    });
  },

  setTyping: (roomId, userName, isTyping) => {
    set((state) => {
      const roomTyping = state.typingUsers[roomId] || [];
      let updatedTyping;
      if (isTyping) {
        if (roomTyping.includes(userName)) return state;
        updatedTyping = [...roomTyping, userName];
      } else {
        updatedTyping = roomTyping.filter((name) => name !== userName);
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: updatedTyping,
        },
      };
    });
  },

  updateUserStatus: (userId, status) => {
    set((state) => {
      const updatedRooms = state.rooms.map((room) => {
        const updatedParticipants = room.participants.map((p) => {
          if (p.id === userId) {
            return { ...p, status };
          }
          return p;
        });
        return { ...room, participants: updatedParticipants };
      });

      const updatedActiveRoom = state.activeRoom
        ? {
            ...state.activeRoom,
            participants: state.activeRoom.participants.map((p) =>
              p.id === userId ? { ...p, status } : p
            ),
          }
        : null;

      return {
        rooms: updatedRooms,
        activeRoom: updatedActiveRoom,
      };
    });
  },

  renameRoom: async (roomId, name) => {
    try {
      await conversationService.renameConversation(roomId, name);
      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)),
        activeRoom: state.activeRoom?.id === roomId ? { ...state.activeRoom, name } : state.activeRoom,
      }));
    } catch (err) {
      set({ error: 'Failed to rename conversation.' });
      throw err;
    }
  },

  deleteRoom: async (roomId) => {
    try {
      await conversationService.deleteConversation(roomId);
      set((state) => {
        const nextActiveRoom = state.activeRoom?.id === roomId ? null : state.activeRoom;
        const newRooms = state.rooms.filter((r) => r.id !== roomId);
        
        // Remove messages cache for this room
        const newMessages = { ...state.messages };
        delete newMessages[roomId];

        return {
          rooms: newRooms,
          activeRoom: nextActiveRoom,
          messages: newMessages,
        };
      });
    } catch (err) {
      set({ error: 'Failed to delete conversation.' });
      throw err;
    }
  },
}));

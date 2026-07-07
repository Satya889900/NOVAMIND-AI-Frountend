import { create } from 'zustand';
import { ActiveChatState, Room, Message } from '../types/chat';
import { chatService } from '../services/chat.service';

interface ChatActions {
  fetchRooms: () => Promise<void>;
  createRoom: (data: { name: string; isGroup: boolean; participantIds: string[] }) => Promise<Room>;
  selectRoom: (room: Room | null) => void;
  fetchMessages: (roomId: string) => Promise<void>;
  addMessage: (roomId: string, message: Message) => void;
  setTyping: (roomId: string, userName: string, isTyping: boolean) => void;
  updateUserStatus: (userId: string, status: 'online' | 'offline' | 'away') => void;
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
      const rooms = await chatService.getRooms();
      set({ rooms, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to fetch chats.', isLoading: false });
    }
  },

  createRoom: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const room = await chatService.createRoom(data);
      set((state) => ({
        rooms: [room, ...state.rooms],
        isLoading: false,
      }));
      return room;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to create room.', isLoading: false });
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
    if (get().messages[roomId]?.length > 0) return; // cache hit

    set({ isLoading: true, error: null });
    try {
      const msgs = await chatService.getMessages(roomId);
      set((state) => ({
        messages: {
          ...state.messages,
          [roomId]: msgs,
        },
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load messages.', isLoading: false });
    }
  },

  addMessage: (roomId, message) => {
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      // avoid duplicates
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
}));

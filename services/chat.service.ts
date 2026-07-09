import axiosClient from '../lib/axios';
import { API_ROUTES } from '../lib/constants';
import { Room, Message } from '../types/chat';
import { User } from '../types/user';

export const chatService = {
  /**
   * GET /conversations  →  http://localhost:5000/api/conversations
   * Returns all conversations the logged-in user is part of.
   */
  getRooms: async (): Promise<Room[]> => {
    const res = await axiosClient.get<{ success: boolean; data: Room[] }>(
      API_ROUTES.CONVERSATIONS.BASE
    );
    return res.data.data;
  },

  /**
   * POST /conversations  →  http://localhost:5000/api/conversations
   * Creates a new conversation. Creator is added automatically via auth token.
   */
  createRoom: async (data: {
    name?: string;
    isGroup?: boolean;
    participantIds?: string[];
  }): Promise<Room> => {
    const res = await axiosClient.post<{ success: boolean; data: Room }>(
      API_ROUTES.CONVERSATIONS.BASE,
      data
    );
    return res.data.data;
  },

  /**
   * GET /conversations/:id  →  http://localhost:5000/api/conversations/:id
   */
  getRoomById: async (roomId: string): Promise<Room> => {
    const res = await axiosClient.get<{ success: boolean; data: Room }>(
      API_ROUTES.CONVERSATIONS.BY_ID(roomId)
    );
    return res.data.data;
  },

  /**
   * DELETE /conversations/:id  →  http://localhost:5000/api/conversations/:id
   */
  deleteRoom: async (roomId: string): Promise<void> => {
    await axiosClient.delete(API_ROUTES.CONVERSATIONS.BY_ID(roomId));
  },

  /**
   * GET /conversations/:roomId/messages  →  http://localhost:5000/api/conversations/:roomId/messages
   */
  getMessages: async (roomId: string): Promise<Message[]> => {
    const res = await axiosClient.get<{ success: boolean; data: Message[] }>(
      API_ROUTES.MESSAGES.BY_ROOM(roomId)
    );
    return res.data.data;
  },

  /**
   * POST /conversations/:roomId/messages  →  http://localhost:5000/api/conversations/:roomId/messages
   */
  sendMessage: async (roomId: string, content: string, type?: string): Promise<Message> => {
    const res = await axiosClient.post<{ success: boolean; data: Message }>(
      API_ROUTES.MESSAGES.BY_ROOM(roomId),
      { content, type: type || 'text' }
    );
    return res.data.data;
  },

  /**
   * GET /users  →  http://localhost:5000/api/users
   * Returns all users (for selecting participants).
   */
  getUsers: async (): Promise<User[]> => {
    const res = await axiosClient.get<{ success: boolean; data: User[] }>(
      API_ROUTES.USERS.BASE
    );
    return res.data.data;
  },
};

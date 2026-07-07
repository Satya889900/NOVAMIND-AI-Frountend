import { api } from './api';
import { API_ROUTES } from '../lib/constants';
import { Room, Message } from '../types/chat';
import { User } from '../types/user';

export const chatService = {
  getRooms: async (): Promise<Room[]> => {
    const res = await api.get<Room[]>(API_ROUTES.CHAT.ROOMS);
    return res.data;
  },

  createRoom: async (data: { name: string; isGroup: boolean; participantIds: string[] }): Promise<Room> => {
    const res = await api.post<Room>(API_ROUTES.CHAT.ROOMS, data);
    return res.data;
  },

  getMessages: async (roomId: string): Promise<Message[]> => {
    const res = await api.get<Message[]>(API_ROUTES.CHAT.MESSAGES(roomId));
    return res.data;
  },

  getUsers: async (): Promise<User[]> => {
    const res = await api.get<User[]>(API_ROUTES.CHAT.USERS);
    return res.data;
  },
};

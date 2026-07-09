import { User } from './user';

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  isGroup: boolean;
  avatarUrl?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveChatState {
  rooms: Room[];
  activeRoom: Room | null;
  messages: { [roomId: string]: Message[] };
  isLoading: boolean;
  error: string | null;
  typingUsers: { [roomId: string]: string[] }; // user names typing
}

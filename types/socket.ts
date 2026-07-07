import { Message } from './chat';

export interface ServerToClientEvents {
  message_received: (message: Message) => void;
  user_typing: (data: { roomId: string; userId: string; userName: string; isTyping: boolean }) => void;
  user_status_changed: (data: { userId: string; status: 'online' | 'offline' | 'away' }) => void;
  room_created: (room: any) => void;
}

export interface ClientToServerEvents {
  join_room: (roomId: string) => void;
  leave_room: (roomId: string) => void;
  send_message: (data: { roomId: string; content: string; type: 'text' | 'image' | 'file' }) => void;
  typing: (data: { roomId: string; isTyping: boolean }) => void;
}

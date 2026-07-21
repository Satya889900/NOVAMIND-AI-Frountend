import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private url: string = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

  connect(token: string): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!this.socket) {
      this.socket = io(this.url, {
        auth: (cb) => {
          const activeToken = typeof window !== 'undefined' ? localStorage.getItem('token') || token : token;
          cb({ token: activeToken });
        },
        transports: ['websocket'],
        autoConnect: true,
      });
    } else {
      (this.socket.auth as any) = { token: typeof window !== 'undefined' ? localStorage.getItem('token') || token : token };
      if (!this.socket.connected) {
        this.socket.connect();
      }
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  joinRoom(roomId: string) {
    this.socket?.emit('join_room', roomId);
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave_room', roomId);
  }

  sendMessage(roomId: string, content: string, type: 'text' | 'image' | 'file' = 'text') {
    this.socket?.emit('send_message', { roomId, content, type });
  }

  emitTyping(roomId: string, isTyping: boolean) {
    this.socket?.emit('typing', { roomId, isTyping });
  }
}

export const socketService = new SocketService();

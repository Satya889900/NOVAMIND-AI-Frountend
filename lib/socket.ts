import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket && token) {
    socket = io(URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      autoConnect: false, // We will connect manually
    });
  } else if (!socket) {
    throw new Error('Socket not initialized. A token is required for the first call.');
  }

  return socket;
};
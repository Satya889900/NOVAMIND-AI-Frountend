import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket.service';
import { useAuthStore } from '../store/authStore';

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsConnected(false);
      setSocket(null);
      return;
    }

    const s = socketService.connect(token);
    setSocket(s as any);
    setIsConnected(s.connected);

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [isAuthenticated, token]);

  return {
    socket,
    isConnected,
    joinRoom: socketService.joinRoom.bind(socketService),
    leaveRoom: socketService.leaveRoom.bind(socketService),
    sendMessage: socketService.sendMessage.bind(socketService),
    emitTyping: socketService.emitTyping.bind(socketService),
  };
}

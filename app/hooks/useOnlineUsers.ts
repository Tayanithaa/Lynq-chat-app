import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketConfig, getSocketUrl } from '../utils/socketConfig';

export function useOnlineUsers(currentUsername?: string) {
  const [online, setOnline] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    const socketConfig = getSocketConfig();
    socketRef.current = io(socketUrl, socketConfig);

    socketRef.current.on('connect', () => {
      if (currentUsername) socketRef.current?.emit('join', currentUsername);
    });

    socketRef.current.on('users-online', (list: string[]) => {
      setOnline(list);
    });

    socketRef.current.on('user-joined', ({ username }) => {
      setOnline((prev) => Array.from(new Set([...prev, username])));
    });

    socketRef.current.on('user-left', ({ username }) => {
      setOnline((prev) => prev.filter((u) => u !== username));
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [currentUsername]);

  return online;
}

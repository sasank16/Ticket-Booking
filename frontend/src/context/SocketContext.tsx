import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinShowtime: (showtimeId: string) => void;
  leaveShowtime: (showtimeId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinShowtime: () => {},
  leaveShowtime: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('/', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('? WebSocket Connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('? WebSocket Disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinShowtime = (showtimeId: string) => {
    if (socket && showtimeId) {
      socket.emit('join:showtime', showtimeId);
    }
  };

  const leaveShowtime = (showtimeId: string) => {
    if (socket && showtimeId) {
      socket.emit('leave:showtime', showtimeId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinShowtime, leaveShowtime }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

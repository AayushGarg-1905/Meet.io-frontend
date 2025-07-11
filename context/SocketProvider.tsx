'use client'
import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';

type SocketContextType = Socket | null;

const SocketContext = createContext<SocketContextType>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socket = useMemo(() => io(process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL as string), []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): Socket => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return socket;
};

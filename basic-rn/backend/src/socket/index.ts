import { Server } from 'socket.io';

let io: Server | null = null;

export const initSocket = (serverIO: Server) => {
  io = serverIO;
};

export const getIO = (): Server | null => io;

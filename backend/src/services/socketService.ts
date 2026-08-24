import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HTTPServer, clientUrl: string) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join:showtime', (showtimeId: string) => {
      socket.join(`showtime:${showtimeId}`);
    });

    socket.on('leave:showtime', (showtimeId: string) => {
      socket.leave(`showtime:${showtimeId}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

export const broadcastSeatUpdate = (showtimeId: string, seats: any[]) => {
  if (io) {
    io.to(`showtime:${showtimeId}`).emit('seats:updated', {
      showtimeId,
      seats,
    });
  }
};

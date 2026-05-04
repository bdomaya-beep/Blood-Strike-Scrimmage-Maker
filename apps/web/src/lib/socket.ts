import { io, type Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket || !socket.connected) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export const CHANNELS = {
  eventStandings: (eventId: string) => `event:${eventId}:standings`,
  matchOps: (matchId: string) => `match:${matchId}:ops`,
  clanFeed: (clanId: string) => `clan:${clanId}:feed`,
  userNotifications: (userId: string) => `user:${userId}:notifications`,
};

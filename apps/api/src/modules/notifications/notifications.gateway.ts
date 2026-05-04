import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/ws' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('No token');
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}:notifications`);
      this.logger.log(`Client connected: ${client.id} user=${payload.sub}`);
    } catch {
      this.logger.warn(`Unauthorized connection attempt from ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:event')
  handleJoinEvent(@MessageBody() eventId: string, @ConnectedSocket() client: Socket) {
    client.join(`event:${eventId}:standings`);
    return { joined: `event:${eventId}:standings` };
  }

  @SubscribeMessage('leave:event')
  handleLeaveEvent(@MessageBody() eventId: string, @ConnectedSocket() client: Socket) {
    client.leave(`event:${eventId}:standings`);
    return { left: `event:${eventId}:standings` };
  }

  @SubscribeMessage('join:match')
  handleJoinMatch(@MessageBody() matchId: string, @ConnectedSocket() client: Socket) {
    client.join(`match:${matchId}:ops`);
    return { joined: `match:${matchId}:ops` };
  }

  @SubscribeMessage('leave:match')
  handleLeaveMatch(@MessageBody() matchId: string, @ConnectedSocket() client: Socket) {
    client.leave(`match:${matchId}:ops`);
    return { left: `match:${matchId}:ops` };
  }

  @SubscribeMessage('join:clan')
  handleJoinClan(@MessageBody() clanId: string, @ConnectedSocket() client: Socket) {
    client.join(`clan:${clanId}:feed`);
    return { joined: `clan:${clanId}:feed` };
  }

  // Called by services to push real-time events
  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}:notifications`).emit(event, data);
  }

  emitToEventRoom(eventId: string, event: string, data: unknown) {
    this.server.to(`event:${eventId}:standings`).emit(event, data);
  }

  emitToMatchRoom(matchId: string, event: string, data: unknown) {
    this.server.to(`match:${matchId}:ops`).emit(event, data);
  }

  emitToClanRoom(clanId: string, event: string, data: unknown) {
    this.server.to(`clan:${clanId}:feed`).emit(event, data);
  }
}

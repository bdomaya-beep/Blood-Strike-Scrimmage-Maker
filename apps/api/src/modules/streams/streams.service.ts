import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class StreamsService {
  constructor(private prisma: PrismaClient) {}

  async createSession(payload: {
    eventId: string;
    provider: string;
    embedUrl: string;
    title: string;
    hostUserId: string;
  }) {
    // Find or create the channel record
    let channel = await this.prisma.livestreamChannel.findFirst({
      where: { ownerUserId: payload.hostUserId, provider: payload.provider },
    });

    if (!channel) {
      channel = await this.prisma.livestreamChannel.create({
        data: {
          ownerUserId: payload.hostUserId,
          provider: payload.provider,
          channelId: `${payload.provider}-${payload.hostUserId}`,
          title: payload.title,
        },
      });
    }

    return this.prisma.livestreamSession.create({
      data: {
        channelId: channel.id,
        eventId: payload.eventId,
        embedUrl: payload.embedUrl,
        status: 'SCHEDULED' as any,
      },
    });
  }

  async updateSession(sessionId: string, payload: { status?: string; endedAt?: string }) {
    const session = await this.prisma.livestreamSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    return this.prisma.livestreamSession.update({
      where: { id: sessionId },
      data: {
        status: payload.status as any,
        endedAt: payload.endedAt ? new Date(payload.endedAt) : undefined,
      },
    });
  }

  async getLiveStreams(eventId?: string) {
    const where: Record<string, unknown> = { status: 'LIVE' };
    if (eventId) where.eventId = eventId;

    return this.prisma.livestreamSession.findMany({
      where,
      include: {
        channel: { select: { provider: true, ownerUserId: true } },
        event: { select: { id: true, title: true } },
      },
    });
  }
}

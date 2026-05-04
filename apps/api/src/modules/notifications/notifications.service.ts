import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface BroadcastPayload {
  type: string;
  title: string;
  body: string;
  payloadJson?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaClient,
  ) {}

  async create(userId: string, payload: BroadcastPayload) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        payloadJson: (payload.payloadJson ?? {}) as any,
      },
    });
  }

  async list(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    const unreadCount = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit), unreadCount } };
  }

  async markRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.userId !== userId) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async broadcastToMatchParticipants(matchId: string, payload: BroadcastPayload) {
    const participants = await this.prisma.matchParticipant.findMany({
      where: { matchId },
      include: { clan: { include: { members: { where: { status: 'active', clanRole: { in: ['CAPTAIN', 'MODERATOR'] } }, select: { userId: true } } } } },
    });

    const userIds = participants.flatMap((p: any) => p.clan.members.map((m: any) => m.userId));
    await Promise.all(userIds.map((userId: string) => this.create(userId, payload)));
  }

  async sendDiscordWebhook(targetId: string, content: string) {
    const target = await this.prisma.webhookTarget.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('Webhook target not found');

    const response = await fetch(target.endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    return { success: response.ok };
  }
}

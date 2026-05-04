import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface CreatePenaltyDto {
  clanId?: string;
  eventId: string;
  type: string;
  pointsDelta: number;
  reason: string;
  issuedById: string;
}

export interface CreateBanDto {
  targetType: string;
  targetId: string;
  reason: string;
  endsAt?: string;
  issuedById: string;
}

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaClient) {}

  async applyPenalty(dto: CreatePenaltyDto) {
    const penalty = await this.prisma.penalty.create({
      data: {
        clanId: dto.clanId,
        eventId: dto.eventId,
        type: dto.type as any,
        pointsDelta: dto.pointsDelta,
        reason: dto.reason,
        issuedById: dto.issuedById,
      },
    });

    if (dto.clanId) {
      await this.prisma.clan.update({
        where: { id: dto.clanId },
        data: { totalPoints: { decrement: dto.pointsDelta } },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorUserId: dto.issuedById,
        action: 'penalty.applied',
        entityType: 'clan',
        entityId: dto.clanId,
        newValueJson: { type: dto.type, pointsDelta: dto.pointsDelta, reason: dto.reason },
      },
    });

    return penalty;
  }

  async createViolation(payload: {
    eventId: string;
    matchId?: string;
    targetType: string;
    targetId: string;
    category: string;
    severity: string;
    evidenceJson?: Record<string, unknown>;
  }) {
    return this.prisma.violation.create({
      data: {
        eventId: payload.eventId,
        matchId: payload.matchId,
        targetType: payload.targetType,
        targetId: payload.targetId,
        category: payload.category,
        severity: payload.severity as any,
        evidenceJson: payload.evidenceJson as any,
      },
    });
  }

  async listViolations(targetId?: string, matchId?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};
    if (targetId) where.targetId = targetId;
    if (matchId) where.matchId = matchId;

    const [data, total] = await Promise.all([
      this.prisma.violation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.violation.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async issueBan(dto: CreateBanDto) {
    const ban = await this.prisma.ban.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        issuedById: dto.issuedById,
        status: 'ACTIVE' as any,
      },
    });

    if (dto.targetType === 'USER') {
      await this.prisma.user.update({
        where: { id: dto.targetId },
        data: { status: 'BANNED' as any },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorUserId: dto.issuedById,
        action: 'ban.issued',
        entityType: dto.targetType,
        entityId: dto.targetId,
        newValueJson: { reason: dto.reason, endsAt: dto.endsAt },
      },
    });

    return ban;
  }

  async listBans(status?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.ban.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startsAt: 'desc' },
      }),
      this.prisma.ban.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async liftBan(banId: string, liftedById: string, reason: string) {
    const ban = await this.prisma.ban.findUnique({ where: { id: banId } });
    if (!ban) throw new NotFoundException('Ban not found');

    await this.prisma.ban.update({
      where: { id: banId },
      data: { status: 'LIFTED' as any },
    });

    if (ban.targetType === 'USER') {
      const otherActiveBans = await this.prisma.ban.count({
        where: { targetId: ban.targetId, targetType: 'USER', status: 'ACTIVE' as any, id: { not: banId } },
      });

      if (otherActiveBans === 0) {
        await this.prisma.user.update({ where: { id: ban.targetId }, data: { status: 'ACTIVE' as any } });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        actorUserId: liftedById,
        action: 'ban.lifted',
        entityType: 'ban',
        entityId: banId,
        newValueJson: { reason },
      },
    });

    return { message: 'Ban lifted successfully' };
  }

  async getAuditLogs(actorUserId?: string, entityType?: string, page = 1, limit = 50) {
    const where: Record<string, unknown> = {};
    if (actorUserId) where.actorUserId = actorUserId;
    if (entityType) where.entityType = entityType;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, username: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getSuspiciousFlags(status?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.suspiciousFlag.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.suspiciousFlag.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async listUsers(query?: string, status?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (query) {
      where.OR = [
        { username: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, email: true, status: true, createdAt: true, region: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async updateUserStatus(userId: string, status: string, actorId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
      select: { id: true, username: true, status: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'user.status.updated',
        entityType: 'user',
        entityId: userId,
        newValueJson: { status } as any,
      },
    });

    return user;
  }
}

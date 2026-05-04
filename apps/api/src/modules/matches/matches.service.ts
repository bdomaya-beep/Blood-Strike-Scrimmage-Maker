import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

export interface SubmitResultDto {
  summary: {
    placements: Array<{ clanId: string; placement: number }>;
    killLogs: Array<{
      playerId: string;
      clanId: string;
      killType: string;
      weapon?: string;
      isHeadshot?: boolean;
    }>;
  };
}

export interface UploadEvidenceDto {
  type: 'screenshot' | 'video' | 'log';
  fileUrl: string;
  fileHash: string;
  metadataJson?: Record<string, unknown>;
}

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaClient,
    private notifications: NotificationsService,
  ) {}

  async findById(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participants: { include: { clan: { select: { id: true, name: true, tag: true, logoUrl: true } } } },
        result: true,
        disputes: { where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } },
        rooms: true,
      },
    });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  async startReadyCheck(matchId: string, organizerId: string) {
    const match = await this.findById(matchId);
    if (match.status !== 'SCHEDULED') {
      throw new BadRequestException('Ready check can only start from SCHEDULED status');
    }

    const closesAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min window

    const readyCheck = await this.prisma.$transaction(async (tx: any) => {
      const rc = await tx.matchReadyCheck.create({
        data: { matchId, closesAt },
      });
      await tx.match.update({ where: { id: matchId }, data: { status: 'READY_CHECK' } });
      return rc;
    });

    // Notify clan captains
    await this.notifications.broadcastToMatchParticipants(matchId, {
      type: 'match.readycheck.started',
      title: 'Ready Check Started',
      body: 'Your match is starting soon. Confirm readiness now.',
      payloadJson: { matchId, closesAt },
    });

    return readyCheck;
  }

  async confirmReady(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true },
    });
    if (!match) throw new NotFoundException('Match not found');

    // Find which clan this user captains in this match
    const userClanMemberships = await this.prisma.clanMember.findMany({
      where: { userId, clanRole: { in: ['CAPTAIN', 'MODERATOR'] }, status: 'active' },
    });
    const participantClanIds = match.participants.map((p: any) => p.clanId);
    const myClan = userClanMemberships.find((m: any) => participantClanIds.includes(m.clanId));
    if (!myClan) throw new ForbiddenException('You are not a captain of a participating clan');

    await this.prisma.matchParticipant.update({
      where: { matchId_clanId: { matchId, clanId: myClan.clanId } },
      data: { readyState: 'READY', checkedInAt: new Date() },
    });

    // Check if all clans are ready
    const allReady = await this.prisma.matchParticipant.findMany({ where: { matchId } });
    if (allReady.every((p: any) => p.readyState === 'READY')) {
      await this.prisma.match.update({ where: { id: matchId }, data: { status: 'LIVE' } });
    }

    return { message: 'Readiness confirmed' };
  }

  async submitResult(matchId: string, dto: SubmitResultDto, submittedById: string) {
    const match = await this.findById(matchId);
    if (!['LIVE', 'RESULT_PENDING'].includes(match.status)) {
      throw new BadRequestException('Match is not in a submittable state');
    }

    return this.prisma.$transaction(async (tx: any) => {
      const result = await tx.matchResult.upsert({
        where: { matchId },
        update: { summaryJson: dto.summary, submittedById, submittedAt: new Date(), verificationState: 'PENDING' },
        create: { matchId, summaryJson: dto.summary, submittedById },
      });

      // Bulk upsert team stats from placements
      for (const p of dto.summary.placements) {
        await tx.teamMatchStat.upsert({
          where: { matchId_clanId: { matchId, clanId: p.clanId } },
          update: { placement: p.placement },
          create: { matchId, clanId: p.clanId, placement: p.placement },
        });
      }

      // Bulk insert kill logs
      if (dto.summary.killLogs.length > 0) {
        await tx.killLog.createMany({
          data: dto.summary.killLogs.map((k) => ({ ...k, matchId, occurredAt: new Date() })),
          skipDuplicates: true,
        });
      }

      await tx.match.update({ where: { id: matchId }, data: { status: 'RESULT_PENDING' } });
      return result;
    });
  }

  async uploadEvidence(matchId: string, dto: UploadEvidenceDto, uploadedById: string) {
    // Prevent duplicate file hashes per match
    const existing = await this.prisma.matchEvidence.findFirst({
      where: { matchId, fileHash: dto.fileHash },
    });
    if (existing) throw new BadRequestException('Duplicate evidence detected');

    return this.prisma.matchEvidence.create({
      data: { matchId, uploadedById, ...(dto as any) },
    });
  }

  async openDispute(matchId: string, reason: string, openedById: string) {
    const match = await this.findById(matchId);
    if (match.status !== 'RESULT_PENDING') {
      throw new BadRequestException('Disputes can only be opened on pending results');
    }

    const dispute = await this.prisma.$transaction(async (tx: any) => {
      const d = await tx.matchDispute.create({ data: { matchId, openedById, reason } });
      await tx.match.update({ where: { id: matchId }, data: { status: 'DISPUTED' } });
      return d;
    });

    await this.notifications.broadcastToMatchParticipants(matchId, {
      type: 'match.dispute.opened',
      title: 'Match Dispute Opened',
      body: `A dispute was filed for match ${matchId}`,
      payloadJson: { matchId, disputeId: dispute.id },
    });

    return dispute;
  }

  async resolveDispute(
    matchId: string,
    disputeId: string,
    payload: { status: 'RESOLVED' | 'DISMISSED'; resolutionNotes: string },
    resolvedById: string,
  ) {
    await this.prisma.matchDispute.update({
      where: { id: disputeId },
      data: { status: payload.status, resolutionNotes: payload.resolutionNotes, resolvedById, resolvedAt: new Date() },
    });

    await this.prisma.match.update({
      where: { id: matchId },
      data: { status: 'RESULT_PENDING' },
    });

    return { message: 'Dispute resolved' };
  }

  async verifyResult(matchId: string, verifiedById: string) {
    await this.prisma.$transaction(async (tx: any) => {
      await tx.matchResult.update({
        where: { matchId },
        data: { verificationState: 'APPROVED', verifiedById, verifiedAt: new Date() },
      });
      await tx.match.update({ where: { id: matchId }, data: { status: 'VERIFIED' } });
    });
    return { message: 'Match verified' };
  }

  async lockMatch(matchId: string) {
    await this.prisma.match.update({
      where: { id: matchId },
      data: { status: 'LOCKED', lockedAt: new Date() },
    });
    return { message: 'Match locked' };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface StandingsEntry {
  rank: number;
  clanId: string;
  clanName: string;
  clanTag: string;
  logoUrl: string | null;
  totalPoints: number;
  totalKills: number;
  matchesPlayed: number;
  wins: number;
}

@Injectable()
export class StandingsService {
  constructor(private prisma: PrismaClient) {}

  async getStandings(eventId: string): Promise<{ eventId: string; version: number; entries: StandingsEntry[]; updatedAt: Date }> {
    // Try latest snapshot first
    const snapshot = await this.prisma.standingsSnapshot.findFirst({
      where: { eventId },
      orderBy: { version: 'desc' },
    });

    if (snapshot) {
      return {
        eventId,
        version: snapshot.version,
        entries: snapshot.snapshotJson as unknown as StandingsEntry[],
        updatedAt: snapshot.createdAt,
      };
    }

    // Compute on-the-fly if no snapshot
    return this.computeAndSnapshot(eventId);
  }

  async computeAndSnapshot(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    // Get all locked/verified team stats for this event
    const teamStats = await this.prisma.teamMatchStat.findMany({
      where: { match: { eventId, status: { in: ['VERIFIED', 'LOCKED'] } } },
      include: { clan: { select: { id: true, name: true, tag: true, logoUrl: true } } },
    });

    // Aggregate per clan
    const clanMap = new Map<string, StandingsEntry & { clan: { id: string; name: string; tag: string; logoUrl: string | null } }>();

    for (const stat of teamStats) {
      const existing = clanMap.get(stat.clanId);
      if (existing) {
        existing.totalPoints += stat.totalPoints;
        existing.totalKills += stat.totalKills;
        existing.matchesPlayed += 1;
        if (stat.placement === 1) existing.wins += 1;
      } else {
        clanMap.set(stat.clanId, {
          rank: 0,
          clanId: stat.clanId,
          clanName: stat.clan.name,
          clanTag: stat.clan.tag,
          logoUrl: stat.clan.logoUrl,
          totalPoints: stat.totalPoints,
          totalKills: stat.totalKills,
          matchesPlayed: 1,
          wins: stat.placement === 1 ? 1 : 0,
          clan: stat.clan,
        });
      }
    }

    // Sort and rank
    const entries = Array.from(clanMap.values())
      .sort((a, b) => b.totalPoints - a.totalPoints || b.totalKills - a.totalKills)
      .map((e, i) => {
        const { clan: _clan, ...entry } = e;
        return { ...entry, rank: i + 1 };
      });

    // Save snapshot
    const lastVersion = await this.prisma.standingsSnapshot.aggregate({
      where: { eventId },
      _max: { version: true },
    });
    const version = (lastVersion._max.version ?? 0) + 1;

    const snapshot = await this.prisma.standingsSnapshot.create({
      data: { eventId, version, snapshotJson: entries },
    });

    return { eventId, version: snapshot.version, entries, updatedAt: snapshot.createdAt };
  }

  async getPlayerLeaderboard(eventId: string) {
    const stats = await this.prisma.playerMatchStat.findMany({
      where: { match: { eventId, status: { in: ['VERIFIED', 'LOCKED'] } } },
      include: { player: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });

    const playerMap = new Map<string, { playerId: string; username: string; displayName: string; avatarUrl: string | null; totalKills: number; mvpCount: number; matches: number }>();

    for (const s of stats) {
      const existing = playerMap.get(s.playerId);
      if (existing) {
        existing.totalKills += s.kills;
        if (s.mvp) existing.mvpCount += 1;
        existing.matches += 1;
      } else {
        playerMap.set(s.playerId, {
          playerId: s.playerId,
          username: s.player.username,
          displayName: s.player.displayName,
          avatarUrl: s.player.avatarUrl,
          totalKills: s.kills,
          mvpCount: s.mvp ? 1 : 0,
          matches: 1,
        });
      }
    }

    return Array.from(playerMap.values())
      .sort((a, b) => b.totalKills - a.totalKills)
      .slice(0, 50)
      .map((p, i) => ({ rank: i + 1, ...p, avgKills: p.totalKills / p.matches }));
  }
}

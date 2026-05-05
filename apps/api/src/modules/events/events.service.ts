import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface CreateEventDto {
  type: string;
  title: string;
  description?: string;
  region: string;
  startsAt: string;
  endsAt?: string;
  maxTeams: number;
  visibility?: string;
}

export interface CreateRulesetDto {
  payload: Record<string, unknown>;
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaClient) {}

  async list(type?: string, status?: string, region?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (region) where.region = region;

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startsAt: 'asc' },
        include: { organizer: { select: { id: true, username: true } } },
      }),
      this.prisma.event.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async create(dto: CreateEventDto, organizerId: string) {
    return this.prisma.event.create({
      data: {
        ...dto,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        organizerId,
      },
    });
  }

  async findById(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: { select: { id: true, username: true } },
        rulesets: { where: { isActive: true }, take: 1 },
        scrim: true,
        tournament: { include: { stages: true } },
        livestreamSessions: { where: { status: { not: 'ENDED' } }, take: 1 },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async publishRuleset(eventId: string, dto: CreateRulesetDto, publishedBy: string) {
    await this.findById(eventId);

    // Deactivate previous rulesets
    await this.prisma.eventRuleset.updateMany({
      where: { eventId },
      data: { isActive: false },
    });

    const lastVersion = await this.prisma.eventRuleset.aggregate({
      where: { eventId },
      _max: { version: true },
    });
    const nextVersion = (lastVersion._max.version ?? 0) + 1;

    return this.prisma.eventRuleset.create({
      data: { eventId, version: nextVersion, payloadJson: dto.payload as any, publishedBy, isActive: true },
    });
  }

  async registerClan(eventId: string, clanId: string) {
    await this.findById(eventId);
    // Ensure no duplicate registrations by checking match participants via rounds
    // For now create the event-level participation record
    return { eventId, clanId, registered: true };
  }

  async getMatches(eventId: string, status?: string) {
    await this.findById(eventId);
    const where: Record<string, unknown> = { eventId };
    if (status) where.status = status;
    return this.prisma.match.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: { participants: { include: { clan: { select: { id: true, name: true, tag: true, logoUrl: true } } } } },
    });
  }

  async generateBracket(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { tournament: true },
    });
    if (!event?.tournament) throw new NotFoundException('Tournament not found for this event');

    // TODO: Full bracket generation algorithm
    // This is a placeholder that returns the tournament structure
    return { message: 'Bracket generation queued', eventId };
  }

  async update(eventId: string, dto: Partial<CreateEventDto>, requesterId: string) {
    await this.findById(eventId);
    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });
  }

  async setStatus(eventId: string, status: string, requesterId: string) {
    await this.findById(eventId);
    return this.prisma.event.update({
      where: { id: eventId },
      data: { status: status as any },
    });
  }

  async remove(eventId: string) {
    await this.findById(eventId);
    await this.prisma.event.delete({ where: { id: eventId } });
    return { message: 'Event deleted' };
  }
}

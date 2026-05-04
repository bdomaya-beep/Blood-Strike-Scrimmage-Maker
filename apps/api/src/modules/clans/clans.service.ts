import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateClanDto, UpdateClanDto, InviteMemberDto } from './dto/clans.dto';
import { addDays } from 'date-fns';

@Injectable()
export class ClansService {
  constructor(private prisma: PrismaClient) {}

  async list(region?: string, page = 1, limit = 20) {
    const where = region ? { region, status: 'active' } : { status: 'active' };
    const [data, total] = await Promise.all([
      this.prisma.clan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { totalPoints: 'desc' },
      }),
      this.prisma.clan.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async create(dto: CreateClanDto, captainUserId: string) {
    const existing = await this.prisma.clan.findFirst({
      where: { OR: [{ name: dto.name }, { tag: dto.tag }] },
    });
    if (existing) throw new ConflictException('Clan name or tag already in use');

    const clan = await this.prisma.clan.create({
      data: { ...dto, captainUserId },
    });

    // Add captain as CAPTAIN member
    await this.prisma.clanMember.create({
      data: { clanId: clan.id, userId: captainUserId, clanRole: 'CAPTAIN' },
    });

    return clan;
  }

  async findById(clanId: string) {
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      include: { members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } } },
    });
    if (!clan) throw new NotFoundException('Clan not found');
    return clan;
  }

  async update(clanId: string, dto: UpdateClanDto, userId: string) {
    await this.assertCaptainOrAdmin(clanId, userId);
    return this.prisma.clan.update({ where: { id: clanId }, data: dto });
  }

  async disband(clanId: string, userId: string) {
    await this.assertCaptainOrAdmin(clanId, userId);
    await this.prisma.clan.update({ where: { id: clanId }, data: { status: 'disbanded' } });
  }

  async listMembers(clanId: string) {
    return this.prisma.clanMember.findMany({
      where: { clanId, status: 'active' },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });
  }

  async invite(clanId: string, dto: InviteMemberDto, invitedById: string) {
    await this.assertCaptainOrAdmin(clanId, invitedById);

    const alreadyMember = await this.prisma.clanMember.findFirst({
      where: { clanId, userId: dto.userId, status: 'active' },
    });
    if (alreadyMember) throw new ConflictException('User is already a member');

    return this.prisma.clanInvite.create({
      data: {
        clanId,
        invitedUserId: dto.userId,
        invitedById,
        message: dto.message,
        expiresAt: addDays(new Date(), 7),
      },
    });
  }

  async acceptInvite(inviteId: string, userId: string) {
    const invite = await this.prisma.clanInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.invitedUserId !== userId) throw new ForbiddenException();
    if (invite.status !== 'pending') throw new ConflictException('Invite is no longer pending');
    if (invite.expiresAt < new Date()) throw new ConflictException('Invite has expired');

    await this.prisma.$transaction([
      this.prisma.clanInvite.update({
        where: { id: inviteId },
        data: { status: 'accepted', respondedAt: new Date() },
      }),
      this.prisma.clanMember.upsert({
        where: { clanId_userId: { clanId: invite.clanId, userId } },
        update: { status: 'active', leftAt: null },
        create: { clanId: invite.clanId, userId, clanRole: 'MEMBER' },
      }),
    ]);
  }

  async declineInvite(inviteId: string, userId: string) {
    const invite = await this.prisma.clanInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.invitedUserId !== userId) throw new ForbiddenException();

    await this.prisma.clanInvite.update({
      where: { id: inviteId },
      data: { status: 'declined', respondedAt: new Date() },
    });
  }

  private async assertCaptainOrAdmin(clanId: string, userId: string) {
    const isSuperAdmin = await this.prisma.userRole.findFirst({
      where: { userId, role: { code: 'super_admin' } },
    });
    if (isSuperAdmin) return;

    const membership = await this.prisma.clanMember.findFirst({
      where: { clanId, userId, status: 'active', clanRole: { in: ['CAPTAIN', 'MODERATOR'] } },
    });
    if (!membership) throw new ForbiddenException('Only clan captain or moderator can perform this action');
  }
}

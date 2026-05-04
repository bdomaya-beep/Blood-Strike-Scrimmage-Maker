import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './dto/auth.dto';

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TOURNAMENT_ORGANIZER: 'tournament_organizer',
  CLAN_LEADER: 'clan_leader',
  CLAN_MODERATOR: 'clan_moderator',
  PLAYER: 'player',
  SPECTATOR: 'spectator',
} as const;

const REQUESTABLE_ROLE_CODES = [
  ROLES.TOURNAMENT_ORGANIZER,
  ROLES.CLAN_LEADER,
  ROLES.CLAN_MODERATOR,
  ROLES.SPECTATOR,
];

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (exists) throw new ConflictException('Email or username already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName ?? dto.username,
        passwordHash,
        region: dto.region,
      },
    });

    const playerRole = await this.ensureRoleExists(ROLES.PLAYER);
    await this.ensureUserHasRole(user.id, playerRole.id);

    return this.signTokenPair(user.id, user.email, user.username, [ROLES.PLAYER]);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');

    const roles = await this.getUserRoles(user.id);
    return this.signTokenPair(user.id, user.email, user.username, roles);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        region: true,
        isVerified: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const roles = await this.getUserRoles(userId);
    return { ...user, roles };
  }

  async updateProfile(userId: string, data: { displayName?: string; region?: string; avatarUrl?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwt.verify<{ sub: string; email: string; username: string; roles: string[] }>(
        refreshToken,
        { secret: this.config.get('JWT_REFRESH_SECRET') },
      );
      return this.signTokenPair(payload.sub, payload.email, payload.username, payload.roles);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async requestRole(userId: string, roleCode: string) {
    const normalizedRole = this.normalizeRole(roleCode);
    if (!REQUESTABLE_ROLE_CODES.includes(normalizedRole as (typeof REQUESTABLE_ROLE_CODES)[number])) {
      throw new BadRequestException('This role cannot be requested');
    }

    const hasRole = await this.prisma.userRole.findFirst({
      where: { userId, role: { code: normalizedRole } },
      include: { role: true },
    });
    if (hasRole) {
      throw new ConflictException('You already have this role');
    }

    const existingOpen = await this.prisma.report.findFirst({
      where: {
        reporterUserId: userId,
        targetType: 'ROLE_REQUEST',
        reason: normalizedRole,
        status: 'open',
      },
    });
    if (existingOpen) {
      throw new ConflictException('You already have a pending request for this role');
    }

    const request = await this.prisma.report.create({
      data: {
        reporterUserId: userId,
        targetType: 'ROLE_REQUEST',
        targetId: userId,
        reason: normalizedRole,
      },
      include: {
        reporter: { select: { id: true, username: true, displayName: true, email: true } },
      },
    });

    return {
      message: 'Role request submitted. Waiting for Super Admin approval.',
      request,
    };
  }

  async bootstrapSuperAdmin(userId: string) {
    const existingSuperAdmin = await this.prisma.userRole.findFirst({
      where: { role: { code: ROLES.SUPER_ADMIN } },
    });

    if (existingSuperAdmin && existingSuperAdmin.userId !== userId) {
      throw new ForbiddenException('Super Admin already exists');
    }

    const role = await this.ensureRoleExists(ROLES.SUPER_ADMIN);
    await this.ensureUserHasRole(userId, role.id, userId);

    const roles = await this.getUserRoles(userId);
    return {
      message: 'Super Admin role granted',
      userId,
      roles,
    };
  }

  async listRoleRequests(status = 'open') {
    const where = {
      targetType: 'ROLE_REQUEST',
      ...(status ? { status } : {}),
    };

    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, username: true, displayName: true, email: true } },
        resolvedBy: { select: { id: true, username: true, displayName: true } },
      },
    });
  }

  async reviewRoleRequest(requestId: string, approve: boolean, reviewerId: string) {
    const request = await this.prisma.report.findUnique({ where: { id: requestId } });
    if (!request || request.targetType !== 'ROLE_REQUEST') {
      throw new NotFoundException('Role request not found');
    }
    if (request.status !== 'open') {
      throw new ConflictException('Request already reviewed');
    }

    if (approve) {
      await this.grantRole(request.targetId, request.reason, reviewerId);
    }

    const updated = await this.prisma.report.update({
      where: { id: requestId },
      data: {
        status: approve ? 'approved' : 'rejected',
        resolvedById: reviewerId,
        resolvedAt: new Date(),
      },
      include: {
        reporter: { select: { id: true, username: true, displayName: true, email: true } },
        resolvedBy: { select: { id: true, username: true, displayName: true } },
      },
    });

    return {
      message: approve ? 'Role request approved' : 'Role request rejected',
      request: updated,
    };
  }

  async grantRole(targetUserId: string, roleCode: string, grantedById: string) {
    const normalizedRole = this.normalizeRole(roleCode);
    if (normalizedRole === ROLES.SUPER_ADMIN && targetUserId !== grantedById) {
      throw new ForbiddenException('Direct super admin assignment is restricted');
    }

    const role = await this.ensureRoleExists(normalizedRole);
    await this.ensureUserHasRole(targetUserId, role.id, grantedById);

    const roles = await this.getUserRoles(targetUserId);
    return {
      message: `Role ${normalizedRole} granted`,
      userId: targetUserId,
      roles,
    };
  }

  private async signTokenPair(userId: string, email: string, username: string, roles: string[]) {
    const payload = { sub: userId, email, username, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
        secret: this.config.get('JWT_SECRET'),
      }),
      this.jwt.signAsync(payload, {
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        secret: this.config.get('JWT_REFRESH_SECRET'),
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private async getUserRoles(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((ur: any) => ur.role.code);
  }

  private normalizeRole(roleCode: string) {
    const role = roleCode?.trim().toLowerCase();
    const aliases: Record<string, string> = {
      'super admin': ROLES.SUPER_ADMIN,
      superadmin: ROLES.SUPER_ADMIN,
      admin: ROLES.SUPER_ADMIN,
      organizer: ROLES.TOURNAMENT_ORGANIZER,
      'tournament organizer': ROLES.TOURNAMENT_ORGANIZER,
      'clan leader': ROLES.CLAN_LEADER,
      'clan moderator': ROLES.CLAN_MODERATOR,
    };
    return aliases[role] ?? role;
  }

  private async ensureRoleExists(roleCode: string) {
    const existing = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (existing) return existing;
    return this.prisma.role.create({
      data: {
        code: roleCode,
        name: roleCode
          .split('_')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' '),
      },
    });
  }

  private async ensureUserHasRole(userId: string, roleId: string, grantedById?: string) {
    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId, scopeType: 'GLOBAL', scopeId: null },
    });
    if (existing) return existing;

    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        scopeType: 'GLOBAL',
        grantedById,
      },
    });
  }
}

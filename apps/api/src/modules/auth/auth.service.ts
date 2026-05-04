import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './dto/auth.dto';

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

    return this.signTokenPair(user.id, user.email, user.username, ['player']);
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
}

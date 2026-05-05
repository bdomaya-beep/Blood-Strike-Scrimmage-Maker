import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
  isPinned?: boolean;
}

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaClient) {}

  async list(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: { author: { select: { id: true, username: true, displayName: true } } },
      }),
      this.prisma.announcement.count(),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const a = await this.prisma.announcement.findUnique({
      where: { id },
      include: { author: { select: { id: true, username: true, displayName: true } } },
    });
    if (!a) throw new NotFoundException('Announcement not found');
    return a;
  }

  async create(dto: CreateAnnouncementDto, authorId: string) {
    return this.prisma.announcement.create({
      data: { ...dto, authorId },
      include: { author: { select: { id: true, username: true, displayName: true } } },
    });
  }

  async update(id: string, dto: Partial<CreateAnnouncementDto>, requesterId: string) {
    const a = await this.findById(id);
    // allow author or anyone (super admin checked at controller level)
    return this.prisma.announcement.update({
      where: { id },
      data: dto,
      include: { author: { select: { id: true, username: true, displayName: true } } },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted' };
  }
}

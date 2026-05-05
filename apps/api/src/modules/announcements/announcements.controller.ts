import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService, CreateAnnouncementDto } from './announcements.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private announcements: AnnouncementsService) {}

  @Get()
  list(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.announcements.list(+page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.announcements.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('super_admin', 'organizer')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: AuthenticatedUser) {
    return this.announcements.create(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('super_admin', 'organizer')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAnnouncementDto>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcements.update(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.announcements.remove(id);
  }
}

import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationService, CreatePenaltyDto, CreateBanDto } from './moderation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Moderation')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private moderation: ModerationService) {}

  @Post('penalties')
  @Roles('admin', 'moderator')
  applyPenalty(@Body() dto: CreatePenaltyDto, @CurrentUser() user: AuthenticatedUser) {
    return this.moderation.applyPenalty({ ...dto, issuedById: user.id });
  }

  @Get('violations')
  @Roles('admin', 'moderator')
  listViolations(
    @Query('userId') userId?: string,
    @Query('matchId') matchId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.moderation.listViolations(userId, matchId, +page, +limit); // userId used as targetId filter
  }

  @Post('violations')
  @Roles('admin', 'moderator')
  createViolation(@Body() body: any, @CurrentUser() user: AuthenticatedUser) {
    return this.moderation.createViolation({ ...body, reportedById: user.id });
  }

  @Get('bans')
  @Roles('admin', 'moderator')
  listBans(@Query('status') status?: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.moderation.listBans(status, +page, +limit);
  }

  @Post('bans')
  @Roles('admin', 'moderator')
  issueBan(@Body() dto: CreateBanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.moderation.issueBan({ ...dto, issuedById: user.id });
  }

  @Post('bans/:banId/lift')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  liftBan(
    @Param('banId') banId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderation.liftBan(banId, user.id, reason);
  }

  @Get('admin/audit-logs')
  @Roles('admin')
  getAuditLogs(
    @Query('actorId') actorId?: string,
    @Query('resource') resource?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.moderation.getAuditLogs(actorId, resource, +page, +limit);
  }

  @Get('admin/suspicious-flags')
  @Roles('admin', 'moderator')
  getSuspiciousFlags(@Query('status') status?: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.moderation.getSuspiciousFlags(status, +page, +limit);
  }

  @Get('admin/users')
  @Roles('admin', 'moderator')
  listUsers(@Query('q') q?: string, @Query('status') status?: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.moderation.listUsers(q, status, +page, +limit);
  }

  @Patch('admin/users/:userId')
  @Roles('admin')
  updateUserStatus(
    @Param('userId') userId: string,
    @Body('status') status: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderation.updateUserStatus(userId, status, user.id);
  }
}

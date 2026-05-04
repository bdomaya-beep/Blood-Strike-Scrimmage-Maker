import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClansService } from './clans.service';
import { CreateClanDto, UpdateClanDto, InviteMemberDto, CreateRecruitmentPostDto } from './dto/clans.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Clans')
@Controller('clans')
export class ClansController {
  constructor(private clans: ClansService) {}

  @Get()
  list(@Query('region') region?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.clans.list(region, +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateClanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.clans.create(dto, user.id);
  }

  @Get(':clanId')
  findOne(@Param('clanId') clanId: string) {
    return this.clans.findById(clanId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':clanId')
  update(@Param('clanId') clanId: string, @Body() dto: UpdateClanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.clans.update(clanId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':clanId')
  @HttpCode(HttpStatus.NO_CONTENT)
  disband(@Param('clanId') clanId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.clans.disband(clanId, user.id);
  }

  @Get(':clanId/members')
  listMembers(@Param('clanId') clanId: string) {
    return this.clans.listMembers(clanId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':clanId/invites')
  invite(@Param('clanId') clanId: string, @Body() dto: InviteMemberDto, @CurrentUser() user: AuthenticatedUser) {
    return this.clans.invite(clanId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('invites/:inviteId/accept')
  @HttpCode(HttpStatus.OK)
  acceptInvite(@Param('inviteId') inviteId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.clans.acceptInvite(inviteId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('invites/:inviteId/decline')
  @HttpCode(HttpStatus.OK)
  declineInvite(@Param('inviteId') inviteId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.clans.declineInvite(inviteId, user.id);
  }
}

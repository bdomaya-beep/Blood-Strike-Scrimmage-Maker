import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService, CreateEventDto, CreateRulesetDto } from './events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private events: EventsService) {}

  @Get()
  list(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('region') region?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.events.list(type, status, region, +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.events.create(dto, user.id);
  }

  @Get(':eventId')
  findOne(@Param('eventId') eventId: string) {
    return this.events.findById(eventId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':eventId/rulesets')
  publishRuleset(
    @Param('eventId') eventId: string,
    @Body() dto: CreateRulesetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.events.publishRuleset(eventId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':eventId/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Param('eventId') eventId: string, @Body('clanId') clanId: string) {
    return this.events.registerClan(eventId, clanId);
  }

  @Get(':eventId/matches')
  getMatches(@Param('eventId') eventId: string, @Query('status') status?: string) {
    return this.events.getMatches(eventId, status);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':eventId/bracket')
  @HttpCode(HttpStatus.CREATED)
  generateBracket(@Param('eventId') eventId: string) {
    return this.events.generateBracket(eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('super_admin', 'organizer')
  @Patch(':eventId')
  updateEvent(
    @Param('eventId') eventId: string,
    @Body() dto: Partial<CreateEventDto>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.events.update(eventId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('super_admin', 'organizer')
  @Patch(':eventId/status')
  @HttpCode(HttpStatus.OK)
  setStatus(
    @Param('eventId') eventId: string,
    @Body('status') status: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.events.setStatus(eventId, status, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete(':eventId')
  @HttpCode(HttpStatus.OK)
  deleteEvent(@Param('eventId') eventId: string) {
    return this.events.remove(eventId);
  }
}

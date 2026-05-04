import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StreamsService } from './streams.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Streams')
@Controller('streams')
export class StreamsController {
  constructor(private streams: StreamsService) {}

  @Get('live')
  getLive(@Query('eventId') eventId?: string) {
    return this.streams.getLiveStreams(eventId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  createSession(
    @Body() body: { eventId: string; provider: string; embedUrl: string; title: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.streams.createSession({ ...body, hostUserId: user.id });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('sessions/:sessionId')
  updateSession(
    @Param('sessionId') sessionId: string,
    @Body() body: { status?: string; title?: string; endedAt?: string },
  ) {
    return this.streams.updateSession(sessionId, body);
  }
}

import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StandingsService } from './standings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Standings')
@Controller()
export class StandingsController {
  constructor(private standings: StandingsService) {}

  @Get('events/:eventId/standings')
  getStandings(@Param('eventId') eventId: string) {
    return this.standings.getStandings(eventId);
  }

  @Get('events/:eventId/leaderboard')
  getPlayerLeaderboard(@Param('eventId') eventId: string) {
    return this.standings.getPlayerLeaderboard(eventId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('events/:eventId/standings/snapshot')
  snapshot(@Param('eventId') eventId: string) {
    return this.standings.computeAndSnapshot(eventId);
  }
}

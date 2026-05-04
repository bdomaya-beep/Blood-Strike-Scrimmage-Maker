import {
  Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MatchesService, SubmitResultDto, UploadEvidenceDto } from './matches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchesController {
  constructor(private matches: MatchesService) {}

  @Get(':matchId')
  findOne(@Param('matchId') matchId: string) {
    return this.matches.findById(matchId);
  }

  @Post(':matchId/ready-check/start')
  @HttpCode(HttpStatus.CREATED)
  startReadyCheck(@Param('matchId') matchId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.matches.startReadyCheck(matchId, user.id);
  }

  @Post(':matchId/ready-check/confirm')
  @HttpCode(HttpStatus.OK)
  confirmReady(@Param('matchId') matchId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.matches.confirmReady(matchId, user.id);
  }

  @Post(':matchId/results')
  @HttpCode(HttpStatus.CREATED)
  submitResult(
    @Param('matchId') matchId: string,
    @Body() dto: SubmitResultDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.matches.submitResult(matchId, dto, user.id);
  }

  @Post(':matchId/evidence')
  @HttpCode(HttpStatus.CREATED)
  uploadEvidence(
    @Param('matchId') matchId: string,
    @Body() dto: UploadEvidenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.matches.uploadEvidence(matchId, dto, user.id);
  }

  @Post(':matchId/disputes')
  @HttpCode(HttpStatus.CREATED)
  openDispute(
    @Param('matchId') matchId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.matches.openDispute(matchId, reason, user.id);
  }

  @Post(':matchId/disputes/:disputeId/resolve')
  @HttpCode(HttpStatus.OK)
  resolveDispute(
    @Param('matchId') matchId: string,
    @Param('disputeId') disputeId: string,
    @Body() body: { status: 'RESOLVED' | 'DISMISSED'; resolutionNotes: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.matches.resolveDispute(matchId, disputeId, body, user.id);
  }

  @Post(':matchId/verify')
  @HttpCode(HttpStatus.OK)
  verify(@Param('matchId') matchId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.matches.verifyResult(matchId, user.id);
  }

  @Post(':matchId/lock')
  @HttpCode(HttpStatus.OK)
  lock(@Param('matchId') matchId: string) {
    return this.matches.lockMatch(matchId);
  }
}

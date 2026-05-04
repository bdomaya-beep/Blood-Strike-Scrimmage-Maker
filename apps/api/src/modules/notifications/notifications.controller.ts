import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.notifications.list(user.id, +page, +limit);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Post(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  markRead(@Param('notificationId') notificationId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markRead(notificationId, user.id);
  }

  @Post('webhooks/discord/test')
  @HttpCode(HttpStatus.OK)
  testDiscord(@Body('targetId') targetId: string, @Body('content') content: string) {
    return this.notifications.sendDiscordWebhook(targetId, content);
  }
}

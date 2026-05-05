import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ClansModule } from './modules/clans/clans.module';
import { EventsModule } from './modules/events/events.module';
import { MatchesModule } from './modules/matches/matches.module';
import { StandingsModule } from './modules/standings/standings.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StreamsModule } from './modules/streams/streams.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    AuthModule,
    AnnouncementsModule,
    ClansModule,
    EventsModule,
    MatchesModule,
    StandingsModule,
    ModerationModule,
    NotificationsModule,
    StreamsModule,
    UploadsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

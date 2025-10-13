import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramService } from './telegram/telegram.service';
import { ConfigModule } from '@nestjs/config';
import { TrashModule } from './trash/trash.module';
import { AppwriteService } from './appwrite/appwrite.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 30, // 30 requests per minute (general limit)
      },
      {
        name: 'medium',
        ttl: 600000, // 10 minutes
        limit: 100, // 100 requests per 10 minutes
      },
    ]),
    TrashModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TelegramService,
    AppwriteService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

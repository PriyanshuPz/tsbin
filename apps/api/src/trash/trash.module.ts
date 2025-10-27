import { Module } from '@nestjs/common';
import { TrashService } from './trash.service';
import { TrashController } from './trash.controller';
import { AppwriteService } from 'src/appwrite/appwrite.service';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from 'src/telegram/telegram.service';
import { PrismaService } from 'src/service/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [TrashController],
  providers: [TrashService, AppwriteService, TelegramService, PrismaService],
})
export class TrashModule {}

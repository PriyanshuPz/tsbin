import { Module } from '@nestjs/common';
import { TrashService } from './trash.service';
import { TrashController } from './trash.controller';
import { AppwriteService } from 'src/appwrite/appwrite.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [TrashController],
  providers: [TrashService, AppwriteService],
})
export class TrashModule {}

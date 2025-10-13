import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { TelegramService } from './telegram/telegram.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly telegramService: TelegramService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('share')
  async shareText(@Query('message') message: string) {
    if (!message) {
      return { success: false, error: 'Message cannot be empty' };
    }

    const telegramResponse = await this.telegramService.sendMessage(message);

    return {
      success: true,
      telegram: telegramResponse,
    };
  }
}

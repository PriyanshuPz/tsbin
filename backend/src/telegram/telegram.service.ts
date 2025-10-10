import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  constructor(private readonly configService: ConfigService) {}

  async sendMessage(message: string) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    if (!token || !chatId) {
      throw new HttpException(
        'Telegram token or chat ID not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      const response = await axios.post(url, {
        chat_id: chatId,
        text: message,
      });
      return response.data;
    } catch (error) {
      console.error(
        'Telegram API error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to send message to Telegram',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

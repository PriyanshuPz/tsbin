import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { ErrorResponse } from 'src/lib/exception-filter';

@Injectable()
export class TelegramService {
  constructor(private readonly configService: ConfigService) {}

  async sendMessage(message: string) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    if (!token || !chatId) {
      throw new ErrorResponse(
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

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    caption?: string,
  ): Promise<{ message_id: number; chat_id: number; file_id: string }> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    if (!token || !chatId) {
      throw new HttpException(
        'Telegram token or chat ID not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const url = `https://api.telegram.org/bot${token}/sendDocument`;

    try {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('document', fileBuffer, fileName);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await axios.post(url, formData, {
        headers: formData.getHeaders(),
      });

      return {
        message_id: response.data.result.message_id,
        chat_id: response.data.result.chat.id,
        file_id: response.data.result.document.file_id,
      };
    } catch (error) {
      console.error(
        'Telegram file upload error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to upload file to Telegram',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getFile(fileId: string): Promise<Buffer> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      throw new HttpException(
        'Telegram token not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // First get file info
      const fileInfoResponse = await axios.get(
        `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`,
      );

      const filePath = fileInfoResponse.data.result.file_path;

      // Then download the file
      const fileResponse = await axios.get(
        `https://api.telegram.org/file/bot${token}/${filePath}`,
        {
          responseType: 'arraybuffer',
        },
      );

      return Buffer.from(fileResponse.data);
    } catch (error) {
      console.error(
        'Telegram file download error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to download file from Telegram',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getFileStream(fileId: string): Promise<NodeJS.ReadableStream> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      throw new HttpException(
        'Telegram token not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // First get file info
      const fileInfoResponse = await axios.get(
        `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`,
      );

      const filePath = fileInfoResponse.data.result.file_path;

      // Then get the file stream
      const fileResponse = await axios.get(
        `https://api.telegram.org/file/bot${token}/${filePath}`,
        {
          responseType: 'stream',
        },
      );

      return fileResponse.data;
    } catch (error) {
      console.error(
        'Telegram file stream error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to get file stream from Telegram',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

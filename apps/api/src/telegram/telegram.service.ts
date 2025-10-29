import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { ErrorResponse } from 'src/lib/exception-filter';

@Injectable()
export class TelegramService {
  private logger = new Logger(TelegramService.name);
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
      this.logger.log(
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
    const startTime = Date.now();
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      throw new HttpException(
        'Telegram token not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // First get file info with optimized axios config
      const fileInfoStartTime = Date.now();
      this.logger.log(`Getting file info for: ${fileId}`);

      const fileInfoResponse = await axios.get(
        `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            Connection: 'keep-alive',
            'Keep-Alive': 'timeout=5, max=1000',
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        },
      );

      this.logger.log(
        `File info retrieved in: ${Date.now() - fileInfoStartTime}ms`,
      );

      if (!fileInfoResponse.data.ok) {
        throw new Error(
          `Telegram API error: ${fileInfoResponse.data.description}`,
        );
      }

      const filePath = fileInfoResponse.data.result.file_path;
      const fileSize = fileInfoResponse.data.result.file_size;

      this.logger.log(`File path: ${filePath}, Size: ${fileSize} bytes`);

      // Then get the file stream with optimized settings
      const streamStartTime = Date.now();
      this.logger.log(`Starting file stream download`);

      const fileResponse = await axios.get(
        `https://api.telegram.org/file/bot${token}/${filePath}`,
        {
          responseType: 'stream',
          timeout: 30000, // 30 second timeout for download
          headers: {
            Connection: 'keep-alive',
            'Keep-Alive': 'timeout=30, max=1000',
            'Accept-Encoding': 'identity', // Disable compression for streaming
          },
          maxRedirects: 5,
          // Optimize for streaming
          decompress: false,
          // Don't buffer the response
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      this.logger.log(
        `File stream initiated in: ${Date.now() - streamStartTime}ms`,
      );
      this.logger.log(`Total getFileStream time: ${Date.now() - startTime}ms`);

      // Add stream monitoring
      const stream = fileResponse.data;
      let downloadedBytes = 0;
      const downloadStartTime = Date.now();

      stream.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;
      });

      stream.on('end', () => {
        const downloadTime = Date.now() - downloadStartTime;
        const speed = downloadedBytes / (downloadTime / 1000) / 1024; // KB/s
        this.logger.log(
          `Download completed: ${downloadedBytes} bytes in ${downloadTime}ms (${speed.toFixed(2)} KB/s)`,
        );
      });

      stream.on('error', (error: Error) => {
        this.logger.error(`Stream download error: ${error.message}`);
      });

      return stream;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error(
        `getFileStream failed after ${totalTime}ms: ${error.response?.data || error.message}`,
      );

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

  async getFileUrl(fileId: string): Promise<string> {
    const startTime = Date.now();
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      throw new HttpException(
        'Telegram token not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Get file info to get the file path
      const fileInfoStartTime = Date.now();
      this.logger.log(`Getting file info for URL: ${fileId}`);

      const fileInfoResponse = await axios.get(
        `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`,
        {
          timeout: 5000,
          headers: {
            'Cache-Control': 'no-cache',
          },
        },
      );

      this.logger.log(
        `File info for URL retrieved in: ${Date.now() - fileInfoStartTime}ms`,
      );

      if (!fileInfoResponse.data.ok) {
        throw new Error(
          `Telegram API error: ${fileInfoResponse.data.description}`,
        );
      }

      const filePath = fileInfoResponse.data.result.file_path;
      const directUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

      this.logger.log(`Direct URL generated in: ${Date.now() - startTime}ms`);
      return directUrl;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error(
        `getFileUrl failed after ${totalTime}ms: ${error.response?.data || error.message}`,
      );

      throw new HttpException(
        'Failed to get file URL from Telegram',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async proxyFileDownload(fileId: string, res: any): Promise<void> {
    const startTime = Date.now();
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      throw new HttpException(
        'Telegram token not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Get file info quickly
      const fileInfoStartTime = Date.now();
      this.logger.log(`Getting file info for proxy: ${fileId}`);

      const fileInfoResponse = await axios.get(
        `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`,
        {
          timeout: 5000,
        },
      );

      this.logger.log(
        `File info for proxy retrieved in: ${Date.now() - fileInfoStartTime}ms`,
      );

      if (!fileInfoResponse.data.ok) {
        throw new Error(
          `Telegram API error: ${fileInfoResponse.data.description}`,
        );
      }

      const filePath = fileInfoResponse.data.result.file_path;
      const fileSize = fileInfoResponse.data.result.file_size;

      // Set response headers
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="chunk_${fileId}"`,
        'Content-Length': fileSize.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'Accept-Ranges': 'bytes',
      });

      // Create direct stream from Telegram
      const proxyStartTime = Date.now();
      this.logger.log(`Starting proxy stream for file: ${fileId}`);

      const telegramStream = await axios.get(
        `https://api.telegram.org/file/bot${token}/${filePath}`,
        {
          responseType: 'stream',
          timeout: 0, // No timeout for streaming
          headers: {
            'Accept-Encoding': 'identity',
          },
        },
      );

      this.logger.log(
        `Proxy stream initiated in: ${Date.now() - proxyStartTime}ms`,
      );

      // Monitor streaming
      let bytesStreamed = 0;
      const streamStartTime = Date.now();

      telegramStream.data.on('data', (chunk: Buffer) => {
        bytesStreamed += chunk.length;
      });

      telegramStream.data.on('end', () => {
        const totalTime = Date.now() - streamStartTime;
        const speed = bytesStreamed / (totalTime / 1000) / 1024; // KB/s
        this.logger.log(
          `Proxy completed: ${bytesStreamed} bytes in ${totalTime}ms (${speed.toFixed(2)} KB/s)`,
        );
      });

      telegramStream.data.on('error', (error: Error) => {
        this.logger.error(`Proxy stream error: ${error.message}`);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Stream error',
            data: null,
          });
        }
      });

      // Handle client disconnect
      res.on('close', () => {
        this.logger.log('Client disconnected during proxy');
        telegramStream.data.destroy();
      });

      // Pipe Telegram stream directly to response
      telegramStream.data.pipe(res);

      this.logger.log(`Total proxy setup time: ${Date.now() - startTime}ms`);
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error(
        `proxyFileDownload failed after ${totalTime}ms: ${error.response?.data || error.message}`,
      );

      throw new HttpException(
        'Failed to proxy file from Telegram',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

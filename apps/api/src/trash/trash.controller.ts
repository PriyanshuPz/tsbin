import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpException,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { TrashService } from './trash.service';
import { CreateFileTrashDto, CreateTextTrashDto } from './dto/create-trash.dto';
import { type Base } from 'src/lib/utils';
import { TelegramService } from 'src/telegram/telegram.service';

@Controller('trash')
export class TrashController {
  private readonly logger = new Logger(TrashController.name);
  constructor(
    private readonly trashService: TrashService,
    private readonly telegramService: TelegramService,
  ) {}

  @Post('text')
  async createTextTrash(
    @Body() createTextTrashDto: CreateTextTrashDto,
  ): Promise<Base> {
    try {
      const trashId =
        await this.trashService.createTextTrash(createTextTrashDto);
      return {
        success: true,
        data: { trash_id: trashId },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('text')
  async getTextTrashContent(
    @Query('id') id: string,
    @Query('passcode') passcode: string | undefined,
  ): Promise<Base> {
    try {
      this.logger.log(`Fetching text trash content for ID: ${id}`);
      const trashContent = await this.trashService.findTextTrashById(id);

      if (!trashContent) {
        throw new HttpException('Trash not found', 404);
      }

      if (trashContent.trash.encrypted) {
        if (trashContent.trash.passcodeHash != passcode) {
          throw new HttpException('Passcode is incorrect', 403);
        }
      }

      return {
        success: true,
        data: {
          id: trashContent.id,
          enc_trash_text: trashContent.enc_trash_text,
          encryption_type: trashContent.encryption_type,
          text_length: trashContent.text_length,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  @Post('file')
  async createFileTrash(
    @Body() createFileTrashDto: CreateFileTrashDto,
  ): Promise<Base> {
    try {
      const trashId =
        await this.trashService.createFileTrash(createFileTrashDto);
      return {
        success: true,
        data: { trash_id: trashId },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('file')
  async getFileTrashContent(@Query('file_id') id: string): Promise<Base> {
    try {
      const trashContent = await this.trashService.findFileTrashById(id);

      if (!trashContent) {
        throw new HttpException('Trash not found', 404);
      }

      return {
        success: true,
        data: {
          trash_id: trashContent.trashId,
          id: trashContent.id,
          file_ids: trashContent.file_ids,
          trash_type: trashContent.trash.type,
          encrypted: trashContent.trash.encrypted,
          expire_at: trashContent.trash.expireAt,
          message_ids: trashContent.message_ids,
          total_chunks: trashContent.total_chunks,
          total_size: trashContent.file_size,

          file_name: trashContent.original_name,
          mime_type: trashContent.mime_type,
          file_size: trashContent.file_size,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  @Post('chunk')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadFileChunk(
    @UploadedFile() chunk: Express.Multer.File,
    @Body('chunk_index') chunk_index: string,
  ) {
    try {
      if (!chunk) {
        throw new Error('No chunk provided');
      }

      const meta = {
        fileName: chunk.originalname.replaceAll(' ', '_').replaceAll('/', '_'),
        chunkIndex: parseInt(chunk_index, 10),
        fileSize: chunk.size,
      };

      // encryptedChunk.buffer is already a Buffer, no need to convert from base64
      const uploadResult = await this.telegramService.uploadFile(
        chunk.buffer,
        meta.fileName,
        `File chunk ${meta.chunkIndex} of ${meta.fileSize} bytes`,
      );

      return {
        success: true,
        message_id: uploadResult.message_id,
        file_id: uploadResult.file_id,
        chunk_index: meta.chunkIndex,
      };
    } catch (error) {
      console.error('Chunk upload error:', error);
      throw new HttpException(error.message || 'Failed to upload chunk', 500);
    }
  }

  @Get('chunk')
  async streamFileChunks(
    @Query('trash_id') trashId: string,
    @Query('file_id') fileId: string | undefined,
    @Query('passcode') passcode: string | undefined,
    @Res({ passthrough: false }) res: Response,
  ) {
    const startTime = Date.now();

    if (!fileId || !trashId) {
      return res.status(400).json({
        success: false,
        message: 'Missing file_id or trash_id',
        data: null,
      });
    }

    try {
      // Single database lookup for validation
      const dbStartTime = Date.now();
      const trash = await this.trashService.findFileTrashById(trashId);
      this.logger.log(`DB lookup took: ${Date.now() - dbStartTime}ms`);

      if (!trash) {
        return res.status(404).json({
          success: false,
          message: 'Trash not found',
          data: null,
        });
      }

      const trashData = trash.trash;

      // Quick validation checks
      if (trashData.expireAt && new Date(trashData.expireAt) < new Date()) {
        return res.status(410).json({
          success: false,
          message: 'Trash has expired',
          data: null,
        });
      }

      if (trashData.type !== 'FILE') {
        return res.status(400).json({
          success: false,
          message: 'Not a file type',
          data: null,
        });
      }

      // Check encryption and passcode
      if (
        trashData.encrypted &&
        (!passcode || trashData.passcodeHash !== passcode)
      ) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or missing passcode for encrypted file',
          data: null,
        });
      }

      this.logger.log(`Validation completed in: ${Date.now() - startTime}ms`);

      // Proxy the request to Telegram without exposing token
      const proxyStartTime = Date.now();
      await this.telegramService.proxyFileDownload(fileId, res);
      this.logger.log(
        `Proxy setup completed in: ${Date.now() - proxyStartTime}ms`,
      );
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error(
        `Streaming error after ${totalTime}ms: ${error.message}`,
      );
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Failed to stream file',
          data: null,
        });
      }
    }
  }

  // KEEP THIS METHOD LAST:: IT MESSES UP WHOLE LOGIC IT TOOK ME ALOT TO UNDERstand THIS!!!!!

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Base> {
    try {
      const trash = await this.trashService.findTrashById(id);
      return trash;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}

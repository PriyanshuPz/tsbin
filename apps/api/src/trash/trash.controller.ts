import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  HttpException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { TrashService } from './trash.service';
import { CreateTextTrashDto, CreateTrashDto } from './dto/create-trash.dto';
import { type Base } from 'src/lib/utils';
import { TelegramService } from 'src/telegram/telegram.service';

@Controller('trash')
export class TrashController {
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
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for trash creation
  async create(@Body() createTrashDto: CreateTrashDto): Promise<Base> {
    try {
      const trashId = await this.trashService.create(createTrashDto);
      return {
        success: true,
        data: trashId,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Post('chunk')
  @UseInterceptors(FileInterceptor('encryptedChunk'))
  async uploadFileChunk(
    @UploadedFile() encryptedChunk: Express.Multer.File,
    @Body('meta') metaString: string,
  ) {
    try {
      if (!encryptedChunk) {
        throw new Error('No encrypted chunk provided');
      }

      const meta = JSON.parse(metaString);

      // encryptedChunk.buffer is already a Buffer, no need to convert from base64
      const uploadResult = await this.telegramService.uploadFile(
        encryptedChunk.buffer,
        meta.fileName,
        `Encrypted file chunk ${meta.chunkIndex} of ${meta.fileSize} bytes`,
      );

      return {
        success: true,
        message_id: uploadResult.message_id,
        file_id: uploadResult.file_id,
      };
    } catch (error) {
      console.error('Chunk upload error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get()
  findAll(): Base {
    try {
      const trashItems = this.trashService.findAll();
      return {
        success: true,
        data: trashItems,
        message: 'Trash retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Base> {
    try {
      const trash = await this.trashService.findTrashById(id);
      return trash;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get(':slug/chunks')
  async streamFileChunks(
    @Param('slug') slug: string,
    @Query('passcode') passcode: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    // try {
    //   const trash = await this.trashService.findOne(slug);
    //   if (!trash.success) {
    //     res.status(404).json(trash);
    //     return;
    //   }
    //   const trashData = trash.data;
    //   // Check expiration
    //   if (trashData.expires_at && new Date(trashData.expires_at) < new Date()) {
    //     res.status(410).json({
    //       success: false,
    //       message: 'Trash has expired',
    //       data: null,
    //     });
    //     return;
    //   }
    //   const isDefaultPasscode = trashData.passcode_hash === '0000';
    //   // Validate password if needed
    //   if (!isDefaultPasscode) {
    //     if (!passcode) {
    //       res.status(403).json({
    //         success: false,
    //         message: 'Passcode required',
    //         data: null,
    //       });
    //       return;
    //     }
    //     if (hashPasscode(passcode) !== trashData.passcode_hash) {
    //       res.status(403).json({
    //         success: false,
    //         message: 'Invalid passcode',
    //         data: null,
    //       });
    //       return;
    //     }
    //   }
    //   if (trashData.type !== 'file') {
    //     res.status(400).json({
    //       success: false,
    //       message: 'Not a file type',
    //       data: null,
    //     });
    //     return;
    //   }
    //   // For new chunked system - stream chunks by message IDs
    //   if (trashData.files && trashData.files.length > 0) {
    //     // Set headers for streaming
    //     res.setHeader('Content-Type', 'application/octet-stream');
    //     res.setHeader('Transfer-Encoding', 'chunked');
    //     res.setHeader(
    //       'Content-Disposition',
    //       `attachment; filename="${slug}_chunks.bin"`,
    //     );
    //     for (const file of trashData.files) {
    //       if (file.messageIds && file.messageIds.length > 0) {
    //         // Fetch all chunks for this file by getting stored file info
    //         const fullTrash = await this.trashService.findTrashById(slug);
    //         const fileData = JSON.parse(fullTrash.content);
    //         // Find messages for this file - filter by messageIds array
    //         const fileMessages = fileData.files.filter((f: any) =>
    //           file.messageIds.includes(f.message_id),
    //         );
    //         // Sort chunks by message ID to maintain order
    //         fileMessages.sort((a: any, b: any) => a.message_id - b.message_id);
    //         for (const fileMessage of fileMessages) {
    //           try {
    //             const chunkStream = await this.telegramService.getFileStream(
    //               fileMessage.file_id,
    //             );
    //             // Stream the chunk directly to response
    //             await new Promise<void>((resolve, reject) => {
    //               chunkStream.on('data', (chunk) => {
    //                 res.write(chunk);
    //               });
    //               chunkStream.on('end', () => resolve());
    //               chunkStream.on('error', (err) => reject(err));
    //             });
    //           } catch (error) {
    //             console.error(
    //               `Failed to stream chunk ${fileMessage.message_id}:`,
    //               error,
    //             );
    //             res.status(500).json({
    //               success: false,
    //               message: `Failed to stream file chunk`,
    //               data: null,
    //             });
    //             return;
    //           }
    //         }
    //       }
    //     }
    //     res.end();
    //     return;
    //   }
    //   res.status(404).json({
    //     success: false,
    //     message: 'No file data found',
    //     data: null,
    //   });
    // } catch (error) {
    //   console.error('Stream file chunks error:', error);
    //   res.status(500).json({
    //     success: false,
    //     message: 'Failed to stream file chunks',
    //     data: null,
    //   });
    // }
  }

  @Get(':slug/download')
  async downloadTrash(
    @Param('slug') slug: string,
    @Query('passcode') passcode: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    // try {
    //   const trash = await this.trashService.findTrashById(slug);
    //   if (!trash) {
    //     throw new HttpException('Trash not found', 404);
    //   }
    //   // Check expiration
    //   if (trash.expires_at && new Date(trash.expires_at) < new Date()) {
    //     throw new HttpException('Trash has expired', 410);
    //   }
    //   const isDefaultPasscode = trash.passcode_hash === '0000';
    //   // Validate password if needed
    //   if (!isDefaultPasscode) {
    //     if (!passcode) {
    //       throw new HttpException('Passcode required', 403);
    //     }
    //     // TODO: validate passcode against hash
    //     // e.g., if (hashPasscode(passcode) !== trash.passcode_hash) throw error
    //     if (hashPasscode(passcode) !== trash.passcode_hash) {
    //       throw new HttpException('Invalid passcode', 403);
    //     }
    //   }
    //   if (trash.type === 'text') {
    //     // Send text directly
    //     res.setHeader('Content-Type', 'text/plain');
    //     res.send(trash.content);
    //     return;
    //   }
    //   if (trash.type === 'file') {
    //     const fileData = JSON.parse(trash.content).files;
    //     // Set headers for download
    //     res.setHeader(
    //       'Content-Disposition',
    //       `attachment; filename="${slug}.bin"`,
    //     );
    //     res.setHeader('Content-Type', 'application/octet-stream');
    //     // Stream each file chunk sequentially
    //     for (const fileInfo of fileData) {
    //       const stream = await this.telegramService.getFileStream(
    //         fileInfo.file_id,
    //       );
    //       await new Promise<void>((resolve, reject) => {
    //         stream.on('data', (chunk) => res.write(chunk));
    //         stream.on('end', () => resolve());
    //         stream.on('error', (err) => reject(err));
    //       });
    //     }
    //     res.end();
    //     return;
    //   }
    //   throw new HttpException('Unsupported trash type', 400);
    // } catch (error) {
    //   console.error(error);
    //   throw new HttpException('Failed to download trash', 500);
    // }
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { CreateTextTrashDto, CreateTrashDto } from './dto/create-trash.dto';
import { AppwriteService } from 'src/appwrite/appwrite.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { generateId, id } from 'src/lib/utils';
import { ErrorResponse } from 'src/lib/exception-filter';
import { PrismaService } from 'src/service/prisma.service';

@Injectable()
export class TrashService {
  constructor(
    private readonly appwriteService: AppwriteService,
    private readonly telegramService: TelegramService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(createTrashDto: CreateTrashDto) {
    const {
      type,
      encryptedContent,
      encryptedFiles,
      meta,
      passcodeHash,
      expireAt,
    } = createTrashDto;

    if (type === 'text') {
      // return this.createTextTrash({
      //   encryptedContent,
      //   meta,
      //   passcodeHash,
      //   expireAt,
      // });
    } else if (type === 'file') {
      return this.createFileTrash({
        encryptedFiles,
        passcodeHash,
        expireAt,
      });
    } else {
      throw new Error('Unsupported trash type');
    }
  }

  async createTextTrash({
    enc_trash_text,
    encryption_metadata,
    text_length,
    expire_at,
  }: CreateTextTrashDto) {
    if (!enc_trash_text || !encryption_metadata || !text_length) {
      throw new Error(
        'Missing required fields: enc_trash_text, encryption_metadata, text_length',
      );
    }

    const slug = generateId('ts');

    try {
      await this.prismaService.trash.create({
        data: {
          id: id('ts'),
          slug,
          type: 'TEXT',
          encrypted: encryption_metadata.passcode_hash !== '0000',
          passcodeHash: encryption_metadata.passcode_hash,
          expireAt: expire_at,
          textTrash: {
            create: {
              id: id('txt'),
              enc_trash_text,
              text_length,
              encryption_type: encryption_metadata.encryption_type,
            },
          },
        },
      });

      return slug;
    } catch (error) {
      throw new ErrorResponse(
        `DB: Failed to create text trash - ${error.message}`,
        500,
      );
    }
  }

  private async createFileTrash({
    encryptedFiles,
    passcodeHash,
    expireAt,
  }: {
    encryptedFiles?: Array<{
      encryptedContent?: string;
      meta: any;
      messageIds?: number[];
      fileIds?: string[];
    }>;
    passcodeHash: string;
    expireAt?: Date;
  }) {
    if (!encryptedFiles || encryptedFiles.length === 0) {
      throw new Error('encryptedFiles is required for file type');
    }

    const slug = generateId('ts');
    let totalSize = 0;
    let fileMetadata: Array<{
      message_id: number;
      meta: any;
      file_id: string;
      originalSize: number;
    }> = [];

    try {
      // Handle new chunked system (with messageIds)
      if (encryptedFiles[0].messageIds) {
        // For chunked files, we already have message IDs from the chunk uploads
        for (const encryptedFile of encryptedFiles) {
          const { meta, messageIds, fileIds } = encryptedFile;

          if (messageIds && messageIds.length > 0) {
            // Add each chunk as a file entry
            for (let i = 0; i < messageIds.length; i++) {
              const messageId = messageIds[i];
              const file_id = fileIds ? fileIds[i] : '';
              fileMetadata.push({
                message_id: messageId,
                meta: meta,
                originalSize: meta.fileSize,
                file_id,
              });
            }
            totalSize += meta.fileSize;
          }
        }
      }
      // Handle legacy system (with encryptedContent)
      else {
        for (const encryptedFile of encryptedFiles) {
          const { encryptedContent, meta } = encryptedFile;

          if (!encryptedContent) {
            throw new Error(
              'encryptedContent is required for legacy file type',
            );
          }

          // Convert base64 encrypted content back to buffer for Telegram
          const fileBuffer = Buffer.from(encryptedContent, 'base64');
          totalSize += fileBuffer.length;

          // Upload to Telegram with original filename
          const uploadResult = await this.telegramService.uploadFile(
            fileBuffer,
            meta.fileName,
            `Encrypted file: ${meta.fileName} (Size: ${meta.fileSize} bytes)`,
          );

          fileMetadata.push({
            message_id: uploadResult.message_id,
            file_id: uploadResult.file_id,
            meta: meta,
            originalSize: meta.fileSize,
          });
        }
      }

      // Store file metadata in database
      const data = {
        type: 'file',
        content: JSON.stringify({
          files: fileMetadata,
        }),
        encryption_meta: JSON.stringify({
          algorithm: 'AES-GCM',
          fileCount: encryptedFiles.length,
        }),
        passcode_hash: passcodeHash,
        encrypted: passcodeHash !== '0000',
        slug,
        views: 0,
        expires_at: expireAt || null,
        size: totalSize,
        message_ids: fileMetadata.map((f) => f.message_id),
        chat_id: '',
      };

      const rec = await this.appwriteService.getDb().createRow({
        rowId: slug,
        data: data,
        databaseId: this.appwriteService.getDatabaseId(),
        tableId: 'trash',
      });

      return rec.slug;
    } catch (error) {
      throw new ErrorResponse(
        `BAAS: Failed to create file trash - ${error.message}`,
        500,
      );
    }
  }

  findAll() {
    return {
      message: `Not implemented yet`,
      data: [],
    };
  }

  async findOne(id: string) {
    try {
      const trash = await this.prismaService.trash.findUnique({
        where: { slug: id },
      });

      return {
        success: true,
        data: trash,
        message: 'Trash retrieved successfully',
      };
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to retrieve trash', 500);
    }
  }

  async findTrashById(id: string) {
    try {
      const trash = await this.prismaService.trash.findUnique({
        where: { slug: id },
        select: {
          badReport: true,
          createdAt: true,
          encrypted: true,
          expireAt: true,
          id: true,
          slug: true,
          type: true,
          fileTrash: {
            select: {
              id: true,
            },
          },
          textTrash: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!trash) {
        throw new Error('Trash not found');
      }

      let objId: string | null = null;

      const { fileTrash, textTrash, ...rest } = trash;
      if (trash.type === 'FILE' && fileTrash) {
        objId = fileTrash.id;
      } else if (trash.type === 'TEXT' && textTrash) {
        objId = textTrash.id;
      }

      return {
        success: true,
        data: {
          ...rest,
          objectId: objId,
        },
        message: 'Trash retrieved successfully',
      };
    } catch (error) {
      throw new ErrorResponse(
        `DB: Failed to find trash by ID - ${error.message}`,
        500,
      );
    }
  }

  async findTextTrashById(id: string) {
    try {
      const textTrash = await this.prismaService.textTrash.findUnique({
        where: {
          id,
        },
        include: {
          trash: true,
        },
      });

      return textTrash;
    } catch (error) {
      throw new ErrorResponse(
        `DB: Failed to find text trash by ID - ${error.message}`,
        500,
      );
    }
  }
}

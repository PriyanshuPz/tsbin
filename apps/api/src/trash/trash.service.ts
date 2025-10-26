import { HttpException, Injectable } from '@nestjs/common';
import { CreateTrashDto } from './dto/create-trash.dto';
import { UpdateTrashDto } from './dto/update-trash.dto';
import { AppwriteService } from 'src/appwrite/appwrite.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { generateId } from 'src/lib/utils';
import { ErrorResponse } from 'src/lib/exception-filter';

@Injectable()
export class TrashService {
  constructor(
    private readonly appwriteService: AppwriteService,
    private readonly telegramService: TelegramService,
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
      return this.createTextTrash({
        encryptedContent,
        meta,
        passcodeHash,
        expireAt,
      });
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

  private async createTextTrash({
    encryptedContent,
    meta,
    passcodeHash,
    expireAt,
  }: {
    encryptedContent?: string;
    meta?: any;
    passcodeHash: string;
    expireAt?: Date;
  }) {
    if (!encryptedContent || !passcodeHash) {
      throw new Error(
        'Missing required fields: encryptedContent, meta, passcodeHash',
      );
    }

    const slug = generateId('ts');

    const data = {
      type: 'text',
      content: encryptedContent,
      encryption_meta: JSON.stringify(meta || {}),
      passcode_hash: passcodeHash,
      encrypted: passcodeHash !== '0000',
      slug,
      views: 0,
      expires_at: expireAt || null,
      size: encryptedContent.length,
      message_ids: [], // Not used for text
      chat_id: '', // Not used for text
    };

    try {
      const rec = await this.appwriteService.getDb().createRow({
        rowId: slug,
        data: data,
        databaseId: this.appwriteService.getDatabaseId(),
        tableId: 'trash',
      });
      return rec.slug;
    } catch (error) {
      console.log(error);
      throw new ErrorResponse(
        `BAAS: Failed to create text trash - ${error.message}`,
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

  async findOne(slug: string) {
    try {
      const rows = await this.appwriteService.getDb().getRow({
        databaseId: this.appwriteService.getDatabaseId(),
        tableId: 'trash',
        rowId: slug,
      });

      const trash = rows;

      // Increment view count
      await this.appwriteService.getDb().updateRow({
        databaseId: this.appwriteService.getDatabaseId(),
        tableId: 'trash',
        rowId: trash.$id,
        data: { views: trash.views + 1 },
      });

      if (trash.expires_at && new Date(trash.expires_at) < new Date()) {
        throw new HttpException('Trash has expired', 410);
      }

      const isDefaultPasscode = !trash.encrypted; // adjust if using hash
      const sizeThreshold = 10 * 1024 * 1024; // 10 MB
      const sendContent =
        trash.type === 'text' &&
        (isDefaultPasscode || trash.size <= sizeThreshold);

      const result: any = {
        id: trash.$id,
        slug: trash.slug,
        type: trash.type,
        encrypted: trash.encrypted,
        passcode_hash: trash.passcode_hash,
        views: trash.views + 1,
        expires_at: trash.expires_at,
        size: trash.size,
        created_at: trash.$createdAt,
        sendContent,
      };

      if (sendContent && trash.type === 'text') {
        result.content = trash.content;
        result.encryption_meta = trash.encryption_meta
          ? JSON.parse(trash.encryption_meta)
          : null;
      }

      // For file type, group message IDs by file for chunked system
      if (trash.type === 'file') {
        result.encryption_meta = trash.encryption_meta
          ? JSON.parse(trash.encryption_meta)
          : null;

        const fileData = JSON.parse(trash.content);

        if (fileData.files && Array.isArray(fileData.files)) {
          // Group chunks by file name
          const fileGroups = new Map();

          for (const fileInfo of fileData.files) {
            const fileName = fileInfo.meta.fileName;
            if (!fileGroups.has(fileName)) {
              fileGroups.set(fileName, {
                meta: fileInfo.meta,
                messageIds: [],
                fileIds: [],
              });
            }
            fileGroups.get(fileName).messageIds.push(fileInfo.message_id);
            fileGroups.get(fileName).fileIds.push(fileInfo.file_id);
          }

          // Convert to array
          result.files = Array.from(fileGroups.values());
        }
      }

      return {
        success: true,
        data: result,
        message: 'Trash retrieved successfully',
      };
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to retrieve trash', 500);
    }
  }

  update(id: number, updateTrashDto: UpdateTrashDto) {
    return `This action updates a #${id} trash`;
  }

  remove(id: number) {
    return `This action removes a #${id} trash`;
  }

  async findTrashById(id: string) {
    try {
      const trash = await this.appwriteService.getDb().getRow({
        databaseId: this.appwriteService.getDatabaseId(),
        tableId: 'trash',
        rowId: id,
      });
      return trash;
    } catch (error) {
      throw new ErrorResponse(
        `BAAS: Failed to find trash by ID - ${error.message}`,
        500,
      );
    }
  }
}

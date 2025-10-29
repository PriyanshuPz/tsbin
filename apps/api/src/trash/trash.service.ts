import { HttpException, Injectable, Logger } from '@nestjs/common';
import { CreateFileTrashDto, CreateTextTrashDto } from './dto/create-trash.dto';
import { generateId, id } from 'src/lib/utils';
import { ErrorResponse } from 'src/lib/exception-filter';
import { PrismaService } from 'src/service/prisma.service';

@Injectable()
export class TrashService {
  private readonly logger = new Logger(TrashService.name);
  constructor(private readonly prismaService: PrismaService) {}

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

  async createFileTrash({
    encryption_metadata,
    file_ids,
    message_ids,
  }: CreateFileTrashDto) {
    if (!encryption_metadata || !file_ids || file_ids.length === 0) {
      throw new Error('Missing required fields: encryption_metadata, file_ids');
    }

    const slug = generateId('ts');

    try {
      const trash = await this.prismaService.trash.create({
        data: {
          id: id('ts'),
          slug,
          type: 'FILE',
          encrypted: encryption_metadata.passcode_hash !== '0000',
          passcodeHash: encryption_metadata.passcode_hash,
          expireAt: encryption_metadata.expire_at,
          fileTrash: {
            create: {
              id: id('ft'),
              file_ids,
              file_size: encryption_metadata.original_size,
              total_chunks: encryption_metadata.total_chunks,
              chunk_size: encryption_metadata.chunk_size,
              encryption_type: encryption_metadata.encryption_type,
              message_ids,
              original_name: encryption_metadata.filename,
              mime_type:
                encryption_metadata.mime_type || 'application/octet-stream',
            },
          },
        },
      });

      if (!trash) {
        throw new Error('Trash creation failed');
      }

      return slug;
    } catch (error) {
      this.logger.error(`Error creating file trash: ${error}`);
      throw new ErrorResponse(
        `DB: Failed to create file trash - ${error.message}`,
        500,
      );
    }
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
      this.logger.error(`Error finding trash by ID: ${error}`);
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
      this.logger.error(`Error finding text trash by ID: ${id} - ${error}`);
      throw new ErrorResponse(error, 500);
    }
  }

  async findFileTrashById(id: string) {
    try {
      const fileTrash = await this.prismaService.fileTrash.findUnique({
        where: {
          id,
        },
        include: {
          trash: true,
        },
      });

      return fileTrash;
    } catch (error) {
      this.logger.error(`Error finding file trash by ID: ${id} - ${error}`);
      throw new ErrorResponse(error, 500);
    }
  }
}

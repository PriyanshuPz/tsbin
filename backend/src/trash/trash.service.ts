import { HttpException, Injectable } from '@nestjs/common';
import { CreateTrashDto } from './dto/create-trash.dto';
import { UpdateTrashDto } from './dto/update-trash.dto';
import { AppwriteService } from 'src/appwrite/appwrite.service';
import { generateId } from 'src/lib/utils';

@Injectable()
export class TrashService {
  constructor(private readonly appwriteService: AppwriteService) {}

  async create(createTrashDto: CreateTrashDto) {
    const { type, encryptedContent, meta, passcodeHash, expireAt } =
      createTrashDto;

    if (type !== 'text') {
      throw new Error('Only text type is supported for now.');
    }

    if (!encryptedContent || !meta || !passcodeHash) {
      throw new Error(
        'Missing required fields: encryptedContent, meta, passcodeHash',
      );
    }

    const slug = generateId('ts');

    const data = {
      type,
      content: encryptedContent,
      encryption_meta: JSON.stringify(meta),
      passcode_hash: passcodeHash,
      encrypted: passcodeHash !== '0000',
      slug,
      views: 0,
      expires_at: expireAt || null,
      size: encryptedContent.length,
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
      throw new HttpException('Failed to create trash', 500);
    }
  }

  findAll() {
    return `This action returns all trash`;
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

      return {
        id: trash.$id,
        slug: trash.slug,
        type: trash.type,
        content: trash.content,
        encryption_meta: trash.encryption_meta
          ? JSON.parse(trash.encryption_meta)
          : null,
        encrypted: trash.encrypted,
        passcode_hash: trash.passcode_hash,
        views: trash.views + 1,
        expires_at: trash.expires_at,
        size: trash.size,
        created_at: trash.$createdAt,
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
}

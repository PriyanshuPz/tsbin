export type TrashType = 'text' | 'file';

export class Trash {
  message_ids: string; // For files, this can store multiple message IDs as JSON
  type: TrashType;
  chat_id: string;
  content?: string; // For text content or file metadata
  encrypted: boolean;
  encryption_meta: string; // JSON string containing encryption metadata
  size: number;
  slug: string;
  views: number;
  created_ip: string;
  expireAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

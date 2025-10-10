export type TrashType = 'text' | 'image' | 'video' | 'audio' | 'document';

export class Trash {
  message_ids: string;
  type: TrashType;
  chat_id: string;
  content?: string;
  encrypted: boolean;
  encryption_meta: string;
  size: number;
  slug: string;
  views: number;
  created_ip: string;
  expireAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

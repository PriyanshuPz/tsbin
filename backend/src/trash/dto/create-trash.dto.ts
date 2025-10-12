import { TrashType } from '../entities/trash.entity';

export class CreateTrashDto {
  type: TrashType;

  // For text-based trash
  encryptedContent?: string;

  // For files - array of encrypted file objects
  encryptedFiles?: Array<{
    encryptedContent: string;
    meta: {
      iv: string;
      algorithm: string;
      fileName: string;
      fileSize: number;
      fileType: string;
    };
  }>;

  // Metadata from client-side encryption (for text)
  meta?: {
    iv: string;
    algorithm: string;
  };

  // SHA-256 or similar hash of passcode (never the real one)
  passcodeHash: string;

  // Optional metadata
  expireAt?: Date;
}

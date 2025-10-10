import { TrashType } from '../entities/trash.entity';

export class CreateTrashDto {
  type: TrashType;

  // For text-based trash
  encryptedContent?: string;

  // For files (array of encrypted chunks)
  encryptedChunks?: string[];

  // Metadata from client-side encryption
  meta: {
    iv: string;
    salt: string;
    algorithm: string;
  };

  // SHA-256 or similar hash of passcode (never the real one)
  passcodeHash: string;

  // Optional metadata
  fileName?: string;
  fileSize?: number;
  expireAt?: Date;
}

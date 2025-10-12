import { SITE_CONFIG } from "./constants";
import {
  encryptText,
  hashPasscode,
  decryptText,
  encryptFile,
  decryptFile,
} from "./encryption";

export async function sendTrash(data: {
  type: "text" | "file";
  textContent?: string;
  files?: File[];
  passcode?: string;
  expireAt?: Date;
}) {
  const passcode = data.passcode || "0000";

  let encryptedContent: string | undefined = undefined;
  let meta: any = undefined;
  let encryptedFiles: Array<{
    encryptedContent: string;
    meta: any;
  }> = [];

  if (data.type === "text") {
    if (!data.textContent) {
      throw new Error("textContent is required for text type");
    }
    const encrypted = await encryptText(data.textContent, passcode);
    encryptedContent = encrypted.encryptedContent;
    meta = encrypted.meta;
  }

  if (data.type === "file") {
    if (!data.files || data.files.length === 0) {
      throw new Error("files are required for file type");
    }

    // Check file size limits before processing
    for (const file of data.files) {
      if (file.size > 20 * 1024 * 1024) {
        throw new Error(
          `File "${file.name}" is too large. Maximum size is 20MB per file.`
        );
      }
    }

    const totalSize = data.files.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 30 * 1024 * 1024) {
      throw new Error("Total file size cannot exceed 30MB.");
    }

    // Encrypt each file with error handling
    for (const file of data.files) {
      try {
        const encrypted = await encryptFile(file, passcode);
        encryptedFiles.push({
          encryptedContent: encrypted.encryptedContent,
          meta: encrypted.meta,
        });
      } catch (error) {
        console.error(`Failed to encrypt file ${file.name}:`, error);
        throw new Error(
          `Failed to encrypt file "${file.name}". File may be too large or corrupted.`
        );
      }
    }
  }
  const passcodeHash = await hashPasscode(passcode);
  console.log("Passcode Hash:", passcodeHash);
  console.log("pass", passcode);
  const payload: any = {
    type: data.type,
    passcodeHash,
    expireAt: data.expireAt?.toISOString() || null,
  };

  if (data.type === "text") {
    payload.encryptedContent = encryptedContent;
    payload.meta = meta;
  }

  if (data.type === "file") {
    payload.encryptedFiles = encryptedFiles;
  }

  const response = await fetch(`${SITE_CONFIG.API_URL}/trash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const retryMessage = retryAfter
      ? `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
      : "Rate limit exceeded. Please wait a moment before trying again.";

    return {
      success: false,
      message: retryMessage,
      data: null,
    };
  }

  return result;
  // { success: boolean, data: <id>, message: string }
}

export async function getTrash(id: string) {
  const response = await fetch(`${SITE_CONFIG.API_URL}/trash/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const result = await response.json();

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const retryMessage = retryAfter
      ? `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
      : "Rate limit exceeded. Please wait a moment before trying again.";

    return {
      success: false,
      message: retryMessage,
      data: null,
    };
  }

  return result;
}

export async function decryptTrashContent(
  encryptedContent: string,
  meta: any,
  passcode: string
) {
  try {
    const decryptedText = await decryptText(encryptedContent, meta, passcode);
    return { success: true, content: decryptedText };
  } catch (error) {
    return { success: false, error: "Invalid passcode or corrupted data" };
  }
}

export async function decryptTrashFile(
  encryptedContent: string,
  meta: any,
  passcode: string
) {
  try {
    const decryptedFile = await decryptFile(encryptedContent, meta, passcode);
    return { success: true, file: decryptedFile };
  } catch (error) {
    return { success: false, error: "Invalid passcode or corrupted data" };
  }
}

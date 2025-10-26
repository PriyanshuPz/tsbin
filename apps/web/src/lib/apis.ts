import init, { Encryptor } from "tsbin-wasm";

import { SITE_CONFIG } from "./constants";
import { hashPasscode } from "./encryption";

export async function sendTrash(data: {
  type: "text" | "file";
  textContent?: string;
  files?: File[];
  passcode?: string;
  expireAt?: Date;
  onProgress?: (progress: number) => void;
}) {
  await init();
  const passcode = data.passcode || "0000";

  let encryptedContent: string | undefined = undefined;
  let meta: any = undefined;

  const encryptor = new Encryptor(passcode);

  if (data.type === "text") {
    if (!data.textContent) {
      throw new Error("textContent is required for text type");
    }
    // text to U8Array
    const textEncoder = new TextEncoder();
    const dataU8 = textEncoder.encode(data.textContent);

    const encrypted = encryptor.encrypt(dataU8);

    // Uint8Array<ArrayBufferLike> to base64
    encryptedContent = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  if (data.type === "file") {
    if (!data.files || data.files.length === 0) {
      throw new Error("files are required for file type");
    }

    const res = await sendLargeFileTrash(
      data.files[0],
      passcode,
      data.expireAt,
      data.onProgress
    );
    // Encrypt each file with error handling
    for (const file of data.files) {
      try {
        console.log(`File ${file.name} uploaded with Trash ID: ${res.data}`);
      } catch (error) {
        console.error(`Failed to encrypt file ${file.name}:`, error);
        throw new Error(
          `Failed to encrypt file "${file.name}". File may be too large or corrupted.`
        );
      }
    }
    return {
      success: true,
      data: res.data,
      message: "Files uploaded successfully",
    };
  }
  const passcodeHash = await hashPasscode(passcode);
  const payload: any = {
    type: data.type,
    passcodeHash,
    expireAt: data.expireAt?.toISOString() || null,
  };

  if (data.type === "text") {
    payload.encryptedContent = encryptedContent;
    payload.meta = meta;
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

export async function sendLargeFileTrash(
  file: File,
  passcode: string,
  expireAt?: Date,
  onProgress?: (progress: number) => void
) {
  await init();
  const encryptor = new Encryptor(passcode);
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

  const reader = file.stream().getReader();
  const messageIds: number[] = [];
  const fileIds: string[] = [];
  let chunkIndex = 0;
  let totalUploaded = 0;

  let buffer = new Uint8Array(CHUNK_SIZE);
  let bufferOffset = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    let offset = 0;
    while (offset < value.length) {
      const toCopy = Math.min(value.length - offset, CHUNK_SIZE - bufferOffset);
      buffer.set(value.slice(offset, offset + toCopy), bufferOffset);
      bufferOffset += toCopy;
      offset += toCopy;

      if (bufferOffset === CHUNK_SIZE) {
        const encryptedChunk = encryptor.encrypt(buffer);
        const chunkMeta = {
          fileName: file.name,
          fileSize: file.size,
          chunkIndex,
        };

        // Convert WASM output to standard Uint8Array for blob compatibility
        const encryptedData = new Uint8Array(encryptedChunk);

        // Create FormData to send binary data directly
        const formData = new FormData();
        formData.append("encryptedChunk", new Blob([encryptedData]));
        formData.append("meta", JSON.stringify(chunkMeta));

        // POST the chunk to server; server uploads to Telegram
        const res = await fetch(`${SITE_CONFIG.API_URL}/trash/chunk`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        messageIds.push(data.message_id);
        fileIds.push(data.file_id);

        // Update progress
        totalUploaded += CHUNK_SIZE;
        const progress = Math.min((totalUploaded / file.size) * 100, 100);
        onProgress?.(progress);

        chunkIndex++;
        bufferOffset = 0;
      }
    }
  }

  // Final partial chunk
  if (bufferOffset > 0) {
    const lastChunk = buffer.slice(0, bufferOffset);
    const encryptedChunk = encryptor.encrypt(lastChunk);
    const chunkMeta = { fileName: file.name, fileSize: file.size, chunkIndex };

    // Convert WASM output to standard Uint8Array for blob compatibility
    const encryptedData = new Uint8Array(encryptedChunk);

    // Create FormData to send binary data directly
    const formData = new FormData();
    formData.append("encryptedChunk", new Blob([encryptedData]));
    formData.append("meta", JSON.stringify(chunkMeta));

    const res = await fetch(`${SITE_CONFIG.API_URL}/trash/chunk`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    messageIds.push(data.message_id);
    fileIds.push(data.file_id);
    // Final progress update
    onProgress?.(100);
  }

  // All chunks uploaded — now create Trash record in Appwrite
  const passcodeHash = await hashPasscode(passcode);
  const payload = {
    type: "file",
    passcodeHash,
    expireAt: expireAt?.toISOString() || null,
    encryptedFiles: [
      {
        meta: { fileName: file.name, fileSize: file.size },
        messageIds,
        fileIds,
      },
    ],
  };

  const response = await fetch(`${SITE_CONFIG.API_URL}/trash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const trashResult = await response.json();
  return trashResult;
}

export async function fetchTrash(slug: string) {
  const res = await fetch(`${SITE_CONFIG.API_URL}/trash/${slug}`);
  if (!res.ok) throw new Error(`Failed to fetch trash: ${res.statusText}`);
  return res.json();
}

/**
 * Handles text decryption or file download decisions
 */
export async function handleTrashAccess(
  trash: any,
  passcode?: string,
  onProgress?: (progress: number) => void
) {
  const isDefaultPasscode = trash.passcode_hash === "0000";
  const isPasswordProtected = !isDefaultPasscode;
  const isLargeFile = trash.type === "file" && trash.size > 10 * 1024 * 1024; // 10MB threshold

  if (trash.type === "text") {
    // Text case
    if (isPasswordProtected && !passcode) {
      return { action: "promptPassword" };
    }

    const textPasscode = passcode || "0000";

    const decrypted = await decryptTrashContent(trash.content, textPasscode);
    if (!decrypted.success) {
      return { action: "error", error: decrypted.error };
    }
    return { action: "showText", content: decrypted.content };
  }

  if (trash.type === "file") {
    if (isPasswordProtected && !passcode) {
      return { action: "promptPassword" };
    }

    const filePasscode = passcode || "0000";

    if (!isLargeFile) {
      // Small file: fetch and decrypt content inline
      try {
        const decryptedFiles = await fetchAndDecryptFiles(
          trash,
          filePasscode,
          onProgress
        );
        if (!decryptedFiles.success) {
          return { action: "error", error: decryptedFiles.error };
        }
        return { action: "showFiles", files: decryptedFiles.files };
      } catch (error) {
        console.error("Error decrypting files:", error);
        return { action: "error", error: "Failed to decrypt files" };
      }
    } else {
      // Large file: only provide download URL
      const url = `${SITE_CONFIG.API_URL}/trash/${trash.slug}/download${
        isPasswordProtected ? `?passcode=${filePasscode}` : ""
      }`;
      return { action: "download", url };
    }
  }

  return { action: "error", error: "Unsupported trash type" };
}

/**
 * Fallback function to fetch file via download endpoint
 */
async function fetchViaDownloadEndpoint(
  trash: any,
  passcode: string,
  onProgress?: (progress: number) => void
) {
  await init();
  const encryptor = new Encryptor(passcode);

  try {
    onProgress?.(20);

    const url = `${SITE_CONFIG.API_URL}/trash/${trash.slug}/download${
      passcode !== "0000" ? `?passcode=${passcode}` : ""
    }`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    onProgress?.(50);

    const encryptedData = await response.arrayBuffer();
    const encryptedChunk = new Uint8Array(encryptedData);

    onProgress?.(80);

    const decryptedData = encryptor.decrypt(encryptedChunk);
    const decryptedBytes = new Uint8Array(decryptedData);

    const mimeType =
      trash.files?.[0]?.meta?.mimeType || "application/octet-stream";
    const blob = new Blob([decryptedBytes], { type: mimeType });

    onProgress?.(100);

    return { success: true, files: [blob] };
  } catch (error) {
    console.error("Download endpoint fallback error:", error);
    return {
      success: false,
      error: "Failed to download file via fallback method",
    };
  }
}

/**
 * Fetch and decrypt files for both old and new systems
 */
export async function fetchAndDecryptFiles(
  trash: any,
  passcode: string,
  onProgress?: (progress: number) => void
) {
  await init();
  const encryptor = new Encryptor(passcode);

  try {
    // Check if this is new chunked system (has files with messageIds)
    if (trash.files && trash.files.length > 0 && trash.files[0].messageIds) {
      onProgress?.(10); // Starting download

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        // New chunked system - fetch chunks as stream from backend
        const chunksResponse = await fetch(
          `${SITE_CONFIG.API_URL}/trash/${trash.slug}/chunks${
            passcode !== "0000" ? `?passcode=${passcode}` : ""
          }`,
          {
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);
        onProgress?.(30); // Request sent

        if (!chunksResponse.ok) {
          // If it's not a streaming response, try to get error message
          try {
            const errorData = await chunksResponse.json();
            return {
              success: false,
              error: errorData.message || "Failed to fetch file chunks",
            };
          } catch {
            throw new Error("Failed to fetch file chunks");
          }
        }

        onProgress?.(50); // Response received

        // Read the streaming response as ArrayBuffer
        const encryptedData = await chunksResponse.arrayBuffer();
        const encryptedChunk = new Uint8Array(encryptedData);

        onProgress?.(70); // Data downloaded

        try {
          // Decrypt the combined chunks
          const decryptedData = encryptor.decrypt(encryptedChunk);
          const decryptedBytes = new Uint8Array(decryptedData);

          onProgress?.(90); // Decryption complete

          // For now, treat the entire decrypted stream as one file
          // You may need to modify this based on your file structure
          const mimeType =
            trash.files[0]?.meta?.mimeType || "application/octet-stream";

          const blob = new Blob([decryptedBytes], { type: mimeType });

          onProgress?.(100); // Complete

          return { success: true, files: [blob] };
        } catch (decryptError) {
          console.error("Decryption error:", decryptError);
          return { success: false, error: "Failed to decrypt file data" };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          // Timeout - fallback to download endpoint for files < 5MB
          if (trash.size && trash.size < 5 * 1024 * 1024) {
            onProgress?.(0);
            console.warn(
              "Streaming timeout, falling back to download endpoint"
            );
            return await fetchViaDownloadEndpoint(trash, passcode, onProgress);
          }
          return {
            success: false,
            error: "Request timeout - file download took too long",
          };
        }
        throw fetchError;
      }
    }

    // Legacy system - use encryptedContent directly
    else if (trash.encryptedFiles && trash.encryptedFiles.length > 0) {
      const decryptedFiles: Blob[] = [];

      for (const f of trash.encryptedFiles) {
        const result = await decryptFile(f.encryptedContent, f.meta, passcode);
        if (!result.success) {
          return { success: false, error: result.error };
        }
        if (result.file) {
          decryptedFiles.push(result.file);
        }
      }

      return { success: true, files: decryptedFiles };
    }

    return { success: false, error: "No file data found" };
  } catch (error) {
    console.error("Decrypt files error:", error);
    return { success: false, error: "Failed to decrypt files" };
  }
}

/**
 * Decrypt text (for text type)
 */
export async function decryptTrashContent(
  encryptedContent: string,
  passcode: string
) {
  try {
    await init();
    const rawContent = Uint8Array.from(atob(encryptedContent), (c) =>
      c.charCodeAt(0)
    );
    const encryptor = new Encryptor(passcode);
    const decryptedU8 = encryptor.decrypt(rawContent);
    const decoder = new TextDecoder();
    return { success: true, content: decoder.decode(decryptedU8) };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Invalid passcode or corrupted data" };
  }
}

export async function decryptFile(
  encryptedContent: string,
  meta: any,
  passcode: string
) {
  try {
    await init();
    const encryptor = new Encryptor(passcode);
    console.log("Starting decryption of file...");
    console.log("Encrypted content length:", encryptedContent);
    // Base64 -> Uint8Array
    const rawData = Uint8Array.from(atob(encryptedContent), (c) =>
      c.charCodeAt(0)
    );

    // Decrypt whole data at once (WASM handles chunks internally)
    const decryptedBytesFromWasm = encryptor.decrypt(rawData);

    // Convert to proper Uint8Array so Blob accepts it
    const decryptedBytes = new Uint8Array(decryptedBytesFromWasm);
    // Convert to Blob
    const blob = new Blob([decryptedBytes], {
      type: meta.mimeType || "application/octet-stream",
    });

    return { success: true, file: blob };
  } catch (e) {
    console.error("Decryption error:", e);
    return { success: false, error: "Invalid passcode or corrupted data" };
  }
}

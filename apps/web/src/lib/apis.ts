import init, { TsbinController, Encryptor, UploadProgress } from "tsbin-wasm";
import { SITE_CONFIG } from "./constants";

export async function sendTrash(data: {
  type: "text" | "file";
  textContent?: string;
  files?: File[];
  passcode?: string;
  expireAt?: Date;
  onProgress?: (progress: number) => void;
}) {
  try {
    await init();
    const passcode = data.passcode || "0000";

    let trashId: string | undefined = undefined;

    const ts = new TsbinController(SITE_CONFIG.API_URL, "");

    if (data.type === "text") {
      if (!data.textContent) {
        throw new Error("textContent is required for text type");
      }
      trashId = await ts.encrypt_text(data.textContent, passcode);
    }

    if (data.type === "file") {
      if (!data.files || data.files.length === 0) {
        throw new Error("files are required for file type");
      }
      const file = data.files[0];

      const onProgress = (progress: UploadProgress) => {
        console.log("Upload progress:", progress);
      };

      trashId = await ts.encrypt_file(file, passcode, undefined, onProgress);
    }

    return {
      success: true,
      data: trashId,
    };
  } catch (error) {
    console.error("sendTrash error:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to send trash",
    };
  }
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

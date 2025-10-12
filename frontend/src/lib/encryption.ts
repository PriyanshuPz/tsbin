// Utility to convert string ↔ ArrayBuffer
export function str2ab(str: string) {
  return new TextEncoder().encode(str);
}

export function ab2b64(buf: ArrayBuffer) {
  // Modern browsers support FileReader for more efficient conversion
  // But we'll keep the chunked approach for broader compatibility
  const bytes = new Uint8Array(buf);
  const chunkSize = 0x8000; // 32KB chunks
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

// Alternative method for very large files (experimental)
export async function ab2b64Large(buf: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buf]);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function b642ab(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function deriveKey(passcode: string) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("tsbin_salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(text: string, passcode: string) {
  const key = await deriveKey(passcode);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    str2ab(text)
  );
  return {
    encryptedContent: ab2b64(encryptedBuffer),
    meta: {
      iv: ab2b64(iv.buffer),
      algorithm: "AES-GCM",
    },
  };
}

export async function hashPasscode(passcode: string) {
  if (passcode === "") return "0000"; // Special case for empty passcode
  if (passcode === "0000") return "0000"; // Special case for default passcode
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(passcode)
  );
  return ab2b64(hashBuffer);
}

export async function decryptText(
  encryptedContent: string,
  meta: { iv: string; algorithm: string },
  passcode: string
) {
  const key = await deriveKey(passcode);
  const iv = b642ab(meta.iv);
  const encryptedBuffer = b642ab(encryptedContent);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// File encryption utilities
export async function encryptFile(file: File, passcode: string) {
  console.log(
    `Encrypting file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
  );

  const key = await deriveKey(passcode);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  try {
    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    console.log(`File buffer created: ${fileBuffer.byteLength} bytes`);

    // Encrypt the file content
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      fileBuffer
    );
    console.log(`File encrypted: ${encryptedBuffer.byteLength} bytes`);

    // Convert to base64 with chunking for large files
    const encryptedContent = ab2b64(encryptedBuffer);
    console.log(
      `Base64 conversion complete: ${encryptedContent.length} characters`
    );

    return {
      encryptedContent,
      meta: {
        iv: ab2b64(iv.buffer),
        algorithm: "AES-GCM",
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    };
  } catch (error) {
    console.error(`Encryption failed for ${file.name}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to encrypt file ${file.name}: ${errorMessage}`);
  }
}
export async function decryptFile(
  encryptedContent: string,
  meta: {
    iv: string;
    algorithm: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  },
  passcode: string
) {
  const key = await deriveKey(passcode);
  const iv = b642ab(meta.iv);
  const encryptedBuffer = b642ab(encryptedContent);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedBuffer
  );

  // Create a blob with the decrypted content and original file type
  const blob = new Blob([decryptedBuffer], { type: meta.fileType });
  return new File([blob], meta.fileName, { type: meta.fileType });
}

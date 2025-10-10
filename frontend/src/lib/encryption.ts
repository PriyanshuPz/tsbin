// Utility to convert string ↔ ArrayBuffer
export function str2ab(str: string) {
  return new TextEncoder().encode(str);
}
export function ab2b64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
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

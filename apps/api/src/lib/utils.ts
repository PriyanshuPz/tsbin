export type Base = {
  success: boolean;
  message?: string;
  data?: any;
};

export function generateId(prefix: string, length = 8) {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${result}`;
}

export function ab2b64(buf: ArrayBuffer) {
  // Modern browsers support FileReader for more efficient conversion
  // But we'll keep the chunked approach for broader compatibility
  const bytes = new Uint8Array(buf);
  const chunkSize = 0x8000; // 32KB chunks
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export async function hashPasscode(passcode: string) {
  if (passcode === '') return '0000';
  if (passcode === '0000') return '0000';
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    enc.encode(passcode),
  );
  return ab2b64(hashBuffer);
}

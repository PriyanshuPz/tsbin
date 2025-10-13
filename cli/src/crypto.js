// src/crypto.js
import crypto from "crypto";
import fs from "fs";

/**
 * Encrypts a file and writes an encrypted blob with the format:
 * [iv (12 bytes)] [authTag (16 bytes)] [ciphertext]
 *
 * Plaintext layout before encryption:
 * [filenameLen (2 bytes BE)] [filename UTF-8 bytes] [file bytes...]
 *
 * Returns the iv (hex) for logging if you want, but it's not required later.
 */
export async function encryptFile(inputPath, outputPath, passphrase) {
  const filename = inputPath.split(/[\\/]/).pop();
  const fileBuffer = fs.readFileSync(inputPath);

  // Build plaintext: 2 bytes filename length + filename bytes + file content
  const fnameBuf = Buffer.from(filename, "utf8");
  if (fnameBuf.length > 0xffff) throw new Error("Filename too long");
  const metaLenBuf = Buffer.allocUnsafe(2);
  metaLenBuf.writeUInt16BE(fnameBuf.length, 0);

  const plaintext = Buffer.concat([metaLenBuf, fnameBuf, fileBuffer]);

  // Derive 32-byte key
  const key = crypto.createHash("sha256").update(String(passphrase), "utf8").digest();

  const iv = crypto.randomBytes(12); // GCM recommended IV
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });

  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Write iv + authTag + ciphertext
  const outBuf = Buffer.concat([iv, authTag, ciphertext]);
  fs.writeFileSync(outputPath, outBuf);

  return iv.toString("hex");
}

/**
 * Decrypts an encrypted file (written by encryptFile), recovers the filename,
 * writes recovered file to downloads/<original filename>, and returns that path.
 *
 * Expects the encrypted file content format: [iv][authTag][ciphertext]
 *
 * Returns { outputPath, originalName }.
 */
export async function decryptFile(inputPath, outputDir, passphrase) {
  const buf = fs.readFileSync(inputPath);
  if (buf.length < 12 + 16 + 1) throw new Error("Encrypted file too small / invalid");

  const iv = buf.slice(0, 12);
  const authTag = buf.slice(12, 28);
  const ciphertext = buf.slice(28);

  const key = crypto.createHash("sha256").update(String(passphrase), "utf8").digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  // Read filename length and filename:
  const nameLen = plaintext.readUInt16BE(0);
  const nameBuf = plaintext.slice(2, 2 + nameLen);
  const originalName = nameBuf.toString("utf8");
  const fileContent = plaintext.slice(2 + nameLen);

  // Ensure output dir exists
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = `${outputDir}/${originalName}`;
  fs.writeFileSync(outputPath, fileContent);

  return { outputPath, originalName, iv: iv.toString("hex") };
}

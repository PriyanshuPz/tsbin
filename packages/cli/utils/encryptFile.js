import crypto from "crypto";
import fs from "fs";

export function encryptFile(inputPath, passcode, outputPath) {
  // Generate 32-byte key from passcode
  const key = crypto.createHash("sha256").update(passcode).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on("finish", () => {
      resolve(iv.toString("hex")); // Return IV (needed for decryption)
    });
    output.on("error", reject);
  });
}

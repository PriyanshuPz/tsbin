// import crypto from "crypto";
// import fs from "fs";

// export function encryptFile(inputPath, passcode, outputPath) {
//   // Generate 32-byte key from passcode
//   const key = crypto.createHash("sha256").update(passcode).digest();
//   const iv = crypto.randomBytes(16);

//   const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

//   const input = fs.createReadStream(inputPath);
//   const output = fs.createWriteStream(outputPath);

//   input.pipe(cipher).pipe(output);

//   return new Promise((resolve, reject) => {
//     output.on("finish", () => {
//       resolve(iv.toString("hex")); // Return IV (needed for decryption)
//     });
//     output.on("error", reject);
//   });
// }


// utils/encryptFile.js
import crypto from "crypto";
import fs from "fs";

/**
 * Encrypts a file and returns the encrypted buffer.
 * The IV is prepended to the ciphertext for easy decryption.
 * 
 * @param {string} inputPath - Path to the input file.
 * @param {string} passcode - Encryption passcode.
 * @returns {Buffer} Encrypted data buffer (IV + ciphertext)
 */
export function encryptFile(inputPath, passcode) {
  const key = crypto.createHash("sha256").update(passcode).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  // Read file into buffer
  const fileData = fs.readFileSync(inputPath);

  // Encrypt the data
  const encrypted = Buffer.concat([cipher.update(fileData), cipher.final()]);

  // Prepend IV to ciphertext for decryption
  return Buffer.concat([iv, encrypted]);
}

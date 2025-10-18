// src/download.js
import fs from "fs";
import path from "path";
import axios from "axios";
import crypto from "crypto";

/**
 * Decrypts data encrypted with AES-256-CBC where the IV is prepended to ciphertext.
 */
function decryptBuffer(encryptedBuffer, passcode) {
  const key = crypto.createHash("sha256").update(passcode).digest();
  const iv = encryptedBuffer.subarray(0, 16);
  const ciphertext = encryptedBuffer.subarray(16);

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted;
}

/**
 * Downloads and decrypts a file from the tsbin API.
 */
export async function downloadFile(fileId, passcode) {
  try {
    console.log("📥 Fetching from tsbin API...");
    const res = await axios.get(`https://api.tsbin.tech/v1/trash/${fileId}`);

    const trash = res.data?.data;
    if (!trash) {
      console.error("❌ No data returned from API.");
      return;
    }

    // ✅ The API may store files in `trash.encryptedFiles[0].encryptedContent`
    const encFile = trash.encryptedFiles?.[0];
    if (!encFile?.encryptedContent) {
      console.error("❌ No encrypted content found.");
      return;
    }

    const encryptedBuffer = Buffer.from(encFile.encryptedContent, "base64");

    console.log("🔓 Decrypting file...");
    const decrypted = decryptBuffer(encryptedBuffer, passcode);

    // Save to downloads directory
    const fileName = encFile.meta?.fileName || "downloaded_file.bin";
    const saveDir = path.join("cli", "downloads");
    fs.mkdirSync(saveDir, { recursive: true });

    const savePath = path.join(saveDir, fileName);
    fs.writeFileSync(savePath, decrypted);

    console.log(`✅ Download complete! Saved to ${savePath}`);
  } catch (err) {
    console.error("❌ Download error:", err.response?.data || err.message);
  }
}

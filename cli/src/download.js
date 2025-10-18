// src/download.js
import fs from "fs";
import path from "path";
import axios from "axios";
import crypto from "crypto";

function decryptBuffer(encryptedBuffer, passcode) {
  const key = crypto.createHash("sha256").update(passcode).digest();
  const iv = encryptedBuffer.subarray(0, 16);
  const ciphertext = encryptedBuffer.subarray(16);

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export async function downloadFile(fileId, passcode) {
  try {
    console.log("Fetching from tsbin API...");
    const res = await axios.get(`https://api.tsbin.tech/v1/trash/${fileId}`);
    const trash = res.data?.data;

    if (!trash) {
      console.error("No data returned from API.");
      return;
    }

    // Detect possible content locations
    let encBase64;
    let meta;

    if (trash.encryptedContent) {
      encBase64 = trash.encryptedContent;
      meta = trash.meta || {};
    } else if (trash.encryptedFiles?.[0]?.encryptedContent) {
      encBase64 = trash.encryptedFiles[0].encryptedContent;
      meta = trash.encryptedFiles[0].meta || {};
    }

    if (!encBase64) {
      console.error("No encrypted content found.");
      return;
    }

    console.log("Decrypting file...");
    const encryptedBuffer = Buffer.from(encBase64, "base64");
    const decrypted = decryptBuffer(encryptedBuffer, passcode);

    const fileName = meta.fileName || `${fileId}.bin`;
    const saveDir = path.join("cli", "downloads");
    fs.mkdirSync(saveDir, { recursive: true });

    const savePath = path.join(saveDir, fileName);
    fs.writeFileSync(savePath, decrypted);

    console.log(`Download complete! Saved to ${savePath}`);
  } catch (err) {
    console.error("Download error:", err.response?.data || err.message);
  }
}

// src/download.js
import path from "path";
import fs from "fs";
import { telegramDownload } from "./telegramDownload.js";
import { decryptFile } from "./crypto.js";

export async function downloadFile(fileId, passcode) {
  const downloadsDir = "./downloads";

  try {
    console.log("📥 Downloading encrypted file...");
    const tempEncryptedPath = await telegramDownload(fileId, downloadsDir);

    console.log("🔓 Decrypting and restoring original filename...");

    let outputPath, originalName, iv;

    try {
      // Try decrypting the file
      const result = await decryptFile(tempEncryptedPath, downloadsDir, passcode);
      outputPath = result.outputPath;
      originalName = result.originalName;
      iv = result.iv;
    } catch (decryptErr) {
      // If decryption fails, don't leave garbage files
      if (fs.existsSync(tempEncryptedPath)) {
        fs.unlinkSync(tempEncryptedPath);
      }
      throw new Error("Wrong passcode or corrupted file — decryption failed.");
    }

    // Remove the temporary encrypted file after successful decryption
    try {
      fs.unlinkSync(tempEncryptedPath);
      console.log(`🧹 Removed temporary encrypted file: ${tempEncryptedPath}`);
    } catch (e) {
      console.warn("⚠️ Could not delete temporary file:", e.message);
    }

    console.log(`✅ Decrypted successfully: ${outputPath}`);
    console.log(`🧩 IV used (hex): ${iv}`);
  } catch (err) {
    console.error("❌ Download/decrypt failed:", err.message);

    // Cleanup in case partial decrypted file exists
    const possibleFile = path.join("./downloads", "output.txt");
    if (fs.existsSync(possibleFile)) {
      try {
        fs.unlinkSync(possibleFile);
      } catch {}
    }
  }
}

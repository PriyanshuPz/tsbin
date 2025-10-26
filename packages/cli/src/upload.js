// src/upload.js
import path from "path";
import fs from "fs";
import { encryptFile } from "./crypto.js";
import { telegramUpload } from "./telegramUpload.js";

export async function uploadFile(filePath, passcode) {
  const fileName = path.basename(filePath);
  const tmpEnc = path.join("./", `${fileName}.tsbin.enc`);

  try {
    console.log(`🔐 Encrypting ${fileName}...`);
    const ivHex = await encryptFile(filePath, tmpEnc, passcode);

    console.log("📤 Uploading to Telegram...");
    const fileId = await telegramUpload(tmpEnc);

    // remove local encrypted temporary
    fs.unlinkSync(tmpEnc);
    console.log("✅ Uploaded successfully!");
    console.log(`📎 File ID: ${fileId}`);
    // optional: print iv for user reference (not required)
    console.log(`🧩 IV (hex, for debugging only): ${ivHex}`);
    return { fileId, iv: ivHex };
  } catch (err) {
    if (fs.existsSync(tmpEnc)) try { fs.unlinkSync(tmpEnc); } catch {}
    throw err;
  }
}

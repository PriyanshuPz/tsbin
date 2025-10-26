// src/telegramDownload.js
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  // will surface an error where used
}

export async function telegramDownload(fileId, outputDir = "./downloads") {
  if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN missing in .env");

  // 1) get file_path
  const infoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
  const resInfo = await axios.get(infoUrl);
  if (!resInfo.data?.ok) throw new Error("Failed to get file info from Telegram");
  const filePath = resInfo.data.result.file_path;

  // 2) ensure output dir
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Use a safe temp filename (we will recover original inside decrypt)
  const tempName = `file_${Date.now()}.enc`;
  const outPath = path.join(outputDir, tempName);

  // 3) download file bytes
  const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
  const dl = await axios.get(fileUrl, { responseType: "arraybuffer", maxBodyLength: Infinity, maxContentLength: Infinity });
  fs.writeFileSync(outPath, Buffer.from(dl.data));

  console.log(`📥 File downloaded: ${outPath}`);
  return outPath;
}

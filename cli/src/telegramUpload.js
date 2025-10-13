// src/telegramUpload.js
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  // We won't throw here so the CLI can print a clean message if misconfigured
}

/**
 * Uploads an encrypted file (binary blob) to Telegram.
 * Returns the file_id (string).
 */
export async function telegramUpload(filePath) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in .env");
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;

  const form = new FormData();
  form.append("chat_id", TELEGRAM_CHAT_ID);
  // Set the filename you want Telegram to store — but we don't rely on it.
  form.append("document", fs.createReadStream(filePath), {
    filename: filePath.split(/[\\/]/).pop(),
  });

  const res = await axios.post(url, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  if (!res.data?.ok) throw new Error("Telegram upload failed");
  return res.data.result.document.file_id;
}

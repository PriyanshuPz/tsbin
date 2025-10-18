import crypto from "crypto";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

export async function sendSnippet(text, passcode) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in .env");
    process.exit(1);
  }

  console.log("Encrypting snippet...");

  // --- AES-256-CBC encryption ---
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(passcode).digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(text, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Embed IV at the beginning of the encrypted payload
  const payload = Buffer.concat([iv, encrypted]).toString("base64");

  // --- Telegram message ---
  const message = [
    " *Encrypted Snippet*",
    "",
    `*Data:* \`${payload}\``,
    `*Passcode:* \`${passcode}\``,
    "",
    "Decrypt using:",
    `\`npx tsbin decrypt-snippet --data <above-data> --passcode ${passcode}\``,
  ].join("\n");

  console.log("Sending encrypted snippet to Telegram...");

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "Markdown",
  };

  try {
    const response = await axios.post(url, body);

    if (response.data.ok) {
      console.log("Snippet sent successfully!");
    } else {
      console.error("Failed to send snippet:", response.data);
    }
  } catch (err) {
    console.error("Telegram API error:", err.message);
  }
}

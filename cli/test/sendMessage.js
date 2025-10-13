import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

async function sendMessage() {
  const message = "Hello from tsbin CLI 🚀";
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const res = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });
    console.log("✅ Message sent successfully:", res.data);
  } catch (error) {
    console.error("❌ Error sending message:", error.response?.data || error.message);
  }
}

sendMessage();

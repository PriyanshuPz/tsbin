// cli/src/decrypt-snippet.js
import axios from "axios";
import crypto from "crypto";
import chalk from "chalk";

/**
 * AES-GCM decryption
 */
function decryptText(encryptedContent, meta, passcode) {
  const iv = Buffer.from(meta.iv, "base64");
  const salt = Buffer.from(meta.salt, "base64");
  const authTag = Buffer.from(meta.authTag, "base64");

  const key = crypto.pbkdf2Sync(passcode, salt, 100000, 32, "sha256");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedContent, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Fetch snippet from API and decrypt
 */
export async function decryptSnippet(id, passcode) {
  console.log(chalk.cyan("Fetching snippet data..."));

  try {
    const res = await axios.get(`https://api.tsbin.tech/v1/trash/${id}`);
    const data = res.data.data || res.data; // handle both formats

    if (!data || !data.content) {
      throw new Error("No content found for this snippet ID.");
    }

    const encryptedContent = data.content;
    const meta =
      typeof data.encryption_meta === "string"
        ? JSON.parse(data.encryption_meta)
        : data.encryption_meta;

    console.log(chalk.cyan("Decrypting snippet..."));
    const decrypted = decryptText(encryptedContent, meta, passcode);

    console.log(chalk.green("Decryption successful!"));
    console.log(chalk.yellow("\nDecrypted Snippet:\n───────────────────────────────"));
    console.log(decrypted);
    console.log("───────────────────────────────");
  } catch (error) {
    console.error(
      chalk.red("Failed to decrypt snippet:"),
      error.response?.data?.message || error.message
    );
  }
}

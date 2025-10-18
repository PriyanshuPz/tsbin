// src/snippet.js
import crypto from "crypto";
import axios from "axios";
import chalk from "chalk";

/**
 * Encrypts and uploads a text snippet to the tsbin API
 */
export async function sendSnippet(text, passcode) {
  try {
    console.log(chalk.cyan("Encrypting snippet..."));

    // --- AES-GCM encryption ---
    const iv = crypto.randomBytes(12);
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(passcode, salt, 100000, 32, "sha256");
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag().toString("base64");

    // Passcode hash
    const passcodeHash = crypto.createHash("sha256").update(passcode).digest("hex");

    console.log(chalk.cyan("Uploading encrypted snippet to tsbin API..."));

    const response = await axios.post("https://api.tsbin.tech/v1/trash", {
      type: "text",
      encryptedContent: encrypted,
      meta: {
        iv: iv.toString("base64"),
        salt: salt.toString("base64"),
        authTag,
        algorithm: "AES-GCM",
      },
      passcodeHash,
      expireAt: null,
    });

    if (response.data.success) {
      console.log(chalk.green("Snippet uploaded successfully!"));
      console.log(chalk.yellow(`Share ID: ${response.data.data}`));
      console.log(chalk.cyan(`Use this to decrypt:`));
      console.log(
        `npx tsbin decrypt-snippet --id ${response.data.data} --passcode ${passcode}`
      );
    } else {
      console.error(chalk.red("Failed to create snippet:"), response.data);
    }
  } catch (error) {
    console.error(
      chalk.red("Error uploading snippet:"),
      error.response?.data || error.message
    );
  }
}

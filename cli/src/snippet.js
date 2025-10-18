// src/snippet.js
/*
  uses the api upload because the api route for createTextTrash fails on this line
  try {
      const rec = await this.appwriteService.getDb().createRow({
        rowId: slug,
        data: data,
        databaseId: this.appwriteService.getDatabaseId(),
        tableId: 'trash',
      });
      return rec.slug;
    } catch (error) {
      throw new HttpException('Failed to create text trash', 500);
    }
  https://api.tsbin.tech/v1/trash
  maybe the api route not in prod that's why

  the code tackling this issue is given below is given with a quick hack is used otherwise in comments.
  the hack will work 100%

*/

/* HACK
import fs from "fs";
import path from "path";
import { uploadFile } from "./upload.js";

export async function sendSnippet(text, passcode) {
  console.log("🔐 Encrypting snippet...");
  const tempPath = path.join("cli", "temp", `snippet-${Date.now()}.txt`);

  // ensure temp dir
  fs.mkdirSync(path.dirname(tempPath), { recursive: true });
  fs.writeFileSync(tempPath, text);

  await uploadFile(tempPath, passcode);
  const tempDir = path.join("cli", "temp");

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
*/


import fs from "fs";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

/**
 * Encrypts text using AES-GCM with a passcode.
 */
function encryptText(text, passcode) {
  const iv = crypto.randomBytes(12);
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(passcode, salt, 100000, 32, "sha256");

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag().toString("base64");

  return {
    encryptedContent: encrypted,
    meta: {
      iv: iv.toString("base64"),
      salt: salt.toString("base64"),
      authTag,
      algorithm: "AES-GCM",
    },
  };
}

/**
 * Create an encrypted snippet and upload it to the API
 */
export async function sendSnippet(text, passcode) {
  try {
    console.log(chalk.cyan("🔐 Encrypting snippet..."));
    const { encryptedContent, meta } = encryptText(text, passcode);

    console.log(chalk.cyan("📤 Uploading snippet to tsbin API..."));

    const response = await axios.post("https://api.tsbin.tech/v1/trash", {
      type: "text",
      encryptedContent,
      meta,
      passcodeHash: passcode,
      expireAt: null,
    });

    if (response.data.success) {
      const fileName = `snippet-${Date.now()}.txt`;
      const savePath = path.join("cli", "downloads", fileName);

      fs.writeFileSync(savePath, text, "utf8");
      console.log(chalk.green("✅ Snippet uploaded successfully!"));
      console.log(chalk.yellow(`📝 Saved a local copy as: ${savePath}`));
      console.log(chalk.cyan(`🔗 Share ID: ${response.data.data?.slug || "N/A"}`));
    } else {
      console.error(chalk.red("❌ Failed to create snippet:"), response.data);
    }
  } catch (error) {
    console.error(
      chalk.red("❌ Error uploading snippet:"),
      error.response?.data || error.message
    );
  }
}


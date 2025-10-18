#!/usr/bin/env node
import { Command } from "commander";
import { uploadFile } from "../src/upload.js";
import { downloadFile } from "../src/download.js";
import { sendSnippet } from "../src/snippet.js";
import { decryptSnippet } from "../src/decryptSnippet.js";

import dotenv from "dotenv";
dotenv.config();

const program = new Command();

program
  .name("tsbin")
  .description("Temporary, encrypted file-sharing CLI")
  .version("0.1.0");

// program
//   .command("upload")
//   .argument("<path>", "file path to upload")
//   .option("--passcode <passcode>", "encryption passcode", "1234")
//   .action(async (filePath, options) => {
//     await uploadFile(filePath, options.passcode);
//   });

// program
//   .command("download")
//   .argument("<file-id>", "Telegram file ID")
//   .requiredOption("--passcode <passcode>", "Decryption passcode")
//   .action(async (fileId, options) => {
//     await downloadFile(fileId, options.passcode);
//   });

// program
//   .command("snippet")
//   .argument("<text>", "text snippet to encrypt")
//   .option("--passcode <passcode>", "encryption passcode", "1234")
//   .action(async (text, opts) => {
//     await sendSnippet(text, opts.passcode);
//   });

program
  .command("upload <path>")
  .option("--passcode <code>", "encryption passcode")
  .action(async (path, options) => {
    await uploadFile(path, options.passcode);
  });

program
  .command("download <fileId>")
  .option("--passcode <code>", "decryption passcode")
  .action(async (id, options) => {
    await downloadFile(id, options.passcode);
  });

program
  .command("snippet <text>")
  .option("--passcode <code>", "encryption passcode")
  .action(async (text, options) => {
    await sendSnippet(text, options.passcode);
  });

program
  .command("decrypt-snippet")
  .description("Decrypt an encrypted snippet with passcode")
  .requiredOption("--data <data>", "Base64 encoded snippet data")
  .requiredOption("--passcode <passcode>", "Passcode used for encryption")
  .action(async (opts) => {
    await decryptSnippet(opts.data, opts.passcode);
  });

  /**
 * DECRYPT SNIPPET
 */
program
  .command("decrypt-snippet")
  .requiredOption("--data <data>", "Base64 encoded snippet data")
  .requiredOption("--passcode <passcode>", "Decryption passcode")
  .description("Decrypt an encrypted snippet with the given passcode")
  .action(async (opts) => {
    await decryptSnippet(opts.data, opts.passcode);
  });

/**
 * LIST ALL TRASH ITEMS (GET /v1/trash)
 */
program
  .command("list")
  .description("List all available trash items from the API")
  .action(async () => {
    console.log(chalk.cyan("📥 Fetching all items from tsbin API..."));
    try {
      const res = await axios.get("https://api.tsbin.tech/v1/trash");
      if (res.data.success && Array.isArray(res.data.data)) {
        const items = res.data.data;
        console.log(chalk.green(`✅ Found ${items.length} item(s):\n`));
        for (const item of items) {
          console.log(
            chalk.yellow(`🆔 ${item.slug}`),
            chalk.white(`| Type:`),
            chalk.cyan(item.type),
            chalk.white(`| Size:`),
            chalk.magenta(item.size || "N/A"),
            chalk.white(`| Views:`),
            chalk.blue(item.views || 0)
          );
        }
      } else {
        console.error(chalk.red("❌ No items found or API returned empty data."));
      }
    } catch (err) {
      console.error(
        chalk.red("⚠️ Error fetching list:"),
        err.response?.data || err.message
      );
    }
  });

/**
 * GET SINGLE TRASH ITEM (GET /v1/trash/:slug)
 */
program
  .command("get")
  .argument("<slug>", "The unique ID of the item (e.g., ts_jWHPRVsv)")
  .description("Fetch and display a single trash item from the API")
  .action(async (slug) => {
    console.log(chalk.cyan(`🔍 Fetching item: ${slug}...`));
    try {
      const res = await axios.get(`https://api.tsbin.tech/v1/trash/${slug}`);
      if (res.data.success && res.data.data) {
        const item = res.data.data;
        console.log(chalk.green("✅ Item found:\n"));
        console.log(chalk.yellow("🆔 ID:"), item.slug);
        console.log(chalk.cyan("📄 Type:"), item.type);
        console.log(chalk.white("📏 Size:"), item.size || "N/A");
        console.log(chalk.white("👀 Views:"), item.views || 0);
        console.log(chalk.white("⏰ Expires:"), item.expires_at || "Never");
        console.log(chalk.white("🔒 Encrypted:"), item.encrypted ? "Yes" : "No");
        if (item.type === "text") {
          console.log(chalk.white("\n🧾 Encrypted Content:\n"));
          console.log(chalk.gray(item.content));
        }
      } else {
        console.error(chalk.red("❌ Item not found or invalid response."));
      }
    } catch (err) {
      console.error(
        chalk.red("⚠️ Error fetching item:"),
        err.response?.data || err.message
      );
    }
  });

program.parse();

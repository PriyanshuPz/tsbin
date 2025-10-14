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



program.parse();

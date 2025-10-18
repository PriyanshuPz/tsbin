// src/upload.js
import fs from "fs";
import crypto from "crypto";
import axios from "axios";
import { encryptFile } from "../utils/encryptFile.js";

export async function uploadFile(filePath, passcode) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      return;
    }

    const fileName = filePath.split(/[\\/]/).pop();
    const fileSize = fs.statSync(filePath).size;

    console.log("Encrypting file...");
    const encryptedBuffer = encryptFile(filePath, passcode); // returns Buffer
    const tempEnc = `${filePath}.enc`;
    fs.writeFileSync(tempEnc, encryptedBuffer); // write to disk

    const ivHex = encryptedBuffer.slice(0, 16).toString("hex"); // extract IV from start
    const encryptedContentBase64 = encryptedBuffer.toString("base64");
    const passcodeHash = crypto.createHash("sha256").update(passcode).digest("hex");

    const payload = {
      type: "file",
      encryptedFiles: [
        {
          encryptedContent: encryptedContentBase64,
          meta: { fileName, fileSize, iv: ivHex },
        },
      ],
      passcodeHash,
      expireAt: null,
    };

    console.log("Uploading to tsbin API...");
    const response = await axios.post("https://api.tsbin.tech/v1/trash", payload, {
      headers: { "Content-Type": "application/json" },
      maxBodyLength: Infinity,
    });

    if (response.data.success) {
      console.log("Upload successful!");
      console.log("Response:", response.data);
    } else {
      console.error("Upload failed:", response.data);
    }

    // clean up temp encrypted file
    fs.unlinkSync(tempEnc);
  } catch (error) {
    console.error("Upload error:", error.response?.data || error.message);
  }
}
/*
Cuurently of no use but if snippet route added in https://api.tsbin.tech/v1/trash 
then can be used for
Decrypt base64 snippet text (if ever used directly) — so kept

*/



import crypto from "crypto";

/**
 * Decrypts AES-256-CBC encrypted snippet with embedded IV
 */
export async function decryptSnippet(dataBase64, passcode) {
  try {
    console.log("Decrypting snippet...");

    const data = Buffer.from(dataBase64, "base64");

    if (data.length <= 16) throw new Error("Invalid data: too short");

    const iv = data.subarray(0, 16);
    const encrypted = data.subarray(16);

    const key = crypto.createHash("sha256").update(passcode).digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");

    console.log("\nDecrypted snippet:");
    console.log("───────────────────────────────");
    console.log(decrypted);
    console.log("───────────────────────────────");
  } catch (err) {
    console.error("Failed to decrypt snippet:", err.message);
  }
}

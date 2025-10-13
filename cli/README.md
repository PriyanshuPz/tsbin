# 🧰 tsbin — Temporary Encrypted File & Snippet Sharing CLI

**tsbin** is a secure, temporary, encrypted file & text snippet sharing CLI tool.  
It allows users to upload files or encrypted snippets to **Telegram** for fast and private sharing —  
with **all encryption and decryption happening locally** using `AES-256-CBC`.

---

## ⚙️ Features

- 🔐 **AES-256-CBC encryption (client-side only)**  
- 📤 **Upload encrypted files to Telegram**  
- 📥 **Download and decrypt using a passcode**  
- 🧩 **Encrypt and share text snippets directly**  
- 🧹 **No sensitive data stored locally**  
- ❌ **Wrong passcode detection** — prevents corrupted output  

---

## 🧾 Directory Structure

```
cli/
├── bin/
│   └── tsbin.js
├── downloads/
│   └── a.txt
├── src/
│   ├── crypto.js
│   ├── decryptSnippet.js
│   ├── download.js
│   ├── snippet.js
│   ├── telegramDownload.js
│   ├── telegramUpload.js
│   └── upload.js
├── test/
│   ├── a.txt
│   └── sendMessage.js
├── utils/
│   └── encryptFile.js
├── .env
├── .env.example
├── .tsbin_meta.json
├── package-lock.json
├── package.json
├── README.md
└── snippet-1760282723291.enc
```


---

## 🤖 Creating a Telegram Bot (Setup Guide)

If you don’t already have a Telegram bot and chat ID, follow these quick steps:

### 🪄 Step 1: Create a Bot with BotFather

- Open Telegram and search for @BotFather.

- Type /start and then /newbot.

- Choose a name and a unique username (e.g., tsbin_secure_bot).

- BotFather will reply with:
Done! Congratulations on your new bot.
Use this token to access the HTTP API:
1234567890:ABCDEF-Your-Bot-Token


```Copy that token — this is your TELEGRAM_BOT_TOKEN.```

## 📬 Step 2: Get Your Chat ID

### To find your TELEGRAM_CHAT_ID:

- Start a chat with your bot (send it any message, like “Hello”).

- Open your browser and go to:
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates


- Look for something like:
"chat": { "id": 987654321, "first_name": "John", ... }


→ Use the "id" value (e.g., 987654321) as TELEGRAM_CHAT_ID.

## ⚡ Setup

1. **Install dependencies**
  ```bash
  npm install
  ```
## .env File Example
```
  TELEGRAM_BOT_TOKEN=<your-bot-token>
  TELEGRAM_CHAT_ID=<your-chat-id>
```
## Make Executable
Make the CLI entry point globally runnable (useful for development/testing):
```
chmod +x ./bin/tsbin.js
```

---
## 🚀 Usage

All commands are executed via `npx tsbin <command>`.

### 🗂 Upload a File

Encrypts the file locally and uploads the resulting `.enc` file to Telegram.

```bash
npx tsbin upload ./test/a.txt --passcode mySecret
```
Output Example:

```bash
🔐 Encrypting a.txt...
📤 Uploading to Telegram...
✅ Uploaded successfully!
📎 File ID: BQACAgUAAxkDAAMVaOvO-MrUEkAXeDsswHH-A-fJGsAAAocZAAK1w2FXL0_3MG_0v1o2BA
🧩 IV (hex, for debugging only): 5af8b6c91f4e42b593ca3ef2

```
### 📥 Download and Decrypt

Downloads the encrypted file using the <file-id> and decrypts it locally.

```bash
npx tsbin download <file-id> --passcode mySecret
```

Output Example:

```bash
📥 Downloading encrypted file...
📥 File downloaded: downloads\file_1760284659172.enc
🔓 Decrypting and restoring original filename...
🧹 Removed temporary encrypted file: downloads\file_1760284659172.enc
✅ Decrypted successfully: ./downloads/a.txt
🧩 IV used (hex): 5af8b6c91f4e42b593ca3ef2
```

If the passcode is incorrect:
```
❌ Download/decrypt failed: Wrong passcode or corrupted file — decryption failed.
```

## Encrypt & Share a Snippet
Encrypts a text snippet and sends it as a Telegram message.
```
npx tsbin snippet "Hello World" --passcode 1234
```

Output Example:

```bash
Output Example:

```bash
🔐 Encrypting snippet...
📤 Sending encrypted snippet to Telegram...
✅ Snippet sent successfully!
```

## 🔓 Decrypt a Snippet Locally
Decrypts an encrypted snippet without needing Telegram.

```
npx tsbin decrypt-snippet --data <encrypted-base64> --passcode 1234
```

Output:
```
🔓 Decrypting snippet...

✅ Decrypted snippet:
───────────────────────────────
<decrypted text>
───────────────────────────────
```

## 🔒 Encryption Flow
### Upload Process

- Derives a 256-bit key from your passcode using SHA-256

- Generates a random 16-byte IV

- Encrypts the file with AES-256-CBC

- Uploads the .enc file to Telegram

### Download Process

- Fetches the encrypted .enc file from Telegram

- Recreates the AES key from the same passcode

- Decrypts the data locally

- Restores the original filename

- Snippets follow the same process — except the encrypted payload is sent as text.

## 🧩 Example Workflow
 ```
 # Upload
npx tsbin upload ./test/a.txt --passcode mySecret

# Share the printed File ID with a friend

# Download (on another machine)
npx tsbin download <file-id> --passcode mySecret
 ```

 ⚠️ Notes

- 📨 Telegram is used only as a temporary storage medium

- 🔐 All encryption/decryption is end-to-end and local

- ⚠️ Passcodes must match exactly

- 💾 No IV, key, or filename metadata is stored permanently

## 🧑‍💻 Example .env File
```
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFyourtoken
TELEGRAM_CHAT_ID=987654321
```

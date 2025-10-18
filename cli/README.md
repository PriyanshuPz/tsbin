# 🧰 tsbin — Temporary Encrypted File & Snippet Sharing CLI

**tsbin** is a secure, temporary, encrypted file & text snippet sharing CLI tool.  
It allows users to upload files or encrypted snippets to **Telegram** for fast and private sharing —  
with **all encryption and decryption happening locally** using `AES-256-CBC`.

---

## ⚙️ Features

- 🔐 AES-256 encryption (local only) — no plaintext ever leaves your system
- 📤 Upload encrypted files/snippets to the tsbin API (https://api.tsbin.tech)
- 📥 Download and decrypt files securely using a passcode
- 🧩 Encrypt and share text snippets
- 🧾 Supports both file and text modes
- ❌ Passcode mismatch detection (ensures safe decryption)
- 🧠 Simple CLI syntax with npx tsbin <command>

---

## 🧾 Directory Structure

```
cli/
├── bin/
│   └── tsbin.js
├── downloads/
│   └── a.txt
├── src/
│   ├── decryptSnippet.js
│   ├── download.js
│   ├── snippet.js
│   └── upload.js
├── test/
│   └── a.txt
├── utils/
│   └── encryptFile.js
├── .env
├── .env.example
├── package-lock.json
├── package.json
└── README.md
```


---

## ⚡ Setup

### Install dependencies
  ```bash
  npm install
  ```
### Set up environment

Create a .env file in your root directory:
```
  API_BASE_URL=https://api.tsbin.tech
```
### Make Executable
Make the CLI entry point globally runnable (useful for development/testing):
```
chmod +x ./bin/tsbin.js
```
### Run using NPX
```
npx tsbin <command>
```

---
## 🚀 Usage

All commands are executed via `npx tsbin <command>`.

### 🗂 Upload a File

Encrypts and uploads a file securely to the tsbin API.

```bash
npx tsbin upload ./test/a.txt --passcode mySecret
```
Output Example:

```
🔐 Encrypting file...
📤 Uploading to tsbin API...
✅ Upload successful!
🧾 Response: {
  success: true,
  data: 'ts_QukIVdQc',
  message: 'Trash created successfully'
}
```
### 📥 Download and Decrypt

Downloads and decrypts a previously uploaded file.

```bash
npx tsbin download <file-id> --passcode mySecret
```

Output Example:

```bash
📥 Fetching from tsbin API...
🔓 Decrypting file...
✅ Download complete! Saved to cli\downloads\a.txt
```

If the passcode is incorrect:
```
❌ Download/decrypt failed: Wrong passcode or corrupted file — decryption failed.
```

## Encrypt & Share a Snippet
Encrypts a plain text snippet and uploads it to the tsbin API.
```
Encrypts a plain text snippet and uploads it to the tsbin API
```

Output Example:

```bash
Output Example:

```bash
🔐 Encrypting snippet...
📤 Uploading encrypted snippet to tsbin API...
✅ Snippet uploaded successfully!
🔗 Share ID: ts_wgzxskJ5
Use this to decrypt:
npx tsbin decrypt-snippet --id ts_wgzxskJ5 --passcode mySecret123
```

## 🔓 Decrypt a Snippet
Fetches and decrypts a snippet uploaded via snippet.

```
npx tsbin decrypt-snippet --data ts_wgzxskJ5 --passcode mySecret123
```

Output:
```
📡 Fetching snippet data...
🔓 Decrypting snippet...
✅ Decryption successful!

📜 Decrypted Snippet:
───────────────────────────────
Hello World from TsBin!
───────────────────────────────
```
## 📋 List All Items (⚠️ API not implemented)
```
npx tsbin list
```
### Current Output:
```
📥 Fetching all items from tsbin API...
📥 Fetching all items from tsbin API...
❌ No items found or API returned empty data.
```

### 🔍 Get a Single Item
Fetch detailed info about a specific item.
```
🔍 Fetching item: ts_QukIVdQc...
✅ Item found:

🆔 ID: ts_QukIVdQc
📄 Type: file
📏 Size: 80
👀 Views: 7
⏰ Expires: Never
🔒 Encrypted: Yes
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

- 📨 tsbin uses https://api.tsbin.tech
 as the backend for uploads

- 🔐 All encryption/decryption is local (E2E)

- ⚠️ Passcodes must match exactly or decryption will fail

- 💾 No IV, key, or filename metadata is stored unencrypted

- 🚧 Listing (list) and fetching (get) are partial — backend under development

## 🧑‍💻 Example .env File
```
API_BASE_URL=https://api.tsbin.tech
```

### 🧱 Example Commands for Testing
```
# Upload
npx tsbin upload ./test/a.txt --passcode mySecret

# Download
npx tsbin download ts_QukIVdQc --passcode mySecret

# Encrypt Snippet
npx tsbin snippet "Hello from TsBin" --passcode mySecret123

# Decrypt Snippet
npx tsbin decrypt-snippet --data ts_ABC12345 --passcode mySecret123

# List all (stub)
npx tsbin list

# Get one (inspect JSON)
npx tsbin get ts_ABC12345
```
### Tech Stack
- Node.js (v18+)
- Commander.js — for CLI handling
- Axios — for API calls
- Crypto — AES-256 encryption/decryption
- dotenv — environment management
- chalk — colorful terminal output

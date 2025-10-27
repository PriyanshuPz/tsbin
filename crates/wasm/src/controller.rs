use crate::{client::TsbinClient, encryptor::Encryptor, types::*, utils};
use base64::{Engine, engine::general_purpose};
use js_sys::Uint8Array;
use serde_json::json;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use web_sys::File;

#[wasm_bindgen]
pub struct TsbinController {
    client: TsbinClient,
}

#[wasm_bindgen]
impl TsbinController {
    #[wasm_bindgen(constructor)]
    pub fn new(base_url: String, auth_token: String) -> Self {
        let client = TsbinClient::new(base_url.clone(), auth_token.clone());
        Self { client }
    }

    #[wasm_bindgen]
    pub async fn encrypt_text(
        &self,
        content: String,
        passcode: String,
        options: Option<EncryptionOptions>,
    ) -> Result<String, JsValue> {
        let options = options.unwrap_or_else(|| EncryptionOptions::new());
        let encryptor = Encryptor::new(passcode.clone());
        let encrypted_data = encryptor.encrypt(content.as_bytes());
        let encrypted_text = general_purpose::STANDARD.encode(&encrypted_data);

        let metadata = json!({
            "passcode_hash": utils::hash_passphrase(&passcode),
            "expire_at": options.expire_at,
            "original_length": content.len(),
            "encryption_type": "aes256gcm"
        });

        let trash_id = self.client.upload_text(&encrypted_text, &metadata).await?;
        Ok(trash_id)
    }

    #[wasm_bindgen]
    pub async fn decrypt_text(
        &self,
        input: String,
        passcode: String,
    ) -> Result<TextTrashContent, JsValue> {
        let passcode_hash = utils::hash_passphrase(&passcode);
        let encrypted_obj = self.client.get_text_obj(&input, &passcode_hash).await?;

        let encrypted_data = general_purpose::STANDARD
            .decode(
                encrypted_obj["enc_trash_text"]
                    .as_str()
                    .ok_or("Invalid JSON value")?,
            )
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let encryptor = Encryptor::new(passcode);
        let decrypted_data = encryptor.decrypt(&encrypted_data);
        let decrypted_text =
            String::from_utf8(decrypted_data).map_err(|e| JsValue::from_str(&e.to_string()))?;

        // stitch decrypted text and other obj fields and send
        let result_obj = TextTrashContent {
            id: encrypted_obj["id"]
                .as_str()
                .ok_or("Invalid JSON value")?
                .to_string(),
            enc_trash_text: decrypted_text,
            encryption_type: encrypted_obj["encryption_type"]
                .as_str()
                .ok_or("Invalid JSON value")?
                .to_string(),
            text_length: encrypted_obj["text_length"]
                .as_u64()
                .ok_or("Invalid JSON value")? as usize,
        };

        Ok(result_obj)
    }

    #[wasm_bindgen]
    pub async fn encrypt_file(
        &self,
        file: File,
        passcode: String,
        options: Option<EncryptionOptions>,
        progress_callback: Option<ProgressCallback>,
    ) -> Result<String, JsValue> {
        let options = options.unwrap_or_else(|| EncryptionOptions::new());
        let chunk_size = options.chunk_size.unwrap_or(10 * 1024 * 1024);
        let max_retries = options.max_retries.unwrap_or(3);

        let file_size = file.size() as usize;
        let total_chunks = (file_size + chunk_size - 1) / chunk_size;

        let mut progress = UploadProgress {
            total_chunks: total_chunks as u32,
            uploaded_chunks: 0,
            failed_chunks: Vec::new(),
            completed: false,
            trash_id: None,
        };

        let encryptor = Encryptor::new(passcode.clone());
        let mut file_ids = Vec::new();
        let mut message_ids = Vec::new();
        let mut chunk_uploads: HashMap<u32, Result<ChunkUploadResponse, String>> = HashMap::new();

        // Process chunks
        for chunk_index in 0..total_chunks {
            let start = chunk_index * chunk_size;
            let end = std::cmp::min(start + chunk_size, file_size);

            // Read chunk from file
            let chunk_blob = file.slice_with_i32_and_i32(start as i32, end as i32)?;
            let array_buffer =
                wasm_bindgen_futures::JsFuture::from(chunk_blob.array_buffer()).await?;
            let uint8_array = Uint8Array::new(&array_buffer);
            let mut chunk_data = vec![0; uint8_array.length() as usize];
            uint8_array.copy_to(&mut chunk_data);

            // Encrypt chunk
            let encrypted_chunk = encryptor.encrypt(&chunk_data);

            // Upload with retries
            let mut retries = 0;
            let upload_result = loop {
                match self
                    .client
                    .upload_chunk(&encrypted_chunk, chunk_index as u32)
                    .await
                {
                    Ok(response) => break Ok(response),
                    Err(e) => {
                        retries += 1;
                        if retries >= max_retries {
                            break Err(format!("Failed after {} retries: {:?}", max_retries, e));
                        }
                        // Simple delay for retry (in a real implementation, you might want exponential backoff)
                        continue;
                    }
                }
            };

            match upload_result {
                Ok(response) => {
                    file_ids.push(response.file_id.clone());
                    message_ids.push(response.message_id.clone());
                    progress.uploaded_chunks += 1;
                    chunk_uploads.insert(chunk_index as u32, Ok(response));
                }
                Err(e) => {
                    progress.failed_chunks.push(chunk_index as u32);
                    chunk_uploads.insert(chunk_index as u32, Err(e));
                }
            }

            // Report progress
            if let Some(ref callback) = progress_callback {
                callback.call(&progress)?;
            }
        }

        // Check if all chunks uploaded successfully
        if !progress.failed_chunks.is_empty() {
            return Err(JsValue::from_str(&format!(
                "Failed to upload {} chunks",
                progress.failed_chunks.len()
            )));
        }

        // Create file trash
        let metadata = json!({
            "passcode_hash": utils::hash_passphrase(&passcode),
            "expire_at": options.expire_at,
            "original_size": file_size,
            "total_chunks": total_chunks,
            "chunk_size": chunk_size,
            "encryption_type": "aes256gcm",
            "filename": file.name()
        });

        let trash_id = self
            .client
            .create_file_trash(file_ids, message_ids, &metadata)
            .await?;

        progress.completed = true;
        progress.trash_id = Some(trash_id.clone());

        // Final progress update
        if let Some(ref callback) = progress_callback {
            callback.call(&progress)?;
        }

        Ok(trash_id)
    }

    #[wasm_bindgen]
    pub async fn decrypt_file(
        &self,
        trash_id: String,
        passcode: String,
        progress_callback: Option<ProgressCallback>,
    ) -> Result<Uint8Array, JsValue> {
        // Get trash metadata
        let trash_meta = self.client.get_trash_meta(&trash_id).await?;

        if trash_meta.trash_type != "file" {
            return Err(JsValue::from_str("Not a file trash"));
        }

        let file_ids = trash_meta
            .file_ids
            .ok_or_else(|| JsValue::from_str("No file IDs in trash"))?;
        let total_chunks = file_ids.len();

        let mut progress = UploadProgress {
            total_chunks: total_chunks as u32,
            uploaded_chunks: 0,
            failed_chunks: Vec::new(),
            completed: false,
            trash_id: Some(trash_id.clone()),
        };

        let encryptor = Encryptor::new(passcode);
        let mut decrypted_chunks: Vec<Vec<u8>> = vec![Vec::new(); total_chunks];

        // Download and decrypt chunks
        for (index, file_id) in file_ids.iter().enumerate() {
            match self.client.download_chunk(&trash_id, file_id).await {
                Ok(encrypted_chunk) => {
                    let decrypted_chunk = encryptor.decrypt(&encrypted_chunk);
                    decrypted_chunks[index] = decrypted_chunk;
                    progress.uploaded_chunks += 1;
                }
                Err(_) => {
                    progress.failed_chunks.push(index as u32);
                }
            }

            // Report progress
            if let Some(ref callback) = progress_callback {
                callback.call(&progress)?;
            }
        }

        if !progress.failed_chunks.is_empty() {
            return Err(JsValue::from_str(&format!(
                "Failed to download {} chunks",
                progress.failed_chunks.len()
            )));
        }

        // Combine all chunks
        let mut final_data = Vec::new();
        for chunk in decrypted_chunks {
            final_data.extend_from_slice(&chunk);
        }

        progress.completed = true;
        if let Some(ref callback) = progress_callback {
            callback.call(&progress)?;
        }

        Ok(Uint8Array::from(&final_data[..]))
    }
}

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(getter_with_clone)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextTrashContent {
    pub id: String,
    pub enc_trash_text: String,
    pub encryption_type: String,
    pub text_length: usize,
}

#[wasm_bindgen]
impl TextTrashContent {
    pub fn value(&self) -> JsValue {
        serde_wasm_bindgen::to_value(self).unwrap()
    }
}

#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionOptions {
    #[wasm_bindgen(skip)]
    pub expire_at: Option<String>,
    #[wasm_bindgen(skip)]
    pub chunk_size: Option<usize>,
    #[wasm_bindgen(skip)]
    pub max_retries: Option<u32>,
}

#[wasm_bindgen]
impl EncryptionOptions {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            expire_at: None,
            chunk_size: Some(10 * 1024 * 1024), // 10MB default
            max_retries: Some(3),
        }
    }

    #[wasm_bindgen(setter)]
    pub fn set_expire_at(&mut self, expire_at: Option<String>) {
        self.expire_at = expire_at;
    }

    #[wasm_bindgen(setter)]
    pub fn set_chunk_size(&mut self, chunk_size: Option<usize>) {
        self.chunk_size = chunk_size;
    }

    #[wasm_bindgen(setter)]
    pub fn set_max_retries(&mut self, max_retries: Option<u32>) {
        self.max_retries = max_retries;
    }
}

#[wasm_bindgen(getter_with_clone)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrashMeta {
    pub trash_id: String,
    pub encrypted: bool,
    pub trash_type: String, // "file" | "text"
    pub expire_at: Option<String>,
    pub file_ids: Option<Vec<String>>,
    pub message_ids: Option<Vec<u64>>,
    pub total_chunks: Option<u32>,
    pub total_size: Option<u64>,
}

#[wasm_bindgen(getter_with_clone)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkUploadResponse {
    pub file_id: String,
    pub message_id: u32,
    pub chunk_index: u32,
}

#[wasm_bindgen(getter_with_clone)]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UploadProgress {
    pub total_chunks: u32,
    pub uploaded_chunks: u32,
    pub failed_chunks: Vec<u32>,
    pub completed: bool,
    pub trash_id: Option<String>,
}

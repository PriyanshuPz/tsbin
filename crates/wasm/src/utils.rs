use base64::{Engine, engine::general_purpose};
use hmac::Hmac;
use pbkdf2::pbkdf2;
use sha2::{Digest, Sha256};
use wasm_bindgen::prelude::*;

pub fn derive_key(passphrase: &str) -> [u8; 32] {
    let salt = b"tsbin_salt_2024"; // In production, use a proper salt
    let mut key = [0u8; 32];
    let _ = pbkdf2::<Hmac<Sha256>>(passphrase.as_bytes(), salt, 100_000, &mut key);
    key
}

#[wasm_bindgen]
pub fn hash_passphrase(passphrase: &str) -> String {
    if passphrase.is_empty() {
        return "0000".to_string();
    }
    if passphrase == "0000" {
        return "0000".to_string();
    }
    let mut hasher = Sha256::new();
    hasher.update(passphrase.as_bytes());
    let result = hasher.finalize();
    general_purpose::STANDARD.encode(result)
}

pub fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

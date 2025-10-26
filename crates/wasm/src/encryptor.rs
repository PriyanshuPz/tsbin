use crate::utils;
use aes_gcm::{
    Aes256Gcm,
    aead::{Aead, KeyInit},
};

use generic_array::GenericArray;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Encryptor {
    key: aes_gcm::Key<Aes256Gcm>,
}

const CHUNK_SIZE: usize = 5 * 1024 * 1024; // 5MB

#[wasm_bindgen]
impl Encryptor {
    #[wasm_bindgen(constructor)]
    pub fn new(passphrase: String) -> Self {
        let key_bytes = utils::derive_key(&passphrase);
        Self {
            key: key_bytes.into(),
        }
    }
    #[wasm_bindgen]
    pub fn encrypt(&self, data: &[u8]) -> Vec<u8> {
        let cipher = Aes256Gcm::new(&self.key);
        let mut output = Vec::new();
        let mut chunk_index: u64 = 0;

        for chunk in data.chunks(CHUNK_SIZE) {
            let mut nonce_bytes = [0u8; 12];
            nonce_bytes[..8].copy_from_slice(&chunk_index.to_be_bytes());
            let nonce = GenericArray::from_slice(&nonce_bytes);

            let ciphertext = cipher
                .encrypt(nonce.as_0_14(), chunk)
                .expect("encryption failure");

            output.extend_from_slice(&nonce_bytes);
            output.extend_from_slice(&(ciphertext.len() as u32).to_be_bytes());
            output.extend_from_slice(&ciphertext);
            chunk_index += 1;
        }
        output
    }

    #[wasm_bindgen]
    pub fn decrypt(&self, data: &[u8]) -> Vec<u8> {
        let cipher = Aes256Gcm::new(&self.key);
        let mut cursor = 0;
        let mut output = Vec::new();

        while cursor < data.len() {
            if cursor + 12 + 4 > data.len() {
                break;
            }

            let nonce_bytes = &data[cursor..cursor + 12];
            cursor += 12;

            let len_bytes = &data[cursor..cursor + 4];
            cursor += 4;
            let chunk_len = u32::from_be_bytes(len_bytes.try_into().unwrap()) as usize;
            // Check that ciphertext fits in remaining data
            if cursor + chunk_len > data.len() {
                // return Err("Chunk truncated or corrupted");
                break;
            }

            let ciphertext = &data[cursor..cursor + chunk_len];
            cursor += chunk_len;

            let nonce = GenericArray::from_slice(nonce_bytes);
            let plaintext = cipher
                .decrypt(nonce.as_0_14(), ciphertext)
                .expect("decryption failure");
            output.extend_from_slice(&plaintext);
        }
        output
    }
}

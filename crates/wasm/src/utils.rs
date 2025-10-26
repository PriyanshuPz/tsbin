use pbkdf2::hmac::Hmac;
use sha2::Sha256;

pub fn derive_key(passphrase: &str) -> [u8; 32] {
    let salt = b"tsbin_salt";
    let iterations = 100_000;
    let mut key = [0u8; 32];
    let _ = pbkdf2::pbkdf2::<Hmac<Sha256>>(passphrase.as_bytes(), salt, iterations, &mut key);
    key
}

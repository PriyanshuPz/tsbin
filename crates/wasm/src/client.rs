use crate::types::*;
use serde_json::json;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{FormData, Headers, Request, RequestInit, RequestMode, Response};

pub struct TsbinClient {
    base_url: String,
    auth_token: String,
}

impl TsbinClient {
    pub fn new(base_url: String, auth_token: String) -> Self {
        Self {
            base_url,
            auth_token,
        }
    }

    async fn make_request(
        &self,
        endpoint: &str,
        method: &str,
        body: Option<JsValue>,
    ) -> Result<Response, JsValue> {
        let url = format!("{}{}", self.base_url, endpoint);

        let opts = RequestInit::new();
        opts.set_method(method);
        opts.set_mode(RequestMode::Cors);

        let headers = Headers::new()?;
        if let Some(body) = body {
            if method != "GET" {
                // Check if body is FormData (for file uploads)
                if body.is_instance_of::<FormData>() {
                    opts.set_body(&body);
                } else {
                    // For JSON data, convert JsValue back to string
                    let body_str = js_sys::JSON::stringify(&body)
                        .map_err(|_| JsValue::from_str("Failed to stringify body"))?
                        .as_string()
                        .ok_or_else(|| JsValue::from_str("Body stringify returned null"))?;

                    opts.set_body(&JsValue::from_str(&body_str));
                    headers.set("Content-Type", "application/json")?;
                }
            }
        }

        headers.set("Authorization", &format!("Bearer {}", self.auth_token))?;
        opts.set_headers(&headers);

        let request = Request::new_with_str_and_init(&url, &opts)?;

        let window = web_sys::window().unwrap();
        let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
        let resp: Response = resp_value.dyn_into().unwrap();

        if !resp.ok() {
            return Err(JsValue::from_str(&format!("HTTP error: {}", resp.status())));
        }

        Ok(resp)
    }

    pub async fn upload_text(
        &self,
        encrypted_text: &str,
        metadata: &serde_json::Value,
    ) -> Result<String, JsValue> {
        let body = json!({
            "enc_trash_text": encrypted_text,
            "encryption_metadata": metadata,
            "text_length": encrypted_text.len()
        });

        let body_str =
            serde_json::to_string(&body).map_err(|e| JsValue::from_str(&e.to_string()))?;
        let body_js = js_sys::JSON::parse(&body_str)?;

        let response = self
            .make_request("/trash/text", "POST", Some(body_js))
            .await?;

        let response_text = JsFuture::from(response.text()?).await?;

        let response_json: serde_json::Value =
            serde_json::from_str(&response_text.as_string().unwrap())
                .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(response_json["data"]["trash_id"]
            .as_str()
            .unwrap()
            .to_string())
    }

    pub async fn get_file_trash_meta(&self, trash_id: &str) -> Result<TrashMeta, JsValue> {
        let endpoint = format!("/trash/file?file_id={}", trash_id);
        let response = self.make_request(&endpoint, "GET", None).await?;
        let response_text = JsFuture::from(response.text()?).await?;
        let response_json: serde_json::Value =
            serde_json::from_str(&response_text.as_string().unwrap())
                .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let trash_meta: TrashMeta = serde_json::from_str(&response_json["data"].to_string())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(trash_meta)
    }

    pub async fn get_text_obj(
        &self,
        trash_id: &str,
        passcode_hash: &str,
    ) -> Result<serde_json::Value, JsValue> {
        let endpoint = format!("/trash/text?id={}&passcode={}", trash_id, passcode_hash);
        let response = self.make_request(&endpoint, "GET", None).await?;
        let response_text = JsFuture::from(response.text()?).await?;

        let res_json: serde_json::Value = serde_json::from_str(&response_text.as_string().unwrap())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(res_json["data"].clone().into())
    }

    pub async fn upload_chunk(
        &self,
        chunk_data: &[u8],
        chunk_index: u32,
    ) -> Result<ChunkUploadResponse, JsValue> {
        let form_data = FormData::new()?;
        let uint8_array = js_sys::Uint8Array::from(chunk_data);
        let blob = web_sys::Blob::new_with_u8_array_sequence(&js_sys::Array::of1(&uint8_array))?;
        form_data.append_with_blob_and_filename(
            "chunk",
            &blob,
            &format!("chunk_{}", chunk_index),
        )?;
        form_data.append_with_str("chunk_index", &chunk_index.to_string())?;

        let response = self
            .make_request("/trash/chunk", "POST", Some(form_data.into()))
            .await?;
        let response_text = JsFuture::from(response.text()?).await?;
        let chunk_response: ChunkUploadResponse =
            serde_json::from_str(&response_text.as_string().unwrap())
                .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(chunk_response)
    }

    pub async fn create_file_trash(
        &self,
        file_ids: Vec<String>,
        message_ids: Vec<u32>,
        metadata: &serde_json::Value,
    ) -> Result<String, JsValue> {
        let body = json!({
            "message_ids": message_ids,
            "file_ids": file_ids,
            "encryption_metadata": metadata
        });

        let body_str =
            serde_json::to_string(&body).map_err(|e| JsValue::from_str(&e.to_string()))?;
        let body_js = js_sys::JSON::parse(&body_str)?;

        let response = self
            .make_request("/trash/file", "POST", Some(body_js))
            .await?;
        let response_text = JsFuture::from(response.text()?).await?;

        let response_json: serde_json::Value =
            serde_json::from_str(&response_text.as_string().unwrap())
                .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(response_json["data"]["trash_id"]
            .as_str()
            .unwrap()
            .to_string())
    }

    pub async fn download_chunk(&self, trash_id: &str, file_id: &str) -> Result<Vec<u8>, JsValue> {
        let endpoint = format!("/trash/chunk?trash_id={}&file_id={}", trash_id, file_id);
        let response = self.make_request(&endpoint, "GET", None).await?;
        let array_buffer = JsFuture::from(response.array_buffer()?).await?;
        let uint8_array = js_sys::Uint8Array::new(&array_buffer);
        let mut chunk_data = vec![0; uint8_array.length() as usize];
        uint8_array.copy_to(&mut chunk_data);

        Ok(chunk_data)
    }
}

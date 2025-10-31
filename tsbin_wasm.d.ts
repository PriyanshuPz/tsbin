/* tslint:disable */
/* eslint-disable */
export function hash_passphrase(passphrase: string): string;
export class ChunkUploadResponse {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  file_id: string;
  message_id: number;
  chunk_index: number;
}
export class EncryptionOptions {
  free(): void;
  [Symbol.dispose](): void;
  constructor();
  set expire_at(value: string | null | undefined);
  set chunk_size(value: number | null | undefined);
  set max_retries(value: number | null | undefined);
}
export class Encryptor {
  free(): void;
  [Symbol.dispose](): void;
  constructor(passphrase: string);
  encrypt(data: Uint8Array): Uint8Array;
  decrypt(data: Uint8Array): Uint8Array;
}
export class FileTrashContent {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  id: string;
  mime_type: string;
  file: Uint8Array;
  file_name: string;
  file_size: number;
}
export class TextTrashContent {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  value(): any;
  id: string;
  enc_trash_text: string;
  encryption_type: string;
  text_length: number;
}
export class TrashMeta {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  trash_id: string;
  encrypted: boolean;
  trash_type: string;
  get expire_at(): string | undefined;
  set expire_at(value: string | null | undefined);
  get file_ids(): string[] | undefined;
  set file_ids(value: string[] | null | undefined);
  get message_ids(): BigUint64Array | undefined;
  set message_ids(value: BigUint64Array | null | undefined);
  get total_chunks(): number | undefined;
  set total_chunks(value: number | null | undefined);
  get total_size(): bigint | undefined;
  set total_size(value: bigint | null | undefined);
  file_name: string;
  mime_type: string;
  file_size: number;
}
export class TsbinController {
  free(): void;
  [Symbol.dispose](): void;
  constructor(base_url: string, auth_token: string);
  encrypt_text(content: string, passcode: string, options?: EncryptionOptions | null): Promise<string>;
  decrypt_text(input: string, passcode: string): Promise<TextTrashContent>;
  encrypt_file(file: File, passcode: string, options?: EncryptionOptions | null, progress_callback?: Function | null): Promise<string>;
  decrypt_file(trash_id: string, passcode: string, progress_callback?: Function | null): Promise<FileTrashContent>;
}
export class UploadProgress {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  total_chunks: number;
  uploaded_chunks: number;
  failed_chunks: Uint32Array;
  completed: boolean;
  get trash_id(): string | undefined;
  set trash_id(value: string | null | undefined);
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_filetrashcontent_free: (a: number, b: number) => void;
  readonly __wbg_get_filetrashcontent_id: (a: number) => [number, number];
  readonly __wbg_get_filetrashcontent_mime_type: (a: number) => [number, number];
  readonly __wbg_set_filetrashcontent_mime_type: (a: number, b: number, c: number) => void;
  readonly __wbg_get_filetrashcontent_file: (a: number) => [number, number];
  readonly __wbg_set_filetrashcontent_file: (a: number, b: number, c: number) => void;
  readonly __wbg_get_filetrashcontent_file_name: (a: number) => [number, number];
  readonly __wbg_set_filetrashcontent_file_name: (a: number, b: number, c: number) => void;
  readonly __wbg_get_filetrashcontent_file_size: (a: number) => number;
  readonly __wbg_set_filetrashcontent_file_size: (a: number, b: number) => void;
  readonly __wbg_texttrashcontent_free: (a: number, b: number) => void;
  readonly __wbg_get_texttrashcontent_id: (a: number) => [number, number];
  readonly __wbg_get_texttrashcontent_enc_trash_text: (a: number) => [number, number];
  readonly __wbg_get_texttrashcontent_encryption_type: (a: number) => [number, number];
  readonly __wbg_get_texttrashcontent_text_length: (a: number) => number;
  readonly __wbg_set_texttrashcontent_text_length: (a: number, b: number) => void;
  readonly texttrashcontent_value: (a: number) => any;
  readonly __wbg_encryptionoptions_free: (a: number, b: number) => void;
  readonly encryptionoptions_new: () => number;
  readonly encryptionoptions_set_expire_at: (a: number, b: number, c: number) => void;
  readonly encryptionoptions_set_chunk_size: (a: number, b: number) => void;
  readonly encryptionoptions_set_max_retries: (a: number, b: number) => void;
  readonly __wbg_trashmeta_free: (a: number, b: number) => void;
  readonly __wbg_get_trashmeta_trash_id: (a: number) => [number, number];
  readonly __wbg_set_trashmeta_trash_id: (a: number, b: number, c: number) => void;
  readonly __wbg_get_trashmeta_encrypted: (a: number) => number;
  readonly __wbg_set_trashmeta_encrypted: (a: number, b: number) => void;
  readonly __wbg_get_trashmeta_trash_type: (a: number) => [number, number];
  readonly __wbg_set_trashmeta_trash_type: (a: number, b: number, c: number) => void;
  readonly __wbg_get_trashmeta_expire_at: (a: number) => [number, number];
  readonly __wbg_set_trashmeta_expire_at: (a: number, b: number, c: number) => void;
  readonly __wbg_get_trashmeta_file_ids: (a: number) => [number, number];
  readonly __wbg_set_trashmeta_file_ids: (a: number, b: number, c: number) => void;
  readonly __wbg_get_trashmeta_message_ids: (a: number) => [number, number];
  readonly __wbg_set_trashmeta_message_ids: (a: number, b: number, c: number) => void;
  readonly __wbg_get_trashmeta_total_chunks: (a: number) => number;
  readonly __wbg_set_trashmeta_total_chunks: (a: number, b: number) => void;
  readonly __wbg_get_trashmeta_total_size: (a: number) => [number, bigint];
  readonly __wbg_set_trashmeta_total_size: (a: number, b: number, c: bigint) => void;
  readonly __wbg_get_trashmeta_file_name: (a: number) => [number, number];
  readonly __wbg_set_trashmeta_file_name: (a: number, b: number, c: number) => void;
  readonly __wbg_get_trashmeta_mime_type: (a: number) => [number, number];
  readonly __wbg_set_trashmeta_mime_type: (a: number, b: number, c: number) => void;
  readonly __wbg_get_trashmeta_file_size: (a: number) => number;
  readonly __wbg_set_trashmeta_file_size: (a: number, b: number) => void;
  readonly __wbg_chunkuploadresponse_free: (a: number, b: number) => void;
  readonly __wbg_get_chunkuploadresponse_file_id: (a: number) => [number, number];
  readonly __wbg_set_chunkuploadresponse_file_id: (a: number, b: number, c: number) => void;
  readonly __wbg_get_chunkuploadresponse_message_id: (a: number) => number;
  readonly __wbg_set_chunkuploadresponse_message_id: (a: number, b: number) => void;
  readonly __wbg_get_chunkuploadresponse_chunk_index: (a: number) => number;
  readonly __wbg_set_chunkuploadresponse_chunk_index: (a: number, b: number) => void;
  readonly __wbg_uploadprogress_free: (a: number, b: number) => void;
  readonly __wbg_get_uploadprogress_total_chunks: (a: number) => number;
  readonly __wbg_set_uploadprogress_total_chunks: (a: number, b: number) => void;
  readonly __wbg_get_uploadprogress_uploaded_chunks: (a: number) => number;
  readonly __wbg_set_uploadprogress_uploaded_chunks: (a: number, b: number) => void;
  readonly __wbg_get_uploadprogress_failed_chunks: (a: number) => [number, number];
  readonly __wbg_set_uploadprogress_failed_chunks: (a: number, b: number, c: number) => void;
  readonly __wbg_get_uploadprogress_completed: (a: number) => number;
  readonly __wbg_set_uploadprogress_completed: (a: number, b: number) => void;
  readonly __wbg_get_uploadprogress_trash_id: (a: number) => [number, number];
  readonly __wbg_set_uploadprogress_trash_id: (a: number, b: number, c: number) => void;
  readonly __wbg_set_texttrashcontent_id: (a: number, b: number, c: number) => void;
  readonly __wbg_set_texttrashcontent_enc_trash_text: (a: number, b: number, c: number) => void;
  readonly __wbg_set_texttrashcontent_encryption_type: (a: number, b: number, c: number) => void;
  readonly __wbg_set_filetrashcontent_id: (a: number, b: number, c: number) => void;
  readonly __wbg_tsbincontroller_free: (a: number, b: number) => void;
  readonly tsbincontroller_new: (a: number, b: number, c: number, d: number) => number;
  readonly tsbincontroller_encrypt_text: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
  readonly tsbincontroller_decrypt_text: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly tsbincontroller_encrypt_file: (a: number, b: any, c: number, d: number, e: number, f: number) => any;
  readonly tsbincontroller_decrypt_file: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
  readonly __wbg_encryptor_free: (a: number, b: number) => void;
  readonly encryptor_new: (a: number, b: number) => number;
  readonly encryptor_encrypt: (a: number, b: number, c: number) => [number, number];
  readonly encryptor_decrypt: (a: number, b: number, c: number) => [number, number];
  readonly hash_passphrase: (a: number, b: number) => [number, number];
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_5: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly closure76_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure91_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

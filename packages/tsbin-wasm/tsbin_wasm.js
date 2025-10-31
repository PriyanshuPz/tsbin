let wasm;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(
state => {
    wasm.__wbindgen_export_5.get(state.dtor)(state.a, state.b);
}
);

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_5.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_export_2.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

let cachedBigUint64ArrayMemory0 = null;

function getBigUint64ArrayMemory0() {
    if (cachedBigUint64ArrayMemory0 === null || cachedBigUint64ArrayMemory0.byteLength === 0) {
        cachedBigUint64ArrayMemory0 = new BigUint64Array(wasm.memory.buffer);
    }
    return cachedBigUint64ArrayMemory0;
}

function getArrayU64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getBigUint64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function passArray64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getBigUint64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}
/**
 * @param {string} passphrase
 * @returns {string}
 */
export function hash_passphrase(passphrase) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(passphrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.hash_passphrase(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

function __wbg_adapter_10(arg0, arg1, arg2) {
    wasm.closure76_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_159(arg0, arg1, arg2, arg3) {
    wasm.closure91_externref_shim(arg0, arg1, arg2, arg3);
}

const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];

const ChunkUploadResponseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chunkuploadresponse_free(ptr >>> 0, 1));

export class ChunkUploadResponse {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChunkUploadResponseFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chunkuploadresponse_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get file_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_chunkuploadresponse_file_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set file_id(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_chunkuploadresponse_file_id(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {number}
     */
    get message_id() {
        const ret = wasm.__wbg_get_chunkuploadresponse_message_id(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set message_id(arg0) {
        wasm.__wbg_set_chunkuploadresponse_message_id(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get chunk_index() {
        const ret = wasm.__wbg_get_chunkuploadresponse_chunk_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set chunk_index(arg0) {
        wasm.__wbg_set_chunkuploadresponse_chunk_index(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) ChunkUploadResponse.prototype[Symbol.dispose] = ChunkUploadResponse.prototype.free;

const EncryptionOptionsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_encryptionoptions_free(ptr >>> 0, 1));

export class EncryptionOptions {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EncryptionOptionsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_encryptionoptions_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.encryptionoptions_new();
        this.__wbg_ptr = ret >>> 0;
        EncryptionOptionsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string | null} [expire_at]
     */
    set expire_at(expire_at) {
        var ptr0 = isLikeNone(expire_at) ? 0 : passStringToWasm0(expire_at, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.encryptionoptions_set_expire_at(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {number | null} [chunk_size]
     */
    set chunk_size(chunk_size) {
        wasm.encryptionoptions_set_chunk_size(this.__wbg_ptr, isLikeNone(chunk_size) ? 0x100000001 : (chunk_size) >>> 0);
    }
    /**
     * @param {number | null} [max_retries]
     */
    set max_retries(max_retries) {
        wasm.encryptionoptions_set_max_retries(this.__wbg_ptr, isLikeNone(max_retries) ? 0x100000001 : (max_retries) >>> 0);
    }
}
if (Symbol.dispose) EncryptionOptions.prototype[Symbol.dispose] = EncryptionOptions.prototype.free;

const EncryptorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_encryptor_free(ptr >>> 0, 1));

export class Encryptor {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EncryptorFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_encryptor_free(ptr, 0);
    }
    /**
     * @param {string} passphrase
     */
    constructor(passphrase) {
        const ptr0 = passStringToWasm0(passphrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.encryptor_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        EncryptorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Uint8Array} data
     * @returns {Uint8Array}
     */
    encrypt(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.encryptor_encrypt(this.__wbg_ptr, ptr0, len0);
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
    }
    /**
     * @param {Uint8Array} data
     * @returns {Uint8Array}
     */
    decrypt(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.encryptor_decrypt(this.__wbg_ptr, ptr0, len0);
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
    }
}
if (Symbol.dispose) Encryptor.prototype[Symbol.dispose] = Encryptor.prototype.free;

const FileTrashContentFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_filetrashcontent_free(ptr >>> 0, 1));

export class FileTrashContent {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FileTrashContent.prototype);
        obj.__wbg_ptr = ptr;
        FileTrashContentFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FileTrashContentFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_filetrashcontent_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_filetrashcontent_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set id(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_chunkuploadresponse_file_id(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get mime_type() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_filetrashcontent_mime_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set mime_type(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_filetrashcontent_mime_type(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {Uint8Array}
     */
    get file() {
        const ret = wasm.__wbg_get_filetrashcontent_file(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {Uint8Array} arg0
     */
    set file(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_filetrashcontent_file(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get file_name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_filetrashcontent_file_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set file_name(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_filetrashcontent_file_name(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {number}
     */
    get file_size() {
        const ret = wasm.__wbg_get_filetrashcontent_file_size(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set file_size(arg0) {
        wasm.__wbg_set_filetrashcontent_file_size(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) FileTrashContent.prototype[Symbol.dispose] = FileTrashContent.prototype.free;

const TextTrashContentFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_texttrashcontent_free(ptr >>> 0, 1));

export class TextTrashContent {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TextTrashContent.prototype);
        obj.__wbg_ptr = ptr;
        TextTrashContentFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TextTrashContentFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_texttrashcontent_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_texttrashcontent_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set id(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_chunkuploadresponse_file_id(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get enc_trash_text() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_texttrashcontent_enc_trash_text(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set enc_trash_text(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_filetrashcontent_mime_type(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get encryption_type() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_texttrashcontent_encryption_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set encryption_type(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_filetrashcontent_file(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {number}
     */
    get text_length() {
        const ret = wasm.__wbg_get_texttrashcontent_text_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set text_length(arg0) {
        wasm.__wbg_set_texttrashcontent_text_length(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {any}
     */
    value() {
        const ret = wasm.texttrashcontent_value(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) TextTrashContent.prototype[Symbol.dispose] = TextTrashContent.prototype.free;

const TrashMetaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_trashmeta_free(ptr >>> 0, 1));

export class TrashMeta {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TrashMetaFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_trashmeta_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get trash_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_trashmeta_trash_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set trash_id(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_trashmeta_trash_id(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {boolean}
     */
    get encrypted() {
        const ret = wasm.__wbg_get_trashmeta_encrypted(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} arg0
     */
    set encrypted(arg0) {
        wasm.__wbg_set_trashmeta_encrypted(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {string}
     */
    get trash_type() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_trashmeta_trash_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set trash_type(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_trashmeta_trash_type(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string | undefined}
     */
    get expire_at() {
        const ret = wasm.__wbg_get_trashmeta_expire_at(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @param {string | null} [arg0]
     */
    set expire_at(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_trashmeta_expire_at(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string[] | undefined}
     */
    get file_ids() {
        const ret = wasm.__wbg_get_trashmeta_file_ids(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v1;
    }
    /**
     * @param {string[] | null} [arg0]
     */
    set file_ids(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_trashmeta_file_ids(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {BigUint64Array | undefined}
     */
    get message_ids() {
        const ret = wasm.__wbg_get_trashmeta_message_ids(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayU64FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        }
        return v1;
    }
    /**
     * @param {BigUint64Array | null} [arg0]
     */
    set message_ids(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passArray64ToWasm0(arg0, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_trashmeta_message_ids(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {number | undefined}
     */
    get total_chunks() {
        const ret = wasm.__wbg_get_trashmeta_total_chunks(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * @param {number | null} [arg0]
     */
    set total_chunks(arg0) {
        wasm.__wbg_set_trashmeta_total_chunks(this.__wbg_ptr, isLikeNone(arg0) ? 0x100000001 : (arg0) >>> 0);
    }
    /**
     * @returns {bigint | undefined}
     */
    get total_size() {
        const ret = wasm.__wbg_get_trashmeta_total_size(this.__wbg_ptr);
        return ret[0] === 0 ? undefined : BigInt.asUintN(64, ret[1]);
    }
    /**
     * @param {bigint | null} [arg0]
     */
    set total_size(arg0) {
        wasm.__wbg_set_trashmeta_total_size(this.__wbg_ptr, !isLikeNone(arg0), isLikeNone(arg0) ? BigInt(0) : arg0);
    }
    /**
     * @returns {string}
     */
    get file_name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_trashmeta_file_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set file_name(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_trashmeta_file_name(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get mime_type() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_trashmeta_mime_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set mime_type(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_trashmeta_mime_type(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {number}
     */
    get file_size() {
        const ret = wasm.__wbg_get_trashmeta_file_size(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set file_size(arg0) {
        wasm.__wbg_set_trashmeta_file_size(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) TrashMeta.prototype[Symbol.dispose] = TrashMeta.prototype.free;

const TsbinControllerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tsbincontroller_free(ptr >>> 0, 1));

export class TsbinController {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TsbinControllerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tsbincontroller_free(ptr, 0);
    }
    /**
     * @param {string} base_url
     * @param {string} auth_token
     */
    constructor(base_url, auth_token) {
        const ptr0 = passStringToWasm0(base_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(auth_token, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.tsbincontroller_new(ptr0, len0, ptr1, len1);
        this.__wbg_ptr = ret >>> 0;
        TsbinControllerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} content
     * @param {string} passcode
     * @param {EncryptionOptions | null} [options]
     * @returns {Promise<string>}
     */
    encrypt_text(content, passcode, options) {
        const ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(passcode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        let ptr2 = 0;
        if (!isLikeNone(options)) {
            _assertClass(options, EncryptionOptions);
            ptr2 = options.__destroy_into_raw();
        }
        const ret = wasm.tsbincontroller_encrypt_text(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2);
        return ret;
    }
    /**
     * @param {string} input
     * @param {string} passcode
     * @returns {Promise<TextTrashContent>}
     */
    decrypt_text(input, passcode) {
        const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(passcode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.tsbincontroller_decrypt_text(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {File} file
     * @param {string} passcode
     * @param {EncryptionOptions | null} [options]
     * @param {Function | null} [progress_callback]
     * @returns {Promise<string>}
     */
    encrypt_file(file, passcode, options, progress_callback) {
        const ptr0 = passStringToWasm0(passcode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        let ptr1 = 0;
        if (!isLikeNone(options)) {
            _assertClass(options, EncryptionOptions);
            ptr1 = options.__destroy_into_raw();
        }
        const ret = wasm.tsbincontroller_encrypt_file(this.__wbg_ptr, file, ptr0, len0, ptr1, isLikeNone(progress_callback) ? 0 : addToExternrefTable0(progress_callback));
        return ret;
    }
    /**
     * @param {string} trash_id
     * @param {string} passcode
     * @param {Function | null} [progress_callback]
     * @returns {Promise<FileTrashContent>}
     */
    decrypt_file(trash_id, passcode, progress_callback) {
        const ptr0 = passStringToWasm0(trash_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(passcode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.tsbincontroller_decrypt_file(this.__wbg_ptr, ptr0, len0, ptr1, len1, isLikeNone(progress_callback) ? 0 : addToExternrefTable0(progress_callback));
        return ret;
    }
}
if (Symbol.dispose) TsbinController.prototype[Symbol.dispose] = TsbinController.prototype.free;

const UploadProgressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_uploadprogress_free(ptr >>> 0, 1));

export class UploadProgress {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        UploadProgressFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_uploadprogress_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get total_chunks() {
        const ret = wasm.__wbg_get_uploadprogress_total_chunks(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set total_chunks(arg0) {
        wasm.__wbg_set_uploadprogress_total_chunks(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get uploaded_chunks() {
        const ret = wasm.__wbg_get_uploadprogress_uploaded_chunks(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set uploaded_chunks(arg0) {
        wasm.__wbg_set_uploadprogress_uploaded_chunks(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {Uint32Array}
     */
    get failed_chunks() {
        const ret = wasm.__wbg_get_uploadprogress_failed_chunks(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {Uint32Array} arg0
     */
    set failed_chunks(arg0) {
        const ptr0 = passArray32ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_uploadprogress_failed_chunks(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {boolean}
     */
    get completed() {
        const ret = wasm.__wbg_get_uploadprogress_completed(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} arg0
     */
    set completed(arg0) {
        wasm.__wbg_set_uploadprogress_completed(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {string | undefined}
     */
    get trash_id() {
        const ret = wasm.__wbg_get_uploadprogress_trash_id(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @param {string | null} [arg0]
     */
    set trash_id(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_uploadprogress_trash_id(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) UploadProgress.prototype[Symbol.dispose] = UploadProgress.prototype.free;

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_Error_e17e777aac105295 = function(arg0, arg1) {
        const ret = Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_append_3527acbfa4288a72 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_append_e5f17dc5f7227fe7 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.append(getStringFromWasm0(arg1, arg2), arg3, getStringFromWasm0(arg4, arg5));
    }, arguments) };
    imports.wbg.__wbg_arrayBuffer_2c907ed8e8ef4e35 = function(arg0) {
        const ret = arg0.arrayBuffer();
        return ret;
    };
    imports.wbg.__wbg_arrayBuffer_9c99b8e2809e8cbb = function() { return handleError(function (arg0) {
        const ret = arg0.arrayBuffer();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_13410aac570ffff7 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_a5400b25a865cfd8 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fetch_44b6058021aef5e3 = function(arg0, arg1) {
        const ret = arg0.fetch(arg1);
        return ret;
    };
    imports.wbg.__wbg_filetrashcontent_new = function(arg0) {
        const ret = FileTrashContent.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_instanceof_FormData_3ce681bdc17b2754 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof FormData;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Response_50fde2cd696850bf = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Response;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Window_12d20d558ef92592 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_length_6bb7e81f9d7713e4 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_log_6c7b5f4f00b8ce3f = function(arg0) {
        console.log(arg0);
    };
    imports.wbg.__wbg_name_42b465b8043f111e = function(arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_new_19c25a3f2fa63a02 = function() {
        const ret = new Object();
        return ret;
    };
    imports.wbg.__wbg_new_1f3a344cf3123716 = function() {
        const ret = new Array();
        return ret;
    };
    imports.wbg.__wbg_new_2e3c58a15f39f5f9 = function(arg0, arg1) {
        try {
            var state0 = {a: arg0, b: arg1};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_159(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            const ret = new Promise(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_new_5f7466b3e4256d54 = function() { return handleError(function () {
        const ret = new FormData();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_638ebfaedbf32a5e = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_f6e53210afea8e45 = function() { return handleError(function () {
        const ret = new Headers();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newfromslice_074c56947bd43469 = function(arg0, arg1) {
        const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_newnoargs_254190557c45b4ec = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_newwithstrandinit_b5d168a29a3fd85f = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithu8arraysequence_80b7f1912b2e348c = function() { return handleError(function (arg0) {
        const ret = new Blob(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_of_30e97a7ad6e3518b = function(arg0) {
        const ret = Array.of(arg0);
        return ret;
    };
    imports.wbg.__wbg_ok_2eac216b65d90573 = function(arg0) {
        const ret = arg0.ok;
        return ret;
    };
    imports.wbg.__wbg_parse_442f5ba02e5eaf8b = function() { return handleError(function (arg0, arg1) {
        const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_prototypesetcall_3d4a26c1ed734349 = function(arg0, arg1, arg2) {
        Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_queueMicrotask_25d0739ac89e8c88 = function(arg0) {
        queueMicrotask(arg0);
    };
    imports.wbg.__wbg_queueMicrotask_4488407636f5bf24 = function(arg0) {
        const ret = arg0.queueMicrotask;
        return ret;
    };
    imports.wbg.__wbg_resolve_4055c623acdd6a1b = function(arg0) {
        const ret = Promise.resolve(arg0);
        return ret;
    };
    imports.wbg.__wbg_set_1c17f9738fac2718 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_set_3fda3bac07393de4 = function(arg0, arg1, arg2) {
        arg0[arg1] = arg2;
    };
    imports.wbg.__wbg_set_90f6c0f7bd8c0415 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_setbody_c8460bdf44147df8 = function(arg0, arg1) {
        arg0.body = arg1;
    };
    imports.wbg.__wbg_setheaders_0052283e2f3503d1 = function(arg0, arg1) {
        arg0.headers = arg1;
    };
    imports.wbg.__wbg_setmethod_9b504d5b855b329c = function(arg0, arg1, arg2) {
        arg0.method = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setmode_a23e1a2ad8b512f8 = function(arg0, arg1) {
        arg0.mode = __wbindgen_enum_RequestMode[arg1];
    };
    imports.wbg.__wbg_size_8f84e7768fba0589 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_slice_224856d46230c13c = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.slice(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_static_accessor_GLOBAL_8921f820c2ce3f12 = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_f0a4409105898184 = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_995b214ae681ff99 = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_cde3890479c675ea = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_status_3fea3036088621d6 = function(arg0) {
        const ret = arg0.status;
        return ret;
    };
    imports.wbg.__wbg_stringify_b98c93d0a190446a = function() { return handleError(function (arg0) {
        const ret = JSON.stringify(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_text_0f69a215637b9b34 = function() { return handleError(function (arg0) {
        const ret = arg0.text();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_texttrashcontent_new = function(arg0) {
        const ret = TextTrashContent.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_then_b33a773d723afa3e = function(arg0, arg1, arg2) {
        const ret = arg0.then(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_then_e22500defe16819f = function(arg0, arg1) {
        const ret = arg0.then(arg1);
        return ret;
    };
    imports.wbg.__wbg_type_286052cf9318fb63 = function(arg0, arg1) {
        const ret = arg1.type;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_wbindgencbdrop_eb10308566512b88 = function(arg0) {
        const obj = arg0.original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        const ret = false;
        return ret;
    };
    imports.wbg.__wbg_wbindgendebugstring_99ef257a3ddda34d = function(arg0, arg1) {
        const ret = debugString(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_wbindgenisfunction_8cee7dce3725ae74 = function(arg0) {
        const ret = typeof(arg0) === 'function';
        return ret;
    };
    imports.wbg.__wbg_wbindgenisundefined_c4b71d073b92f3c5 = function(arg0) {
        const ret = arg0 === undefined;
        return ret;
    };
    imports.wbg.__wbg_wbindgenstringget_0f16a6ddddef376f = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_wbindgenthrow_451ec1a8469d7eb6 = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(String) -> Externref`.
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_4625c577ab2ec9ee = function(arg0) {
        // Cast intrinsic for `U64 -> Externref`.
        const ret = BigInt.asUintN(64, arg0);
        return ret;
    };
    imports.wbg.__wbindgen_cast_5d20a5358f99a210 = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 75, function: Function { arguments: [Externref], shim_idx: 76, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, 75, __wbg_adapter_10);
        return ret;
    };
    imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
        // Cast intrinsic for `F64 -> Externref`.
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_2;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedBigUint64ArrayMemory0 = null;
    cachedDataViewMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('tsbin_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;

import { fileKey } from "@/lib/keystore";

/**
 * AES-256-GCM envelope for file contents — SRS 3.5.3.2 and 3.5.3.3: bytes are
 * sealed here, in the browser, and reach the server as ciphertext only.
 *
 *   magic "CORTA1" | typeLen (1) | content type | iv (12) | ciphertext + tag
 *
 * The whole header is passed as additional authenticated data, so the recorded
 * content type and the IV cannot be swapped without the tag failing. The
 * original content type travels inside the envelope because the upload declares
 * `ENCRYPTED_MIME` to the server instead — what is on the wire says only that
 * something is encrypted, not what.
 */
const MAGIC = "CORTA1";
const IV_BYTES = 12;
const MAGIC_BYTES = new TextEncoder().encode(MAGIC);
const TYPE_AT = MAGIC.length + 1;
const FALLBACK_TYPE = "application/octet-stream";

/** What the server stores as the content type, so a file list can show the lock. */
const ENCRYPTED_MIME = "application/vnd.corta.encrypted";

const utf8 = new TextEncoder();
const text = new TextDecoder();

/** True when these bytes carry a complete envelope this app wrote. */
function isSealed(bytes: Uint8Array): boolean {
  if (bytes.length <= TYPE_AT) return false;
  if (!MAGIC_BYTES.every((byte, index) => bytes[index] === byte)) return false;
  return bytes.length > TYPE_AT + bytes[MAGIC.length] + IV_BYTES;
}

async function encrypt(file: File): Promise<File> {
  const key = await fileKey();
  const type = utf8.encode(file.type || FALLBACK_TYPE).slice(0, 255);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const header = new Uint8Array(TYPE_AT + type.length + IV_BYTES);
  header.set(MAGIC_BYTES);
  header[MAGIC.length] = type.length;
  header.set(type, TYPE_AT);
  header.set(iv, TYPE_AT + type.length);

  const sealed = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: header },
    key,
    await file.arrayBuffer()
  );

  return new File([header, sealed], file.name, { type: ENCRYPTED_MIME });
}

/** Unsealed bytes, with the content type the envelope recorded at upload. */
async function decrypt(payload: Blob): Promise<Blob> {
  const bytes = new Uint8Array(await payload.arrayBuffer());
  // Files that predate encryption — or that another client wrote in the clear —
  // come back untouched rather than failing to open.
  if (!isSealed(bytes)) return payload;

  const key = await fileKey();
  const typeLength = bytes[MAGIC.length];
  const bodyAt = TYPE_AT + typeLength + IV_BYTES;
  const header = bytes.subarray(0, bodyAt);

  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.subarray(TYPE_AT + typeLength, bodyAt), additionalData: header },
      key,
      bytes.subarray(bodyAt)
    );
    return new Blob([plain], { type: text.decode(bytes.subarray(TYPE_AT, TYPE_AT + typeLength)) });
  } catch {
    // GCM fails the same way for a wrong key and for tampered bytes; neither is
    // something the reader can act on beyond knowing the file will not open.
    throw new Error("Could not decrypt this file — it was sealed with a different key");
  }
}

export const fileCrypto = { mime: ENCRYPTED_MIME, encrypt, decrypt };

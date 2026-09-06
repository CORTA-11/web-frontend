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

async function encrypt(file: File, key?: CryptoKey): Promise<{ file: File; iv: Uint8Array }> {
  const encKey = key ?? (await fileKey());
  const type = utf8.encode(file.type || FALLBACK_TYPE).slice(0, 255);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const header = new Uint8Array(TYPE_AT + type.length + IV_BYTES);
  header.set(MAGIC_BYTES);
  header[MAGIC.length] = type.length;
  header.set(type, TYPE_AT);
  header.set(iv, TYPE_AT + type.length);

  const sealed = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: header },
    encKey,
    await file.arrayBuffer()
  );

  return {
    file: new File([header, sealed], file.name, { type: ENCRYPTED_MIME }),
    iv,
  };
}

/** Unsealed bytes, with the content type the envelope recorded at upload. */
async function decrypt(payload: Blob, key?: CryptoKey): Promise<Blob> {
  const bytes = new Uint8Array(await payload.arrayBuffer());
  // Files that predate encryption — or that another client wrote in the clear —
  // come back untouched rather than failing to open.
  if (!isSealed(bytes)) return payload;

  const decKey = key ?? (await fileKey());
  const typeLength = bytes[MAGIC.length];
  const bodyAt = TYPE_AT + typeLength + IV_BYTES;
  const header = bytes.subarray(0, bodyAt);

  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.subarray(TYPE_AT + typeLength, bodyAt), additionalData: header },
      decKey,
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

/**
 * E2EE key material. The server only ever sees the RSA public key plus the
 * private key sealed with a password-derived key (PBKDF2-SHA256, AES-GCM), so
 * ownership of the private key stays with the password, never with the server.
 */
export const E2EE = {
  /** Password → key derivation iterations. Matches the core-api minimum. */
  KEK_ITERATIONS: 600_000,
  /** 16 random bytes, base64 — one per account, stored with the sealed key. */
  randomSalt(): string {
    return base64(crypto.getRandomValues(new Uint8Array(16)));
  },
  /** Derives the AES-GCM key that seals/unseals the RSA private key. */
  async deriveKEK(password: string, saltB64: string, iterations: number): Promise<CryptoKey> {
    const material = await crypto.subtle.importKey("raw", utf8.encode(password), "PBKDF2", false, [
      "deriveBits",
    ]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: unbase64(saltB64), iterations },
      material,
      256
    );
    return crypto.subtle.importKey("raw", bits, "AES-GCM", false, ["encrypt", "decrypt"]);
  },
  async generateKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
      { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["encrypt", "decrypt"]
    );
  },
  /** SPKI DER, base64 — what core-api records as the user's public key. */
  async exportPublicKey(key: CryptoKey): Promise<string> {
    return base64(new Uint8Array(await crypto.subtle.exportKey("spki", key)));
  },
  /** Builds an unwrap-only key from a recorded public key. */
  async importPublicKey(spkiB64: string): Promise<CryptoKey> {
    return crypto.subtle.importKey("spki", unbase64(spkiB64), { name: "RSA-OAEP", hash: "SHA-256" }, false, [
      "encrypt",
    ]);
  },
  /** Keeps the private key as an unexportable CryptoKey in memory for the tab. */
  importPrivateJWK(jwk: JsonWebKey): Promise<CryptoKey> {
    return crypto.subtle.importKey("jwk", jwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
  },
  /** iv(12) | AES-GCM(sealed JWK) → base64. */
  async sealPrivateJWK(jwk: JsonWebKey, password: string, saltB64: string, iterations: number): Promise<string> {
    const kek = await this.deriveKEK(password, saltB64, iterations);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const sealed = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      kek,
      utf8.encode(JSON.stringify(jwk))
    );
    const body = new Uint8Array(iv.length + sealed.byteLength);
    body.set(iv);
    body.set(new Uint8Array(sealed), iv.length);
    return base64(body);
  },
  /** Reverses sealPrivateJWK; throws when the password is wrong. */
  async unsealPrivateJWK(sealedB64: string, password: string, saltB64: string, iterations: number): Promise<JsonWebKey> {
    const body = unbase64(sealedB64);
    if (body.length <= 12) throw new Error("The stored key envelope is malformed");
    const kek = await this.deriveKEK(password, saltB64, iterations);
    let plain: ArrayBuffer;
    try {
      plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: body.subarray(0, 12) },
        kek,
        body.subarray(12)
      );
    } catch {
      throw new Error("Wrong password — the private key could not be unlocked");
    }
    return JSON.parse(text.decode(new Uint8Array(plain)));
  },
  /** RSA-OAEP wrap of the team symmetric key for one member. */
  async wrapFor(memberPublicKey: CryptoKey, rawSymmetric: ArrayBuffer): Promise<string> {
    return base64(new Uint8Array(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, memberPublicKey, rawSymmetric)));
  },
  /** RSA-OAEP unwrap of the caller's copy. */
  async unwrap(privateKey: CryptoKey, wrappedB64: string): Promise<ArrayBuffer> {
    return crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, unbase64(wrappedB64));
  },
  async generateTeamKey(): Promise<{ aes: CryptoKey; raw: ArrayBuffer }> {
    const aes = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
      "encrypt",
      "decrypt",
    ]);
    return { aes, raw: await crypto.subtle.exportKey("raw", aes) };
  },
  async importTeamKey(raw: ArrayBuffer): Promise<CryptoKey> {
    return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
  },
};

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function unbase64(value: string): Uint8Array<ArrayBuffer> {
  const raw = atob(value);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Development key for mock file storage. Live files use per-team wrapped keys. */
const STORAGE_KEY = "corta.file-key";

/** Placeholder 256-bit key, base64. Used only by the mock storage path. */
const FIXED_KEY = "mOa+YAJZ/k6K44ZZN3HYJScmvuQ7uFfLljWDie9VYeo=";

let cached: Promise<CryptoKey> | null = null;

/** Reads the saved key, writing the fixed one the first time a browser asks. */
function savedKeyMaterial(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    localStorage.setItem(STORAGE_KEY, FIXED_KEY);
  } catch {
    // Storage can be blocked (private mode, site-data rules). Files still
    // encrypt this session; the key just does not survive a reload.
  }
  return FIXED_KEY;
}

async function importKey(): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("File encryption needs a secure context — open the app over HTTPS or on localhost");
  }

  const raw = Uint8Array.from(atob(savedKeyMaterial()), (char) => char.charCodeAt(0));
  if (raw.length !== 32) {
    throw new Error("The file key saved in this browser is not a 256-bit key");
  }

  // Not extractable: once imported, the key can encrypt and decrypt but can no
  // longer be read back out by any code on the page.
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Cached, because every upload and download needs the same imported key. */
export const fileKey = () =>
  (cached ??= importKey().catch((error) => {
    cached = null;
    throw error;
  }));

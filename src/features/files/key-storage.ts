const storageKey = (accountId: string) => `synodus.e2ee.private-key:${accountId}`;

function persist(accountId: string, jwk: JsonWebKey) {
  localStorage.setItem(storageKey(accountId), JSON.stringify(jwk));
}

function read(accountId: string): JsonWebKey | null {
  const raw = localStorage.getItem(storageKey(accountId));
  if (!raw) return null;
  try {
    const jwk = JSON.parse(raw) as JsonWebKey;
    return jwk && jwk.d ? jwk : null;
  } catch {
    return null;
  }
}

/** The unsealed private key is kept per account, so switching accounts (or a
 * shared browser) never reads another account's key. */
export const deviceKeyStorage = { persist, read };
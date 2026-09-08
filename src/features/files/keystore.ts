import { ApiError } from "@/lib/http";
import { E2EE } from "@/lib/crypto";
import { deviceKeyStorage } from "@/features/files/key-storage";
import { keysApi, type TeamKeyView, type TeamKeyWrap, type UserKeyView } from "@/features/files/api";

const WRAP_ALGORITHM = "rsa-oaep-2048";
/** The RSA private key — in memory while the tab lives; a device copy lets a
 * reload or new login unlock without the password being asked again. */
/* This module keeps the memory copy; key-storage.ts handles the device copy. */
let unlockedPrivateKey: CryptoKey | null = null;

/** Auto-unlocks from the device copy; false means the password is needed. */
export async function restoreUserKeysFromStorage(accountId: string): Promise<boolean> {
  if (unlockedPrivateKey) return true;
  const jwk = deviceKeyStorage.read(accountId);
  if (!jwk) return false;
  unlockedPrivateKey = await E2EE.importPrivateJWK(jwk);
  return true;
}

/** Unwrapped AES keys per team key version, so downloads do not re-derive. */
const teamKeyCache = new Map<string, CryptoKey>();
const cacheKey = (teamId: string, version: number) => `${teamId}:${version}`;

export function isUserKeyUnlocked(): boolean {
  return unlockedPrivateKey !== null;
}

function requireUnlockedPrivateKey(): CryptoKey {
  if (!unlockedPrivateKey) throw new Error("Your encryption keys are locked — unlock with your password");
  return unlockedPrivateKey;
}

/** Login/register path: unseal with the password just typed, or seed a fresh
 * pair when the server has none; persist the result for this device. */
export async function seedOrUnlockUserKeys(password: string, accountId: string): Promise<void> {
  if (unlockedPrivateKey) return;

  let row: UserKeyView | null = null;
  try {
    row = await keysApi.getUserKeys();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) row = null;
    else throw error;
  }

  if (!row || !row.encrypted_private_key || !row.kek_salt) {
    await seedUserKeys(password, accountId);
    return;
  }
  const jwk = await E2EE.unsealPrivateJWK(
    row.encrypted_private_key,
    password,
    row.kek_salt,
    row.kek_iterations ?? 1
  );
  deviceKeyStorage.persist(accountId, jwk);
  unlockedPrivateKey = await E2EE.importPrivateJWK(jwk);
}

async function seedUserKeys(password: string, accountId: string): Promise<void> {
  const pair = await E2EE.generateKeyPair();
  const publicKey = await E2EE.exportPublicKey(pair.publicKey);
  const salt = E2EE.randomSalt();
  const iterations = E2EE.KEK_ITERATIONS;
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const sealed = await E2EE.sealPrivateJWK(jwk, password, salt, iterations);

  await keysApi.upsertUserKeys({
    public_key: publicKey,
    encrypted_private_key: sealed,
    kek_salt: salt,
    kek_iterations: iterations,
    kek_algorithm: "pbkdf2-sha256",
  });
  deviceKeyStorage.persist(accountId, jwk);
  unlockedPrivateKey = await E2EE.importPrivateJWK(jwk);
}

/** The team symmetric key for the next upload — reuse the active version while
 * it covers the membership, otherwise make the next version for everyone. */
export async function getOrCreateTeamKey(orgId: string, teamId: string): Promise<{ key: CryptoKey; version: number }> {
  const privateKey = requireUnlockedPrivateKey();
  const [versions, members] = await Promise.all([
    keysApi.listTeamKeys(orgId, teamId),
    keysApi.getPublicKeysForTeam(orgId, teamId),
  ]);
  const active = versions.find((version) => version.status === "active");
  const memberIds = members.map((member) => member.user_id);
  const coversMembers =
    active !== undefined &&
    memberIds.every((id) => active.wrapped_user_ids.includes(id)) &&
    active.wrapped_user_ids.every((id) => memberIds.includes(id));

  if (active && active.wraps.length > 0 && coversMembers) {
    const key = await unwrapTeamKey(active, privateKey);
    teamKeyCache.set(cacheKey(teamId, active.version), key);
    return { key, version: active.version };
  }

  const { aes, raw } = await E2EE.generateTeamKey();
  const wraps: TeamKeyWrap[] = [];
  for (const member of members) {
    try {
      const publicKey = await E2EE.importPublicKey(member.public_key);
      wraps.push({ user_id: member.user_id, key: await E2EE.wrapFor(publicKey, raw), algorithm: WRAP_ALGORITHM });
    } catch {
      // A member without a usable key misses this version; a later uploader with
      // one rotates them in.
    }
  }
  let version: TeamKeyView;
  try {
    version = await keysApi.createTeamKey(orgId, teamId, wraps);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      // A concurrent uploader already rotated; adopt the winner instead of
      // retrying the create and colliding on the version number.
      const latest = (await keysApi.listTeamKeys(orgId, teamId)).find((entry) => entry.status === "active");
      if (latest && latest.wraps.length > 0) {
        const key = await unwrapTeamKey(latest, privateKey);
        teamKeyCache.set(cacheKey(teamId, latest.version), key);
        return { key, version: latest.version };
      }
    }
    throw error;
  }
  teamKeyCache.set(cacheKey(teamId, version.version), aes);
  return { key: aes, version: version.version };
}

/** The team symmetric key for a specific file version (download path). */
export async function getTeamKey(orgId: string, teamId: string, version: number): Promise<CryptoKey> {
  const cached = teamKeyCache.get(cacheKey(teamId, version));
  if (cached) return cached;
  const privateKey = requireUnlockedPrivateKey();
  const versions = await keysApi.listTeamKeys(orgId, teamId);
  const target = versions.find((entry) => entry.version === version);
  if (!target || target.wraps.length === 0) throw new Error(`Team key for version ${version} is not available`);
  const key = await unwrapTeamKey(target, privateKey);
  teamKeyCache.set(cacheKey(teamId, version), key);
  return key;
}

/** The serve‑side wrap list only exposes the caller's own copy. */
async function unwrapTeamKey(view: TeamKeyView, privateKey: CryptoKey): Promise<CryptoKey> {
  const wrap = view.wraps[0];
  if (!wrap) throw new Error("No key material is recorded for this team");
  return E2EE.importTeamKey(await E2EE.unwrap(privateKey, wrap.key));
}

/**
 * The leader's client re-wraps team key versions for a member who joined after
 * they rotated. Old versions become visible to that member only here — approve
 * must run after this succeeds, so approve just records the decision.
 */
export async function grantMemberAccess(orgId: string, teamId: string, memberUserId: string): Promise<number> {
  const privateKey = requireUnlockedPrivateKey();
  const members = await keysApi.getPublicKeysForTeam(orgId, teamId);
  const member = members.find((entry) => entry.user_id === memberUserId);
  if (!member) throw new Error("That member has no recorded encryption key");
  const publicKey = await E2EE.importPublicKey(member.public_key);

  const versions = await keysApi.listTeamKeys(orgId, teamId);
  let count = 0;
  for (const version of versions) {
    if (version.wraps.length === 0 || version.wrapped_user_ids.includes(memberUserId)) continue;
    const raw = await E2EE.unwrap(privateKey, version.wraps[0].key);
    await keysApi.addTeamKeyMemberWrap(orgId, teamId, version.version, {
      user_id: memberUserId,
      key: await E2EE.wrapFor(publicKey, raw),
      algorithm: WRAP_ALGORITHM,
    });
    count += 1;
  }
  return count;
}
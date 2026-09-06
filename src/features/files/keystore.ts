import { api, ApiError } from "@/lib/http";
import { E2EE } from "@/lib/crypto";

export type TeamKeyWrap = {
  user_id: string;
  key: string;
  algorithm: string;
};
export type UserKeyView = {
  user_id: string;
  public_key: string;
  encrypted_private_key?: string | null;
  kek_salt?: string | null;
  kek_iterations?: number | null;
  kek_algorithm?: string | null;
};

export type TeamKeyView = {
  id: number;
  team_id: string;
  version: number;
  status: string;
  algorithm: string;
  wraps: TeamKeyWrap[];
  wrapped_user_ids: string[];
  created_by: string;
  created_at: string;
};

export const keysApi = {
  getUserKeys: () => api<UserKeyView>("/v1/auth/user-keys", { method: "GET" }),

  upsertUserKeys: (update: {
    public_key: string;
    encrypted_private_key: string;
    kek_salt: string;
    kek_iterations: number;
    kek_algorithm: string;
  }) => api<UserKeyView>("/v1/auth/user-keys", { method: "PUT", json: update }),

  getPublicKeysForTeam: (orgId: string, teamId: string) =>
    api<{ user_id: string; public_key: string; created_at: string }[]>(
      `/v1/orgs/${orgId}/teams/${teamId}/members/public-keys`
    ),

  createTeamKey: (orgId: string, teamId: string, wraps: TeamKeyWrap[]) =>
    api<TeamKeyView>(`/v1/orgs/${orgId}/teams/${teamId}/keys`, {
      method: "POST",
      json: { algorithm: "aes-256-gcm", wraps },
    }),

  listTeamKeys: (orgId: string, teamId: string) =>
    api<TeamKeyView[]>(`/v1/orgs/${orgId}/teams/${teamId}/keys`, { method: "GET" }),
};

const WRAP_ALGORITHM = "rsa-oaep-2048";
/** The RSA private key — the unlock secret — lives in this module only, never
 * localStorage. A reload (new tab) loses it and asks for the password again. */
let unlockedPrivateKey: CryptoKey | null = null;

/** Unwrapped AES keys per team key version, so downloads do not re-derive. */
const teamKeyCache = new Map<string, CryptoKey>();
const cacheKey = (teamId: string, version: number) => `${teamId}:${version}`;

export function isUserKeyUnlocked(): boolean {
  return unlockedPrivateKey !== null;
}

function requireUnlockedPrivateKey(): CryptoKey {
  if (!unlockedPrivateKey) {
    throw new Error("Your encryption keys are locked — unlock with your password");
  }
  return unlockedPrivateKey;
}

/**
 * Login/register path: unlock the sealed key with the password just typed, or
 * create and seal a fresh pair when the server has none on record.
 */
export async function seedOrUnlockUserKeys(password: string): Promise<void> {
  if (unlockedPrivateKey) return;

  let row: UserKeyView | null = null;
  try {
    row = await keysApi.getUserKeys();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) row = null;
    else throw error;
  }

  if (!row || !row.encrypted_private_key || !row.kek_salt) {
    await seedUserKeys(password);
    return;
  }
  unlockedPrivateKey = await E2EE.importPrivateJWK(
    await E2EE.unsealPrivateJWK(row.encrypted_private_key, password, row.kek_salt, row.kek_iterations ?? 1)
  );
}

async function seedUserKeys(password: string): Promise<void> {
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
  unlockedPrivateKey = await E2EE.importPrivateJWK(jwk);
}

/**
 * The team symmetric key for the next upload. A version already covering the
 * caller and the current membership is reused; a new member, a departed member,
 * or a caller locked out of the active version recreates it for everyone via
 * the next version number.
 */
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
      // A member without a usable key cannot decrypt this version; rotation by
      // the next uploader with a key will include them.
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
  if (!target || target.wraps.length === 0) {
    throw new Error(`Team key for version ${version} is not available`);
  }

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
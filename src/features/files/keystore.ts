import { api } from "@/lib/http";
import type { User } from "@/lib/types";

export type UserPublicKey = {
  user_id: string;
  public_key: string;
  created_at: string;
};

export type TeamSharedKey = {
  team_id: string;
  user_id: string;
  encrypted_key: string;
  key_version: number;
  created_at: string;
};

export const keysApi = {
  upsertPublicKey: (publicKey: string) =>
    api<UserPublicKey>("/v1/auth/public-key", {
      method: "PUT",
      json: { public_key: publicKey },
    }),

  getPublicKeysForTeam: (orgId: string, teamId: string) =>
    api<UserPublicKey[]>(`/v1/orgs/${orgId}/teams/${teamId}/members/public-keys`),

  upsertTeamSharedKeys: (orgId: string, teamId: string, keys: Omit<TeamSharedKey, "created_at">[]) =>
    api<void>(`/v1/orgs/${orgId}/teams/${teamId}/keys`, {
      method: "POST",
      json: keys,
    }),

  listTeamSharedKeysForUser: (orgId: string, teamId: string) =>
    api<TeamSharedKey[]>(`/v1/orgs/${orgId}/teams/${teamId}/keys`),
};

async function getUserPrivateKey(userPublicId: string): Promise<CryptoKey> {
  const privKeyName = `corta.user-private-key:${userPublicId}`;
  const privKeyStr = localStorage.getItem(privKeyName);
  if (!privKeyStr) {
    throw new Error("User private key not found in localStorage");
  }
  const jwk = JSON.parse(privKeyStr);
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

async function getMemberPublicKey(pubKeyBase64: string): Promise<CryptoKey> {
  const binaryDerString = atob(pubKeyBase64);
  const binaryDer = Uint8Array.from(binaryDerString, (char) => char.charCodeAt(0));
  return window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

export async function initializeUserKeys(user: User): Promise<void> {
  if (!user.public_id) return;
  const privKeyName = `corta.user-private-key:${user.public_id}`;
  const pubKeyName = `corta.user-public-key:${user.public_id}`;

  if (localStorage.getItem(privKeyName) && localStorage.getItem(pubKeyName)) {
    const pubKeyBase64 = localStorage.getItem(pubKeyName)!;
    await keysApi.upsertPublicKey(pubKeyBase64);
    return;
  }

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedPub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const pubKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedPub)));

  const exportedPriv = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const privKeyStr = JSON.stringify(exportedPriv);

  localStorage.setItem(privKeyName, privKeyStr);
  localStorage.setItem(pubKeyName, pubKeyBase64);

  await keysApi.upsertPublicKey(pubKeyBase64);
}

export async function getOrCreateTeamKey(orgId: string, teamId: string, user: User): Promise<{ key: CryptoKey; version: number }> {
  if (!user.public_id) {
    throw new Error("User UUID is not loaded");
  }

  const sharedKeys = await keysApi.listTeamSharedKeysForUser(orgId, teamId);

  if (sharedKeys.length > 0) {
    const latest = sharedKeys[0];
    const myPrivateKey = await getUserPrivateKey(user.public_id);
    const encryptedRaw = Uint8Array.from(atob(latest.encrypted_key), (char) => char.charCodeAt(0));
    const decryptedRaw = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      myPrivateKey,
      encryptedRaw
    );

    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      decryptedRaw,
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );

    return { key: aesKey, version: latest.key_version };
  }

  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const rawSymmetric = await window.crypto.subtle.exportKey("raw", aesKey);

  const memberPublicKeys = await keysApi.getPublicKeysForTeam(orgId, teamId);

  const sharedKeysToUpload: Omit<TeamSharedKey, "created_at">[] = [];
  for (const member of memberPublicKeys) {
    try {
      const pubKey = await getMemberPublicKey(member.public_key);
      const encryptedRaw = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        pubKey,
        rawSymmetric
      );
      const encryptedKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedRaw)));

      sharedKeysToUpload.push({
        team_id: teamId,
        user_id: member.user_id,
        encrypted_key: encryptedKeyBase64,
        key_version: 1,
      });
    } catch (e) {
      console.error(`Failed to encrypt key for member ${member.user_id}:`, e);
    }
  }

  if (sharedKeysToUpload.length > 0) {
    await keysApi.upsertTeamSharedKeys(orgId, teamId, sharedKeysToUpload);
  }

  return { key: aesKey, version: 1 };
}

export async function getTeamKey(orgId: string, teamId: string, version: number, user: User): Promise<CryptoKey> {
  if (!user.public_id) {
    throw new Error("User UUID is not loaded");
  }

  const sharedKeys = await keysApi.listTeamSharedKeysForUser(orgId, teamId);
  const targetKey = sharedKeys.find((k) => k.key_version === version);
  if (!targetKey) {
    throw new Error(`Team key for version ${version} not found`);
  }

  const myPrivateKey = await getUserPrivateKey(user.public_id);
  const encryptedRaw = Uint8Array.from(atob(targetKey.encrypted_key), (char) => char.charCodeAt(0));
  const decryptedRaw = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    myPrivateKey,
    encryptedRaw
  );

  return window.crypto.subtle.importKey(
    "raw",
    decryptedRaw,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function loadKeys() {
  const recorded = [];
  const deviceKeys = new Map();
  let accountId = "account-a";
  class ApiError extends Error {
    constructor(status) { super("Missing key"); this.status = status; }
  }
  const dependencies = {
    "@/lib/http": { ApiError },
    "@/lib/crypto": { E2EE: {
      generateKeyPair: async () => ({ publicKey: {}, privateKey: {} }),
      exportPublicKey: async () => "public-key",
      randomSalt: () => "salt",
      KEK_ITERATIONS: 1000,
      sealPrivateJWK: async () => "sealed-private-key",
      importPrivateJWK: async () => ({}),
      importPublicKey: async () => ({}),
    } },
    "@/features/files/key-storage": { deviceKeyStorage: {
      read: (accountId) => deviceKeys.get(accountId),
      persist: (accountId, jwk) => deviceKeys.set(accountId, jwk),
    } },
    "@/features/files/api": { keysApi: {
      getUserKeys: async () => { throw new ApiError(404); },
      upsertUserKeys: async (key) => recorded.push({ ...key, user_id: accountId }),
      getPublicKeysForTeam: async () => recorded,
      listTeamKeys: async () => [],
    } },
  };
  const compiled = ts.transpileModule(readFileSync(new URL("../src/features/files/keystore.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", "crypto", compiled)(
    (name) => { assert.ok(name in dependencies, name); return dependencies[name]; },
    loaded, loaded.exports, { subtle: { exportKey: async () => ({ kty: "RSA" }) } },
  );
  return { keys: loaded.exports, recorded, deviceKeys, setAccount: (id) => { accountId = id; } };
}

test("switching accounts creates a public encryption key for each requester", async () => {
  const { keys, recorded, deviceKeys, setAccount } = loadKeys();
  await keys.seedOrUnlockUserKeys("password-a", "account-a");
  setAccount("account-b");
  await keys.seedOrUnlockUserKeys("password-b", "account-b");
  assert.equal(recorded.length, 2, "the second account must not reuse the first account's unlocked key");
  assert.ok(deviceKeys.has("account-a"));
  assert.ok(deviceKeys.has("account-b"));
});

test("restoring another account without a device key does not reuse the previous account", async () => {
  const { keys } = loadKeys();
  await keys.seedOrUnlockUserKeys("password-a", "account-a");
  assert.equal(await keys.restoreUserKeysFromStorage("account-b"), false);
  assert.equal(keys.isUserKeyUnlocked(), false);
});

test("repeated unlock for the same account does not rotate its key", async () => {
  const { keys, recorded } = loadKeys();
  await keys.seedOrUnlockUserKeys("password-a", "account-a");
  await keys.seedOrUnlockUserKeys("password-a", "account-a");
  assert.equal(recorded.length, 1);
});

test("a requester initialized after an account switch is available to the leader's approval flow", async () => {
  const { keys, setAccount } = loadKeys();
  await keys.seedOrUnlockUserKeys("password-a", "account-a");
  setAccount("account-b");
  await keys.seedOrUnlockUserKeys("password-b", "account-b");
  setAccount("account-a");
  await keys.restoreUserKeysFromStorage("account-a");
  await assert.doesNotReject(keys.grantMemberAccess("org", "team", "account-b"));
});

test("logout forgets plaintext keys but preserves the account's device copy", async () => {
  const { keys, deviceKeys } = loadKeys();
  await keys.seedOrUnlockUserKeys("password-a", "account-a");
  keys.clearUserKeys();
  assert.equal(keys.isUserKeyUnlocked(), false);
  assert.ok(deviceKeys.has("account-a"));
  assert.equal(await keys.restoreUserKeysFromStorage("account-a"), true);
  assert.equal(keys.isUserKeyUnlocked(), true);
});

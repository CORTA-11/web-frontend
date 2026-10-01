import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function loadRotation({ unlocked = true, members = [
  { user_id: "leader", public_key: "leader-public" },
  { user_id: "member", public_key: "member-public" },
], invalidKey = false, createError } = {}) {
  const created = [];
  let generated = 0;
  const dependencies = {
    "@/features/files/keystore": { isUserKeyUnlocked: () => unlocked },
    "@/lib/crypto": { E2EE: {
      importPublicKey: async (key) => {
        if (invalidKey) throw new Error("Invalid public key");
        return key;
      },
      generateTeamKey: async () => ({ raw: `fresh-key-${++generated}` }),
      wrapFor: async (key, raw) => `${key}:${raw}`,
    } },
    "@/features/files/api": { keysApi: {
      getPublicKeysForTeam: async (org, team) => {
        assert.equal(org, "org");
        assert.equal(team, "team");
        return members;
      },
      createTeamKey: async (org, team, wraps) => {
        created.push({ org, team, wraps });
        if (createError) throw createError;
        return { version: created.length + 1, status: "active" };
      },
    } },
  };
  const compiled = ts.transpileModule(readFileSync(new URL("../src/features/files/rotate-team-key.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (name) => { assert.ok(name in dependencies, name); return dependencies[name]; },
    loaded, loaded.exports,
  );
  return { rotate: () => loaded.exports.rotateTeamKey("org", "team"), created, generated: () => generated };
}

test("explicit rotations generate fresh keys and wrap each registered current member", async () => {
  const { rotate, created } = loadRotation();
  assert.equal((await rotate()).version, 2);
  assert.equal((await rotate()).version, 3);
  assert.deepEqual(created[0], { org: "org", team: "team", wraps: [
    { user_id: "leader", key: "leader-public:fresh-key-1", algorithm: "rsa-oaep-2048" },
    { user_id: "member", key: "member-public:fresh-key-1", algorithm: "rsa-oaep-2048" },
  ] });
  assert.equal(created[1].wraps[0].key, "leader-public:fresh-key-2");
});

test("locked keys prevent rotation", async () => {
  const { rotate, created, generated } = loadRotation({ unlocked: false });
  await assert.rejects(rotate(), /Unlock/);
  assert.equal(generated(), 0);
  assert.equal(created.length, 0);
});

test("an empty recipient list does not supersede the old key", async () => {
  const { rotate, created } = loadRotation({ members: [] });
  await assert.rejects(rotate(), /No team members/);
  assert.equal(created.length, 0);
});

test("invalid registered public keys abort rather than silently omit members", async () => {
  const { rotate, created, generated } = loadRotation({ invalidKey: true });
  await assert.rejects(rotate(), /Invalid public key/);
  assert.equal(generated(), 0);
  assert.equal(created.length, 0);
});

test("a failed commit is reported without retrying or adopting another key", async () => {
  const error = new Error("Conflict");
  const { rotate, created } = loadRotation({ createError: error });
  await assert.rejects(rotate(), (actual) => actual === error);
  assert.equal(created.length, 1);
});

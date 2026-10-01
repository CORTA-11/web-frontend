import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("../src/features/files/api.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function filesApi(file, live = true) {
  const loaded = { exports: {} };
  const dependencies = {
    "@/lib/env": { isLive: () => live },
    "@/lib/http": { api: async () => [file] },
    "@/lib/crypto": {},
    "@/lib/keystore": {},
    "@/features/files/keystore": {},
  };
  new Function("require", "module", "exports", compiled)((name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, loaded, loaded.exports);
  return loaded.exports.filesApi;
}

test("live file listings display the uploader's name", async () => {
  const [file] = await filesApi({ uploaded_by: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", uploaded_by_name: "Alex Smith" }).list("team", "org");
  assert.equal(file.uploaded_by_name, "Alex Smith");
});

test("a missing uploader name has a readable fallback, not a blank or UUID", async () => {
  for (const uploaded_by_name of [undefined, "", "   "]) {
    const [file] = await filesApi({ uploaded_by: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", uploaded_by_name }).list("team", "org");
    assert.equal(file.uploaded_by_name, "Unknown uploader");
  }
});

test("mock file listings retain their uploader names", async () => {
  const [file] = await filesApi({ uploaded_by_name: "Alex Smith" }, false).list("team", "org");
  assert.equal(file.uploaded_by_name, "Alex Smith");
});

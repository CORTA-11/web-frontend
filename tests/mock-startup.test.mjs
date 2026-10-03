import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync(new URL("../src/mocks/browser.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

test("concurrent provider effects start only one mock worker", async () => {
  let workers = 0;
  let starts = 0;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", source)((name) => {
    if (name === "@/mocks/handlers") return { handlers: [] };
    assert.equal(name, "msw/browser");
    return { setupWorker: () => {
      workers++;
      return { start: () => {
        starts++;
        return Promise.resolve();
      } };
    } };
  }, loaded, loaded.exports);

  const first = loaded.exports.startMocks();
  const second = loaded.exports.startMocks();
  await Promise.all([first, second]);
  assert.equal(workers, 1);
  assert.equal(starts, 1);
  assert.equal(first, second);
  await loaded.exports.startMocks();
  assert.equal(starts, 1);
});

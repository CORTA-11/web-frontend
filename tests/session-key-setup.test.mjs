import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

function load(path, dependencies) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled)((name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, loaded, loaded.exports);
  return loaded.exports;
}

function sessionHarness() {
  const events = [];
  let finishSetup;
  const setup = new Promise((resolve) => { finishSetup = resolve; });
  const hooks = load("../src/features/auth/session.ts", {
    "@tanstack/react-query": {
      useMutation: (options) => options,
      useQueryClient: () => ({
        setQueryData: () => events.push("session"),
        invalidateQueries: () => events.push("invalidate"),
        clear: () => events.push("cache cleared"),
      }),
    },
    "next/navigation": {
      useRouter: () => ({ replace: () => events.push("navigate") }),
      useSearchParams: () => ({ get: () => null }),
    },
    sonner: { toast: {} },
    "@/features/auth/api": { authApi: {} },
    "@/lib/env": { isLive: () => true },
    "@/lib/query-keys": { qk: { session: ["session"], userKeys: ["keys"] } },
    "@/lib/token": { setCSRFToken: () => events.push("csrf cleared") },
    "@/lib/query": { notifyError: () => {} },
    "@/lib/http": { ApiError: Error },
    "@/features/files/api": { keysApi: {} },
    "@/features/files/keystore": {
      seedOrUnlockUserKeys: () => { events.push("setup"); return setup; },
      clearUserKeys: () => events.push("keys cleared"),
    },
  });
  return { hooks, events, finishSetup };
}

for (const hookName of ["useLogin", "useRegister"]) {
  test(`${hookName} completes encryption setup before exposing the session`, async () => {
    const { hooks, events, finishSetup } = sessionHarness();
    const finished = hooks[hookName]().onSuccess({ public_id: "member" }, { password: "password" });
    assert.deepEqual(events, ["setup"]);
    finishSetup();
    await finished;
    assert.deepEqual(events, ["setup", "invalidate", "session", "navigate"]);
  });
}

test("logout clears encryption material before clearing the session", () => {
  const { hooks, events } = sessionHarness();
  hooks.useLogout().onSettled();
  assert.deepEqual(events, ["keys cleared", "csrf cleared", "cache cleared", "navigate"]);
});

test("an account with missing or locked keys cannot bypass encryption setup", () => {
  let locked = true;
  const { RequireSession } = load("../src/features/auth/components/SessionGate.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useEffect: () => {} },
    "next/navigation": { useRouter: () => ({ replace: () => {} }) },
    "@/features/auth/session": {
      useSession: () => ({ user: { public_id: "member" }, isPending: false }),
      useUserKeyLock: () => ({ applicable: true, isPending: false, locked }),
    },
    "@/features/auth/components/UnlockGate": { UnlockGate: () => React.createElement("div", null, "Set up encryption") },
  });
  const render = () => renderToStaticMarkup(React.createElement(RequireSession, null, "Team files"));
  assert.match(render(), /Set up encryption/);
  assert.doesNotMatch(render(), /Team files/);
  locked = false;
  assert.equal(render(), "Team files");
});

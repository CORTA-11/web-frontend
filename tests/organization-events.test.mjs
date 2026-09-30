import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function load(path, dependencies, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  const require = (name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  };
  new Function("require", "module", "exports", ...Object.keys(globals), compiled)(
    require, loaded, loaded.exports, ...Object.values(globals),
  );
  return loaded.exports;
}

test("SSE boundary uses cookies, delivers named events, and closes on cleanup", () => {
  const sources = [];
  class EventSource {
    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.closed = false;
      sources.push(this);
    }
    addEventListener(event, listener) { this.event = event; this.listener = listener; }
    close() { this.closed = true; }
  }
  const { subscribe } = load("../src/lib/http.ts", {
    "@/lib/env": { API_BASE: "/api" },
    "@/lib/token": { getCSRFToken: () => null },
  }, { EventSource });
  let updates = 0;
  const cleanup = subscribe("/v1/orgs/events", "organizations", () => updates++);
  const source = sources[0];
  assert.equal(source.url, "/api/v1/orgs/events");
  assert.deepEqual(source.options, { withCredentials: true });
  assert.equal(source.event, "organizations");
  source.listener();
  assert.equal(updates, 1);
  cleanup();
  assert.equal(source.closed, true);
});

test("organization events invalidate only the signed-in user's cache and skip mocks/logout", () => {
  let user = { id: 42 };
  let live = true;
  let cleanup;
  let subscriptions = 0;
  let onEvent;
  const invalidations = [];
  const client = { invalidateQueries: (query) => invalidations.push(query) };
  const { OrganizationEvents } = load("../src/features/auth/components/OrganizationEvents.tsx", {
    react: { useEffect: (effect) => { cleanup = effect(); } },
    "@tanstack/react-query": { useQueryClient: () => client },
    "@/features/auth/session": { useSession: () => ({ user }) },
    "@/lib/env": { isLive: () => live },
    "@/lib/query-keys": { qk: { userOrgs: ["user-orgs"] } },
    "@/lib/http": { subscribe: (path, event, callback) => {
      assert.equal(path, "/v1/orgs/events");
      assert.equal(event, "organizations");
      subscriptions++;
      onEvent = callback;
      return () => subscriptions--;
    } },
  });
  assert.equal(OrganizationEvents(), null);
  assert.equal(subscriptions, 1);
  onEvent();
  assert.deepEqual(invalidations, [{ queryKey: ["user-orgs", 42] }]);
  cleanup();
  assert.equal(subscriptions, 0);
  user = null;
  OrganizationEvents();
  assert.equal(subscriptions, 0);
  user = { id: 42 };
  live = false;
  OrganizationEvents();
  assert.equal(subscriptions, 0);
});

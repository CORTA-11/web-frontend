import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

function indicator(kind, initiallyRead = false) {
  const content = kind === "content";
  const key = content ? "request:granted:time" : "request:granted";
  const state = { read: new Set(initiallyRead ? [key] : []), open: false, menu: null };
  const shell = ({ children }) => React.createElement("div", null, children);
  const dependencies = {
    "react/jsx-runtime": jsxRuntime,
    react: { useEffect: () => {}, useState: (initial) => {
      const value = typeof initial === "function" ? initial() : initial;
      return value instanceof Set ? [state.read, (update) => { state.read = update(state.read); }]
        : [state.open, (value) => { state.open = value; }];
    } },
    "next/link": { default: ({ href, children }) => React.createElement("a", { href }, children) },
    "lucide-react": { BellIcon: () => null },
    "@tanstack/react-query": { useQueryClient: () => ({ invalidateQueries: () => {} }) },
    "@/features/auth/session": { useSession: () => ({ user: { id: 1, public_id: "me" } }) },
    "@/features/teams/queries": { useTeams: () => ({ data: [{ public_id: "team", my_role: "TEAM_MEMBER" }] }) },
    "@/lib/env": { isLive: () => true },
    "@/lib/query-keys": { qk: { contentAccess: () => [] } },
    "@/lib/http": { subscribe: () => () => {} },
    "@/features/files/useKeyAccessEvents": { useKeyAccessEvents: () => {} },
    "@/features/files/access-notifications": { accessNotifications: () => [{ key, message: "Approved" }] },
    "@/features/files/queries": { useKeyAccessRequests: () => ({ data: [] }) },
    "@/features/content-access/queries": { useContentAccess: () => ({ data: {
      items: [], requests: [{ public_id: "request", kind: "file", resource_id: "file", requested_by: "me", status: "granted", updated_at: "time" }],
    } }) },
    "@/features/content-access/useNotificationAcknowledgements": { useNotificationAcknowledgements: () => ({
      read: state.read, markRead: (keys) => { state.read = new Set([...state.read, ...keys]); },
    }) },
    "@/components/ui/dropdown-menu": {
      DropdownMenu: (props) => { state.menu = props; return shell(props); },
      DropdownMenuContent: shell,
      DropdownMenuTrigger: ({ children, ...props }) => React.createElement("button", props, children),
      DropdownMenuItem: (props) => React.cloneElement(props.render, {}, props.children),
    },
  };
  const path = content ? "../src/features/content-access/components/AccessNotifications.tsx" : "../src/features/files/components/KeyAccessIndicator.tsx";
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled)((name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, loaded, loaded.exports);
  const Component = content ? loaded.exports.AccessNotifications : loaded.exports.KeyAccessIndicator;
  return { state, key, render: () => renderToStaticMarkup(React.createElement(Component, { orgId: "org", teamId: "team" })) };
}

function loadAcknowledgements(onSubscribe = () => {}) {
  const compiled = ts.transpileModule(readFileSync(new URL("../src/features/content-access/useNotificationAcknowledgements.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled)(() => ({
    useSyncExternalStore: (subscribe, getSnapshot, getServerSnapshot) => {
      onSubscribe(subscribe);
      assert.equal(getServerSnapshot(), "[]");
      return getSnapshot();
    },
  }), loaded, loaded.exports);
  return loaded.exports.useNotificationAcknowledgements;
}

function storageFixture(t) {
  const previous = { window: globalThis.window, storage: globalThis.localStorage };
  const store = new Map();
  globalThis.window = new EventTarget();
  globalThis.localStorage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  t.after(() => { globalThis.window = previous.window; globalThis.localStorage = previous.storage; });
  return store;
}

test("viewed event identities survive remount/reload and remain scoped to account, org, team and notification type", (t) => {
  storageFixture(t);
  const hook = loadAcknowledgements();
  const scope = "content:org:team:me";
  hook(scope).markRead(["request:denied:1"]);
  assert.equal(hook(scope).read.has("request:denied:1"), true);
  assert.equal(loadAcknowledgements()(scope).read.has("request:denied:1"), true);
  assert.equal(hook(scope).read.has("request:denied:2"), false);
  for (const other of ["keys:org:team:me", "content:org:team:other", "content:org:other:me", "content:other:team:me"])
    assert.equal(hook(other).read.size, 0);
});

test("acknowledgements notify current consumers and other tabs, with subscription cleanup", (t) => {
  storageFixture(t);
  let subscribe;
  const hook = loadAcknowledgements((value) => { subscribe = value; });
  const state = hook("content:org:team:me");
  let changes = 0;
  const unsubscribe = subscribe(() => changes++);
  state.markRead(["event"]);
  assert.equal(changes, 1);
  window.dispatchEvent(new Event("storage"));
  assert.equal(changes, 2);
  unsubscribe();
  window.dispatchEvent(new Event("storage"));
  assert.equal(changes, 2);
});

test("corrupt or unavailable storage cannot prevent notification dismissal", (t) => {
  const store = storageFixture(t);
  const scope = "content:org:team:me";
  store.set(`notification-acknowledgements:${scope}`, "invalid-json");
  const hook = loadAcknowledgements();
  assert.equal(hook(scope).read.size, 0);
  globalThis.localStorage = { getItem: (key) => store.get(key) ?? null, setItem() { throw new Error("Full"); } };
  hook(scope).markRead(["full-store-event"]);
  assert.equal(hook(scope).read.has("full-store-event"), true);
  globalThis.localStorage = { getItem() { throw new Error("Blocked"); }, setItem() { throw new Error("Blocked"); } };
  hook(scope).markRead(["event"]);
  assert.equal(hook(scope).read.has("event"), true);
});

for (const kind of ["content", "keys"]) {
  test(`${kind}: already viewed notifications do not leave a permanent header indicator`, () => {
    const ui = indicator(kind, true);
    assert.equal(ui.render(), "");
  });
  test(`${kind}: viewing the dropdown acknowledges notifications; closing dismisses the indicator`, () => {
    const ui = indicator(kind);
    assert.match(ui.render(), /1 unread/);
    assert.equal(typeof ui.state.menu.onOpenChange, "function");
    ui.state.menu.onOpenChange(true);
    assert.equal(ui.state.read.has(ui.key), true);
    assert.match(ui.render(), /Approved|approved/);
    ui.state.menu.onOpenChange(false);
    assert.equal(ui.render(), "");
  });
}

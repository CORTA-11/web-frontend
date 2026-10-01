import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

function load(path, dependencies = {}) {
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

const { accessNotifications } = load("../src/features/files/access-notifications.ts");
const request = (id, user, status) => ({ id, requested_by: user, requested_by_name: user, status });

test("leaders receive indicators for others' pending requests only", () => {
  const items = [request("1", "member", "pending"), request("2", "leader", "pending"), request("3", "other", "denied")];
  assert.deepEqual(accessNotifications(items, "leader", true), [
    { key: "1:pending", message: "member requested access to previous files" },
  ]);
  assert.deepEqual(accessNotifications(items, "outsider", false), []);
});

test("members receive approval and denial indicators, not other members' decisions", () => {
  for (const status of ["granted", "denied"]) {
    const notifications = accessNotifications([request("1", "me", status), request("2", "other", status)], "me", false);
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].key, `1:${status}`);
    assert.match(notifications[0].message, status === "granted" ? /approved/ : /denied/);
  }
});

test("a retry hides the old denial; its eventual decision has a distinct unread key", () => {
  assert.deepEqual(accessNotifications([request("new", "me", "pending"), request("old", "me", "denied")], "me", false), []);
  const [notification] = accessNotifications([request("new", "me", "granted"), request("old", "me", "denied")], "me", false);
  assert.equal(notification.key, "new:granted");
});

test("team SSE refreshes shared status cache, closes on cleanup, and skips mocks/logout", () => {
  let live = true;
  let cleanup;
  let changed;
  let closed = 0;
  let subscriptions = 0;
  const invalidations = [];
  const client = { invalidateQueries: (query) => invalidations.push(query) };
  const { useKeyAccessEvents } = load("../src/features/files/useKeyAccessEvents.ts", {
    react: { useEffect: (effect) => { cleanup = effect(); } },
    "@tanstack/react-query": { useQueryClient: () => client },
    "@/lib/env": { isLive: () => live },
    "@/lib/query-keys": { qk: { keyAccessRequests: (teamId) => ["teams", teamId, "key-access-requests"] } },
    "@/lib/http": { subscribe: (path, event, callback) => {
      assert.equal(path, "/v1/orgs/org/teams/team/key-access-requests/events");
      assert.equal(event, "key-access-requests");
      subscriptions++;
      changed = callback;
      return () => closed++;
    } },
  });
  useKeyAccessEvents("org", "team", "me");
  changed();
  assert.deepEqual(invalidations, [{ queryKey: ["teams", "team", "key-access-requests"] }]);
  cleanup();
  assert.equal(closed, 1);
  useKeyAccessEvents("org", "team", undefined);
  live = false;
  useKeyAccessEvents("org", "team", "me");
  assert.equal(subscriptions, 1);
});

test("notification indicator links to files and acknowledges clicked decisions", () => {
  let read = new Set();
  let member = true;
  let subscriptions = 0;
  const menuItems = [];
  const shell = ({ children, ...props }) => React.createElement("div", props, children);
  const { KeyAccessIndicator } = load("../src/features/files/components/KeyAccessIndicator.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useState: () => [false, () => {}] },
    "@/features/content-access/useNotificationAcknowledgements": { useNotificationAcknowledgements: () => ({
      read, markRead: (keys) => { read = new Set([...read, ...keys]); },
    }) },
    "next/link": { default: ({ children, href }) => React.createElement("a", { href }, children) },
    "lucide-react": { BellIcon: () => null },
    "@/features/auth/session": { useSession: () => ({ user: { id: 1, public_id: "me" } }) },
    "@/features/teams/queries": { useTeams: () => ({ data: [{ public_id: "team", my_role: member ? "TEAM_MEMBER" : undefined }] }) },
    "@/features/files/queries": { useKeyAccessRequests: () => ({ data: [request("1", "me", "granted")] }) },
    "@/features/files/useKeyAccessEvents": { useKeyAccessEvents: () => subscriptions++ },
    "@/features/files/access-notifications": { accessNotifications },
    "@/lib/env": { isLive: () => true },
    "@/components/ui/dropdown-menu": {
      DropdownMenu: ({ children }) => React.createElement("div", null, children),
      DropdownMenuContent: ({ children }) => React.createElement("div", null, children),
      DropdownMenuTrigger: shell,
      DropdownMenuItem: (props) => {
        menuItems.push(props);
        return React.cloneElement(props.render, {}, props.children);
      },
    },
  });
  const render = () => renderToStaticMarkup(React.createElement(KeyAccessIndicator, { orgId: "org", teamId: "team" }));
  assert.match(render(), /File access notifications, 1 unread/);
  assert.equal(menuItems[0].render.props.href, "/orgs/org/teams/team/files");
  assert.match(render(), /Your access to previous files was approved/);
  menuItems[0].onClick();
  assert.equal(render(), "");
  member = false;
  const previousSubscriptions = subscriptions;
  assert.equal(render(), "");
  assert.equal(subscriptions, previousSubscriptions);
});

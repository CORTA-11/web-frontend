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

function mockPermissions() {
  const db = {
    people: [{ id: 1, name: "Creator" }, { id: 2, name: "Member" }, { id: 3, name: "Third" }],
    docs: [{ id: "doc", team_public_id: "team", updated_by: "Creator" }],
    files: { team: [{ id: "file", uploaded_by: 1 }], other: [{ id: "other", uploaded_by: 1 }] },
    members: { team: [{ user_id: 1, name: "Creator" }, { user_id: 2, name: "Member" }, { user_id: 3, name: "Third" }] },
    contentOwners: {}, contentRequests: [],
  };
  let sequence = 0;
  const { contentPermissions } = load("../src/mocks/content-permissions.ts", {
    "@/mocks/db": { db, now: () => `time-${++sequence}`, uid: () => `id-${++sequence}` },
  });
  return { db, permissions: contentPermissions };
}

test("content is private until its creator grants access; team catalog stays visible", () => {
  const { permissions: p } = mockPermissions();
  assert.equal(p.snapshot("team", 1).items.every((item) => item.can_access), true);
  assert.equal(p.snapshot("team", 2).items.every((item) => !item.can_access), true);
  assert.equal(p.grant("team", 2, "file", "file", "3"), false);
  assert.equal(p.grant("team", 1, "file", "file", "999"), false);
  assert.equal(p.grant("team", 1, "file", "other", "2"), false);
  assert.equal(p.grant("team", 1, "file", "file", "2"), true);
  assert.equal(p.allowed("file", "file", 2), true);
  assert.equal(p.allowed("document", "doc", 2), false);
});

test("requests are private, only creators decide, and denial can be retried", () => {
  const { permissions: p } = mockPermissions();
  assert.equal(p.request("team", 2, "document", "doc"), true);
  assert.equal(p.request("team", 2, "document", "doc"), false);
  const [request] = p.snapshot("team", 1).requests;
  assert.equal(p.snapshot("team", 3).requests.length, 0);
  assert.equal(p.decide("team", 2, request.public_id, "granted"), false);
  assert.equal(p.decide("team", 1, request.public_id, "denied"), true);
  const deniedAt = request.updated_at;
  assert.equal(p.allowed("document", "doc", 2), false);
  assert.equal(p.request("team", 2, "document", "doc"), true);
  assert.notEqual(request.updated_at, deniedAt);
  assert.equal(p.decide("team", 1, request.public_id, "granted"), true);
  assert.equal(p.allowed("document", "doc", 2), true);
  assert.equal(p.request("team", 2, "document", "doc"), false);
  assert.equal(p.decide("team", 1, request.public_id, "denied"), false);
});

test("editing cannot transfer ownership, and removed resources disappear", () => {
  const { db, permissions: p } = mockPermissions();
  p.snapshot("team", 1);
  db.docs[0].updated_by = "Member";
  assert.equal(p.snapshot("team", 2).items.find((item) => item.kind === "document").creator_id, "1");
  assert.equal(p.grant("team", 2, "document", "doc", "3"), false);
  db.docs = [];
  assert.equal(p.request("team", 2, "document", "doc"), false);
});

test("approval prepares only the selected file's encryption version", async () => {
  const wrapped = [];
  const { prepareFileAccess } = load("../src/features/content-access/prepare-file-access.ts", {
    "@/lib/env": { isLive: () => true },
    "@/features/files/api": { filesApi: { list: async () => [{ id: "file", key_version: 4 }] } },
    "@/features/files/keystore": { grantMemberAccess: async (...args) => wrapped.push(args) },
  });
  await prepareFileAccess("org", "team", "file", "member");
  assert.deepEqual(wrapped, [["org", "team", "member", 4]]);
  await assert.rejects(prepareFileAccess("org", "team", "missing", "member"));
});

test("SSE updates permission queries, notifies creators/requesters, and cleans up", () => {
  let changed, cleanup, closed = 0, member = true;
  const invalidations = [];
  const requests = [
    { public_id: "pending", kind: "document", resource_id: "doc", requested_by: "other", requester_name: "Member", status: "pending", updated_at: "1" },
    { public_id: "approved", kind: "file", resource_id: "file", requested_by: "me", status: "granted", updated_at: "2" },
  ];
  const shell = ({ children }) => React.createElement("div", null, children);
  const { AccessNotifications } = load("../src/features/content-access/components/AccessNotifications.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useState: () => [new Set(), () => {}], useEffect: (effect) => { cleanup = effect(); } },
    "next/link": { default: ({ children, href }) => React.createElement("a", { href }, children) },
    "lucide-react": { BellIcon: () => null },
    "@tanstack/react-query": { useQueryClient: () => ({ invalidateQueries: (input) => invalidations.push(input) }) },
    "@/features/auth/session": { useSession: () => ({ user: { id: 1, public_id: "me" } }) },
    "@/features/teams/queries": { useTeams: () => ({ data: [{ public_id: "team", my_role: member ? "TEAM_MEMBER" : undefined }] }) },
    "@/features/content-access/queries": { useContentAccess: () => ({ data: { requests, items: [{ kind: "document", resource_id: "doc", creator_id: "me" }] } }) },
    "@/lib/query-keys": { qk: { contentAccess: (...args) => args } },
    "@/lib/http": { subscribe: (path, event, callback) => {
      assert.equal(path, "/v1/orgs/org/teams/team/content-access/events");
      assert.equal(event, "content-access"); changed = callback; return () => closed++;
    } },
    "@/components/ui/dropdown-menu": {
      DropdownMenu: shell, DropdownMenuContent: shell,
      DropdownMenuTrigger: ({ children, ...props }) => React.createElement("button", props, children),
      DropdownMenuItem: (props) => React.cloneElement(props.render, {}, props.children),
    },
  });
  const render = () => renderToStaticMarkup(React.createElement(AccessNotifications, { orgId: "org", teamId: "team" }));
  assert.match(render(), /Document and file permissions, 2 unread/);
  assert.match(render(), /Member requested access to your document/);
  assert.match(render(), /Your request for file file was approved/);
  changed();
  assert.deepEqual(invalidations, [{ queryKey: ["org", "team", "me"] }]);
  cleanup(); assert.equal(closed, 1);
  member = false;
  assert.equal(render(), "");
});

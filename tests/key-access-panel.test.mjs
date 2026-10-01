import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const requireDependency = createRequire(import.meta.url);

function renderPanel(entries, { submitting = false, leader = false } = {}) {
  const buttons = [];
  let submissions = 0;
  const dependencies = {
    "@/components/ui/button": { Button: (props) => {
      buttons.push(props);
      return React.createElement("button", { disabled: props.disabled }, props.children);
    } },
    "@/lib/env": { isLive: () => true },
    "@/lib/rbac": { can: () => leader },
    "@/features/files/keystore": { grantMemberAccess: async () => {} },
    "@/features/files/queries": {
      useKeyAccessRequests: () => ({ data: entries }),
      useRequestKeyAccess: () => ({ isPending: submitting, mutate: () => submissions++ }),
      useDecideKeyAccess: () => ({ isPending: false, mutate: () => {} }),
    },
    "@/lib/query": { notifyError: () => {} },
  };
  const source = readFileSync(new URL("../src/features/files/components/KeyAccessPanel.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  const require = (name) => {
    if (name in dependencies) return dependencies[name];
    if (name.startsWith("@/")) throw new Error(`Missing dependency: ${name}`);
    return requireDependency(name);
  };
  new Function("require", "module", "exports", compiled)(require, loaded, loaded.exports);
  const html = renderToStaticMarkup(React.createElement(loaded.exports.KeyAccessPanel, {
    teamId: "team", orgId: "org", currentUserId: "member", actor: null, hasFiles: true,
  }));
  return { html, buttons, submissions: () => submissions };
}

const entry = (status, id = status) => ({ id, status, requested_by: "member", requested_by_name: "Member" });

test("a denied member can submit another previous-file access request", () => {
  const panel = renderPanel([entry("denied")]);
  assert.match(panel.html, /Previous-file access denied/);
  const retry = panel.buttons.find((button) => button.children === "Request access again");
  assert.ok(retry, "denial must expose a retry button");
  assert.equal(retry.disabled, false);
  retry.onClick();
  assert.equal(panel.submissions(), 1);
});

test("newest pending request takes precedence over an older denial", () => {
  const panel = renderPanel([entry("pending"), entry("denied")]);
  assert.match(panel.html, /Waiting for the team leader/);
  assert.equal(panel.buttons.length, 1);
  assert.equal(panel.buttons[0].children, "Pending");
  assert.equal(panel.buttons[0].disabled, true);
});

test("newest granted request takes precedence over an older denial", () => {
  const panel = renderPanel([entry("granted"), entry("denied")]);
  assert.match(panel.html, /Previous-file access granted/);
  assert.equal(panel.buttons.length, 0);
});

test("retry is disabled while submitting", () => {
  const panel = renderPanel([entry("denied")], { submitting: true });
  assert.equal(panel.buttons.length, 1);
  assert.equal(panel.buttons[0].children, "Requesting…");
  assert.equal(panel.buttons[0].disabled, true);
});

test("members with no request can request access for the first time", () => {
  const panel = renderPanel([]);
  assert.equal(panel.buttons[0].children, "Request access to previous files");
  panel.buttons[0].onClick();
  assert.equal(panel.submissions(), 1);
});

test("leaders still see approve and deny actions for pending member requests", () => {
  const panel = renderPanel([{ ...entry("pending"), requested_by: "other-member" }], { leader: true });
  assert.deepEqual(panel.buttons.map((button) => button.children), ["Approve", "Deny"]);
});

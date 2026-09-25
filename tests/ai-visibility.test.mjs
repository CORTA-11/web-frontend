import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const loadDependency = createRequire(import.meta.url);

// Render the real dialog using the real settings adapter, without a running API.
function load(relativePath, dependencies) {
  const source = readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  const resolve = (name) => {
    if (name in dependencies) return dependencies[name];
    if (name.startsWith('@/')) throw new Error(`Missing dependency: ${name}`);
    return loadDependency(name);
  };
  new Function('require', 'module', 'exports', compiled)(resolve, loaded, loaded.exports);
  return loaded.exports;
}

async function renderDialog(live, enabled = false) {
  const env = { isLive: () => live };
  const { settingsApi } = load('src/features/settings/api.ts', {
    '@/lib/env': env,
    '@/lib/http': { api: async () => live
      ? { id: 'org', name: 'Organisation', lifecycle_state: 'active' }
      : { ai: { enabled, model: '', available_models: [] } } },
  });
  const settings = await settingsApi.org('org');
  const shell = ({ children }) => React.createElement('div', null, children);
  const { ChatSummaryDialog } = load('src/features/ai/components/ChatSummaryDialog.tsx', {
    'next/navigation': { useParams: () => ({ orgId: 'org' }) },
    '@/lib/env': env,
    '@/components/ui/button': { Button: shell },
    '@/components/ui/dialog': Object.fromEntries(
      ['Dialog', 'DialogContent', 'DialogDescription', 'DialogHeader', 'DialogTitle', 'DialogTrigger']
        .map((name) => [name, shell])),
    '@/components/ui/input': { Input: () => null },
    '@/components/common/Field': { Field: shell },
    '@/features/ai/components/ExtractedTasks': { ExtractedTasks: shell },
    '@/features/ai/components/SummaryView': { SummaryView: shell },
    '@/features/ai/queries': { useChatSummary: () => ({}) },
    '@/features/teams/queries': { useMembers: () => ({ data: [] }) },
    '@/features/settings/queries': { useOrgSettings: () => ({ data: settings }) },
    '@/lib/http': { errorMessage: String },
    '@/lib/rbac': { can: () => true },
    '@/features/teams/api': { numericKey: Number },
  });
  return renderToStaticMarkup(React.createElement(ChatSummaryDialog, { teamId: 'team', actor: null }));
}

test('live chat exposes AI summary with organization settings lacking AI configuration', async () => {
  assert.match(await renderDialog(true), /Summarise chat/);
});

test('mock chat respects the organization AI toggle', async () => {
  assert.equal(await renderDialog(false), '');
  assert.match(await renderDialog(false, true), /Summarise chat/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/features/docs/api.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const editorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function loadDocs(document, live = true) {
  const loaded = { exports: {} };
  const resolve = (name) => {
    if (name === '@/lib/env') return { isLive: () => live };
    if (name === '@/lib/http') return { api: async () => live ? { items: [document] } : [document] };
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', compiled)(resolve, loaded, loaded.exports);
  return loaded.exports.docsApi;
}

test('live document list displays the editor name instead of their UUID', async () => {
  const docs = await loadDocs({ updated_by: editorId, updated_by_name: 'Alex Smith' }).list('org', 'team');
  assert.equal(docs[0].updated_by, 'Alex Smith');
});

test('a missing editor name does not expose a UUID', async () => {
  for (const updated_by_name of [undefined, '', '   ']) {
    const docs = await loadDocs({ updated_by: editorId, updated_by_name }).list('org', 'team');
    assert.equal(docs[0].updated_by, 'Unknown editor');
  }
});

test('mock document lists keep their existing display names', async () => {
  const docs = await loadDocs({ updated_by: 'Alex Smith' }, false).list('org', 'team');
  assert.equal(docs[0].updated_by, 'Alex Smith');
});

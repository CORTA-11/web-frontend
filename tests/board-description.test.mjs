import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('../src/features/board/api.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function load() {
  let stored;
  const loaded = { exports: {} };
  const require = (name) => {
    if (name === '@/lib/env') return { isLive: () => true };
    if (name === '@/features/teams/api') return { numericKey: () => 1 };
    if (name === '@/lib/http') return { api: async (_path, options) => {
      if (!options) return { items: [stored] };
      stored = { id: 'task', assignee_id: null, created_at: '2026-01-01', ...stored, ...options.json };
      return stored;
    } };
    throw new Error(name);
  };
  new Function('require', 'module', 'exports', compiled)(require, loaded, loaded.exports);
  return loaded.exports.boardApi;
}

test('live task title and description survive creation, edits, moves and reloads', async () => {
  const api = load();
  let saved = await api.create('team', 'org', { title: 'Title', description: 'Detailed instructions' });
  assert.equal(saved.title, 'Title');
  assert.equal(saved.description, 'Detailed instructions');
  saved = await api.update('team', 'org', 'task', { title: 'Edited title', description: 'Edited details', column_id: 'in_progress' }, saved);
  saved = await api.update('team', 'org', 'task', { column_id: 'done' }, saved);
  let { tasks } = await api.get('team', 'org');
  assert.equal(tasks[0].title, 'Edited title');
  assert.equal(tasks[0].description, 'Edited details');
  assert.equal(tasks[0].column_id, 'done');
  await api.update('team', 'org', 'task', { description: '' }, saved);
  ({ tasks } = await api.get('team', 'org'));
  assert.equal(tasks[0].title, 'Edited title');
  assert.equal(tasks[0].description, '');
  assert.equal(tasks[0].column_id, 'done');
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('../src/features/board/api.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function load() {
  let stored = { id: 'task', description: 'Task', status: 'todo', assignee_id: null, created_at: '2026-01-01', start_date: null, due_date: null };
  const loaded = { exports: {} };
  const require = (name) => {
    if (name === '@/lib/env') return { isLive: () => true };
    if (name === '@/features/teams/api') return { numericKey: () => 1 };
    if (name === '@/lib/http') return { api: async (_path, options) => {
      if (!options) return { items: [stored] };
      stored = { ...stored, ...options.json };
      return stored;
    } };
    throw new Error(name);
  };
  new Function('require', 'module', 'exports', compiled)(require, loaded, loaded.exports);
  return loaded.exports.boardApi;
}

test('live task creation and reload preserve start and due dates', async () => {
  const api = load();
  const dates = { start_date: '2026-08-10T09:00:00.000Z', due_date: '2026-08-12T09:00:00.000Z' };
  const created = await api.create('team', 'org', { title: 'Task', ...dates });
  assert.equal(created.start_date, dates.start_date);
  assert.equal(created.due_date, dates.due_date);
  const { tasks } = await api.get('team', 'org');
  assert.equal(tasks[0].start_date, dates.start_date);
  assert.equal(tasks[0].due_date, dates.due_date);
});

test('live task update persists dates, preserves omitted dates and supports clearing', async () => {
  const api = load();
  const dates = { start_date: '2026-08-10T09:00:00.000Z', due_date: '2026-08-12T09:00:00.000Z' };
  let saved = await api.update('team', 'org', 'task', { title: 'Task', ...dates });
  assert.equal(saved.start_date, dates.start_date);
  assert.equal(saved.due_date, dates.due_date);
  saved = await api.update('team', 'org', 'task', { column_id: 'done' }, saved);
  assert.equal(saved.start_date, dates.start_date);
  assert.equal(saved.due_date, dates.due_date);
  await api.update('team', 'org', 'task', { start_date: null, due_date: null }, saved);
  const { tasks } = await api.get('team', 'org');
  assert.equal(tasks[0].start_date, null);
  assert.equal(tasks[0].due_date, null);
});

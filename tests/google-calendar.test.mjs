import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/features/board/google-calendar.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { googleCalendarUrl } = loaded.exports;
const boardUrl = 'https://example.test/orgs/org/teams/team/board';
const task = { title: 'Review & plan + café', description: 'Line 1\nLine 2 #notes', start_date: null, due_date: null };
const dates = (patch) => new URL(googleCalendarUrl({ ...task, ...patch }, boardUrl)).searchParams.get('dates');

test('encodes the title, description and board link without creating extra parameters', () => {
  const url = new URL(googleCalendarUrl({ ...task, due_date: '2026-12-31T09:00:00Z' }, boardUrl));
  assert.equal(url.origin, 'https://calendar.google.com');
  assert.equal(url.searchParams.get('action'), 'TEMPLATE');
  assert.equal(url.searchParams.get('text'), task.title);
  assert.equal(url.searchParams.get('details'), `${task.description}\n\nTask board: ${boardUrl}`);
  assert.equal(url.searchParams.size, 4);
  assert.equal(url.searchParams.get('dates'), '20261231/20270101');
});

test('makes start-to-due ranges inclusive using an exclusive Google end date', () => {
  assert.equal(dates({ start_date: '2026-08-10', due_date: '2026-08-12' }), '20260810/20260813');
  assert.equal(dates({ start_date: '2026-08-10', due_date: '2026-08-10' }), '20260810/20260811');
});

test('supports a start-only date, leap days, and timestamps without timezone drift', () => {
  assert.equal(dates({ start_date: '2028-02-29' }), '20280229/20280301');
  assert.equal(dates({ due_date: '2026-08-10T23:30:00-07:00' }), '20260810/20260811');
});

test('uses the deadline when the start date is after the due date', () => {
  assert.equal(dates({ start_date: '2026-08-15', due_date: '2026-08-10' }), '20260810/20260811');
});

test('undated and invalid dates do not create calendar links', () => {
  for (const due_date of [null, '', 'not-a-date', '2026-02-30', '2026-13-01']) {
    assert.equal(googleCalendarUrl({ ...task, due_date }, boardUrl), null);
  }
  assert.equal(dates({ start_date: 'invalid', due_date: '2026-08-10' }), '20260810/20260811');
});

test('an empty description still includes the board link', () => {
  const url = new URL(googleCalendarUrl({ ...task, description: '', due_date: '2026-08-10' }, boardUrl));
  assert.equal(url.searchParams.get('details'), `Task board: ${boardUrl}`);
});

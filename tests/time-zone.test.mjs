import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    (name) => dependencies[name] ?? require(name), loaded, loaded.exports,
  );
  return loaded.exports;
}
const zones = load('../src/lib/time-zone.ts');
const format = load('../src/lib/format.ts', { '@/lib/time-zone': zones });
const availability = load('../src/features/resources/availability.ts', { '@/lib/time-zone': zones });

test('timestamp displays use the selected zone, including date rollover and fractional offsets', () => {
  zones.setTimeZone('Asia/Colombo');
  assert.equal(format.dateTime('2026-01-01T21:00:15Z'), '2 Jan 2026, 02:30');
  assert.equal(format.clock('2026-01-01T21:00:15Z'), '02:30:15');
  assert.equal(format.dayShort('2026-01-01T21:00:15Z'), '2 Jan');
  zones.setTimeZone('America/New_York');
  assert.equal(format.dateTime('2026-01-01T02:00:00Z'), '31 Dec 2025, 21:00');
  assert.equal(format.time('2026-07-01T12:00:00Z'), '08:00');
  assert.equal(format.time('2026-01-01T12:00:00Z'), '07:00');
  assert.equal(format.time('2026-01-01T12:00:00Z', 'UTC'), '12:00');
});

test('selected-zone booking inputs round-trip to UTC independently of the device zone', () => {
  const utc = new Date('2026-01-01T21:00:00Z');
  assert.equal(zones.dateTimeInput(utc, 'Asia/Colombo'), '2026-01-02T02:30');
  assert.equal(zones.fromDateTimeInput('2026-01-02T02:30', 'Asia/Colombo').toISOString(), utc.toISOString());
  assert.equal(zones.fromDateTimeInput('2026-07-01T08:00', 'America/New_York').toISOString(), '2026-07-01T12:00:00.000Z');
  assert.equal(zones.fromDateTimeInput('2026-01-01T07:00', 'America/New_York').toISOString(), '2026-01-01T12:00:00.000Z');
  assert.equal(zones.fromDateTimeInput('2026-01-01T23:59:59.999', 'UTC').toISOString(), '2026-01-01T23:59:59.999Z');
});

test('DST gaps and invalid inputs are rejected; repeated times resolve consistently', () => {
  assert.ok(Number.isNaN(zones.fromDateTimeInput('2026-03-08T02:30', 'America/New_York').getTime()));
  assert.ok(Number.isNaN(zones.fromDateTimeInput('', 'UTC').getTime()));
  const repeated = zones.fromDateTimeInput('2026-11-01T01:30', 'America/New_York');
  assert.equal(zones.dateTimeInput(repeated, 'America/New_York'), '2026-11-01T01:30');
});

test('invalid zone preferences cannot replace a valid selection and changes notify subscribers', () => {
  let notifications = 0;
  const unsubscribe = zones.subscribeTimeZone(() => notifications++);
  zones.setTimeZone('Asia/Colombo');
  zones.setTimeZone('invalid/zone');
  assert.equal(zones.getTimeZone(), 'Asia/Colombo');
  assert.equal(notifications, 1);
  unsubscribe();
});

test('UTC availability recurrences display in the selected zone across midnight', () => {
  zones.setTimeZone('Asia/Colombo');
  const label = availability.summariseAvailabilityLocal(
    [{ weekday: 1, start: '20:00', end: '23:00' }], new Date('2026-01-05T00:00:00Z'),
  );
  assert.match(label, /Tue/);
  assert.match(label, /1:30|01:30/);
  assert.match(label, /4:30|04:30/);
  assert.equal(availability.localTimeZone(), 'Asia/Colombo');
});

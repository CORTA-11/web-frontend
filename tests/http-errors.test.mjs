import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/http.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function httpWith(response) {
  const loaded = { exports: {} };
  const resolve = (name) => {
    if (name === '@/lib/env') return { API_BASE: '/api' };
    if (name === '@/lib/token') return { getCSRFToken: () => null };
    throw new Error(`Unexpected dependency: ${name}`);
  };
  const fetch = async () => response;
  new Function('require', 'module', 'exports', 'fetch', compiled)(resolve, loaded, loaded.exports, fetch);
  return loaded.exports;
}

test('gateway HTML is shown as a short timeout error', async () => {
  const response = new Response('<!DOCTYPE html><title>504: Gateway time-out</title>', {
    status: 504, headers: { 'content-type': 'text/html; charset=UTF-8' },
  });
  const { api } = httpWith(response);
  await assert.rejects(api('/v1/test'), (error) => {
    assert.equal(error.status, 504);
    assert.equal(error.message, 'The request timed out. Please try again.');
    return true;
  });
});

test('plain text API errors retain their message', async () => {
  const response = new Response('The transcript is too short', { status: 400 });
  const { api } = httpWith(response);
  await assert.rejects(api('/v1/test'), /The transcript is too short/);
});

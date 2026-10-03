import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/features/teams/api.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadTeams(live, requests) {
  const loaded = { exports: {} };
  const resolve = (name) => {
    if (name === '@/lib/env') return { isLive: () => live };
    if (name === '@/features/auth/api') return { orgRoleOf: (role) => role };
    if (name === '@/lib/http') return {
      api: async (path, options) => {
        requests.push({ path, ...options });
        return { id: 'team', name: options.json.name, description: options.json.description };
      },
    };
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', compiled)(resolve, loaded, loaded.exports);
  return loaded.exports.teamsApi;
}

for (const live of [true, false]) {
  test(`${live ? 'live' : 'mock'} team creation sends and returns the description`, async () => {
    const requests = [];
    const team = await loadTeams(live, requests).create('org', {
      name: 'Research', description: 'A persistent description',
      leader_user_id: 1, leaderEmail: 'leader@example.test',
    });
    assert.equal(requests[0].json.description, 'A persistent description');
    assert.equal(team.description, 'A persistent description');
  });
}

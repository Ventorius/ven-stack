import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { BASE_PROFILE, makeRepo, runBin, stateDir, writeFile, writeState } from '../support/fixture.mjs';

// The check fails when a changed file under src/ has no sibling .test.js file.
const PAIR_CHECK = `node -e "const fs=require('fs');const missing=process.argv.slice(1).filter((f)=>f.endsWith('.js')&&!f.endsWith('.test.js')&&!fs.existsSync(f.replace(/\\.js$/,'.test.js')));if(missing.length){console.log('no test beside '+missing.join(', '));process.exit(1)}" {files}`;

function packRepo(checks = [{ id: 'test-pair', run: PAIR_CHECK }]) {
  return makeRepo({
    profile: {
      ...BASE_PROFILE,
      packs: [{ name: 'billing', kind: 'domain', applies_when: { paths: ['src/**'] }, skills: ['money-math'], playbooks: [], checks }],
    },
  });
}

test('packs-for returns each matching pack with its directory and skill files', () => {
  const root = packRepo();
  const result = runBin('ven-profile', ['packs-for', 'src/app.js'], { cwd: root });
  assert.equal(result.code, 0, result.stderr);
  const [pack] = JSON.parse(result.stdout);
  const dir = join(stateDir(root), 'packs', 'billing');
  assert.equal(pack.dir, dir);
  assert.deepEqual(pack.skills, [{ name: 'money-math', file: join(dir, 'skills', 'money-math', 'SKILL.md') }]);
  assert.deepEqual(JSON.parse(runBin('ven-profile', ['packs-for', 'docs/x.md'], { cwd: root }).stdout), []);
});

test('verify refuses when a pack check fails on the changed files it covers', () => {
  const root = packRepo();
  writeFile(root, 'src/new.js', 'export const x = 1;\n');
  const result = runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /pack billing check test-pair failed/);
  assert.match(result.stderr, /no test beside src\/new\.js/);
  assert.match(readFileSync(join(stateDir(root), 'decisions.tsv'), 'utf8'), /verify\tREFUSED\tpack billing check test-pair failed/);
  assert.doesNotMatch(result.stdout, /logged against tree/);

  writeFile(root, 'src/new.test.js', 'expect(1)\n');
  assert.equal(runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root }).code, 0);
});

test('verify skips pack checks when no changed file is under the pack', () => {
  const root = packRepo();
  writeFile(root, 'scripts/tool.js', 'export const x = 1;\n');
  assert.equal(runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root }).code, 0);
});

test('validate rejects a pack check without an id or run', () => {
  const root = packRepo([{ id: 'broken' }]);
  const result = runBin('ven-profile', ['validate'], { cwd: root });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /packs\[0\]\.checks\[0\] needs id and run/);
});

test('init creates the state skeleton without a plugin marketplace', () => {
  const root = makeRepo({ profile: null });
  assert.equal(runBin('ven-profile', ['init'], { cwd: root }).code, 0);
  const dir = stateDir(root);
  assert.ok(existsSync(join(dir, 'packs')));
  assert.equal(existsSync(join(dir, 'packs', '.claude-plugin')), false);
});

test('migrate turns plugin-era packs into directory packs', () => {
  const root = makeRepo({
    profile: { ...BASE_PROFILE, packs: [{ name: 'billing', kind: 'domain', plugin: 'repo-billing@ven-local-repo', applies_when: { paths: ['src/**'] }, skills: [] }] },
  });
  writeState(root, 'packs/.claude-plugin/marketplace.json', '{"plugins":[]}');
  writeState(root, 'packs/billing/hooks/hooks.json', '{}');
  writeState(root, 'packs/billing/.claude-plugin/plugin.json', '{"name":"repo-billing","version":"0.1.3","author":{"name":"pay team"}}');
  writeState(root, 'packs/billing/pack.json', '{"kind":"domain"}');

  const result = runBin('ven-profile', ['migrate'], { cwd: root });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /enabledPlugins/);
  assert.match(result.stdout, /rewrite each hook as a pack check/);
  const dir = stateDir(root);
  const profile = JSON.parse(readFileSync(join(dir, 'profile.json'), 'utf8'));
  assert.equal(profile.packs[0].plugin, undefined);
  assert.equal(existsSync(join(dir, 'packs', '.claude-plugin')), false);
  assert.ok(existsSync(join(dir, 'legacy', 'packs', 'billing', 'hooks', 'hooks.json')));
  const pack = JSON.parse(readFileSync(join(dir, 'packs', 'billing', 'pack.json'), 'utf8'));
  assert.deepEqual([pack.version, pack.owner], ['0.1.3', 'pay team']);
  assert.equal(existsSync(join(dir, 'packs', 'billing', '.claude-plugin')), false);
  assert.match(runBin('ven-profile', ['migrate'], { cwd: root }).stdout, /nothing to migrate/);
});

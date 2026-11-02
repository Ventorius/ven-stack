import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { makeRepo, runBin, stateDir, writeState } from '../support/fixture.mjs';

const profileOf = (root) => JSON.parse(readFileSync(join(stateDir(root), 'profile.json'), 'utf8'));

test('get on a repo with no profile says the key is not set and how to learn a command', () => {
  const root = makeRepo({ profile: null });
  const result = runBin('ven-profile', ['get', 'commands.test.all'], { cwd: root });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /commands\.test\.all is not set/);
  assert.match(result.stderr, /ven-profile learn commands\.test\.all --run/);
});

test('show on a repo with no profile prints an empty profile', () => {
  const root = makeRepo({ profile: null });
  const result = runBin('ven-profile', ['show'], { cwd: root });
  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { schema_version: 1, commands: {} });
});

test('learn creates the profile, runs the command once and records it verified', () => {
  const root = makeRepo({ profile: null });
  const result = runBin('ven-profile', ['learn', 'test.all', '--run', 'node -e "process.exit(0)"', '--evidence', 'package.json#scripts.test'], { cwd: root });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /ok +commands\.test\.all/);
  const spec = profileOf(root).commands.test.all;
  assert.equal(spec.status, 'verified');
  assert.equal(spec.evidence, 'package.json#scripts.test');
  assert.match(spec.proof, /^exit 0 in \d+s at /);
});

test('learn records a failing command unverified with its failure tail and exits 1', () => {
  const root = makeRepo({ profile: null });
  const result = runBin('ven-profile', ['learn', 'commands.lint', '--run', 'node -e "console.log(\'boom\'); process.exit(4)"', '--evidence', 'Makefile:3'], { cwd: root });
  assert.equal(result.code, 1);
  const spec = profileOf(root).commands.lint;
  assert.equal(spec.status, 'unverified');
  assert.match(spec.failure_tail, /boom/);
});

test('learn --manual records the command without running it', () => {
  const root = makeRepo({ profile: null });
  const marker = join(root, 'ran.txt');
  const run = `node -e "require('fs').writeFileSync('ran.txt','x')"`;
  const result = runBin('ven-profile', ['learn', 'commands.codegen', '--run', run, '--evidence', 'package.json', '--manual', 'rewrites tracked files'], { cwd: root });
  assert.equal(result.code, 0, result.stderr);
  assert.equal(existsSync(marker), false);
  const spec = profileOf(root).commands.codegen;
  assert.equal(spec.status, 'manual');
  assert.equal(spec.manual_reason, 'rewrites tracked files');
});

test('learn refuses without --run and --evidence', () => {
  const root = makeRepo({ profile: null });
  assert.equal(runBin('ven-profile', ['learn', 'commands.lint', '--run', 'true'], { cwd: root }).code, 2);
  assert.equal(runBin('ven-profile', ['learn', 'commands.lint', '--evidence', 'x'], { cwd: root }).code, 2);
});

test('verify with an unknown key points at learn', () => {
  const root = makeRepo({ profile: null });
  const result = runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /no command at commands\.test\.all/);
  assert.match(result.stderr, /ven-profile learn/);
});

test('set on a repo with no profile creates it', () => {
  const root = makeRepo({ profile: null });
  assert.equal(runBin('ven-profile', ['set', 'risk_areas', '[{"path":"src/pay/**","why":"moves money"}]'], { cwd: root }).code, 0);
  assert.equal(profileOf(root).risk_areas[0].path, 'src/pay/**');
});

test('fresh and context work without a profile', () => {
  const root = makeRepo({ profile: null });
  assert.equal(runBin('ven-profile', ['fresh'], { cwd: root }).code, 0);
  const context = runBin('ven-profile', ['context'], { cwd: root });
  assert.equal(context.code, 0);
  assert.match(context.stdout, /No profile yet: commands are found and proven on first use/);
});

test('migrate moves onboarding leftovers aside, drops hook state and is idempotent', () => {
  const root = makeRepo();
  writeState(root, 'map.md', '# Map\n');
  writeState(root, 'state/sessions/s1.json', '{}');
  writeState(root, 'state/baselines/abc.json', '{}');
  writeState(root, 'state/verify.jsonl', '');

  const first = runBin('ven-profile', ['migrate'], { cwd: root });
  assert.equal(first.code, 0, first.stderr);
  assert.match(first.stdout, /map\.md -> legacy\/map\.md/);
  const dir = stateDir(root);
  assert.equal(readFileSync(join(dir, 'legacy', 'map.md'), 'utf8'), '# Map\n');
  assert.equal(existsSync(join(dir, 'map.md')), false);
  assert.equal(existsSync(join(dir, 'state', 'sessions')), false);
  assert.equal(existsSync(join(dir, 'state', 'baselines')), false);
  assert.equal(existsSync(join(dir, 'state', 'verify.jsonl')), true);

  const second = runBin('ven-profile', ['migrate'], { cwd: root });
  assert.equal(second.code, 0);
  assert.match(second.stdout, /nothing to migrate/);
});

test('context names leftover onboarding state and points at migrate', () => {
  const root = makeRepo();
  writeState(root, 'map.md', '# Map\n');
  assert.match(runBin('ven-profile', ['context'], { cwd: root }).stdout, /ven-profile migrate/);
});

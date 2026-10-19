import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { linkSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadProfile, saveProfile, staleSources, validateProfile } from '../../scripts/lib/profile.mjs';
import { CORRECTION, HOOK_BLOCK } from '../../scripts/lib/signals.mjs';
import { appendVerify, passedVerifyFor, readBaseline, readPlaybookState, verifyEntries, writeBaseline, writePlaybookState } from '../../scripts/lib/state.mjs';
import { BASE_PROFILE, makeRepo, writeState } from '../support/fixture.mjs';

const tempDir = () => mkdtempSync(join(tmpdir(), 'ven-lib-'));
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

test('saveProfile replaces the file by rename and leaves no temp file', () => {
  const dir = tempDir();
  saveProfile(dir, { a: 1 });
  const path = join(dir, 'profile.json');
  linkSync(path, join(dir, 'alias.json'));
  const before = statSync(path).ino;
  saveProfile(dir, { a: 2 });
  assert.notEqual(statSync(path).ino, before);
  assert.equal(JSON.parse(readFileSync(join(dir, 'alias.json'), 'utf8')).a, 1);
  assert.deepEqual(readdirSync(dir).sort(), ['alias.json', 'profile.json']);
});

test('playbook state is written by rename and leaves no temp file', () => {
  const dir = tempDir();
  writePlaybookState(dir, '/repo', { playbook: 'fix' });
  const folder = join(dir, 'state', 'worktrees');
  const [file] = readdirSync(folder);
  linkSync(join(folder, file), join(folder, 'alias.json'));
  writePlaybookState(dir, '/repo', { playbook: 'feature' });
  assert.equal(readPlaybookState(dir, '/repo').playbook, 'feature');
  assert.equal(JSON.parse(readFileSync(join(folder, 'alias.json'), 'utf8')).playbook, 'fix');
  assert.equal(readdirSync(folder).length, 2);
});

test('corrupt state names the file instead of a bare JSON error', () => {
  const dir = tempDir();
  writePlaybookState(dir, '/repo', { playbook: 'fix' });
  const folder = join(dir, 'state', 'worktrees');
  writeFileSync(join(folder, readdirSync(folder)[0]), '{ nope');
  assert.throws(() => readPlaybookState(dir, '/repo'), /corrupt JSON in .*\.json/);
});

test('appendVerify rotates instead of rewriting: it drops only the oldest entries and never the newest', () => {
  const dir = tempDir();
  for (let i = 0; i < 1100; i++) appendVerify(dir, { tree: `t${i}`, key: 'k', exit: 0 });
  const trees = verifyEntries(dir).map((entry) => entry.tree);
  assert.ok(trees.length >= 500 && trees.length <= 1000, `kept ${trees.length}`);
  assert.deepEqual(trees, Array.from({ length: trees.length }, (_, index) => `t${1100 - trees.length + index}`));
  assert.equal(trees[0], `t${1100 - trees.length}`);
  assert.equal(trees.at(-1), 't1099');
});

test('playbook state and baselines are keyed per worktree', () => {
  const dir = tempDir();
  writePlaybookState(dir, '/repo-a', { playbook: 'fix' });
  writeBaseline(dir, '/repo-a', 'tree-a', 'head-a');
  assert.equal(readPlaybookState(dir, '/repo-b'), null);
  assert.equal(readBaseline(dir, '/repo-b'), null);
  assert.equal(readPlaybookState(dir, '/repo-a').playbook, 'fix');
  assert.equal(readBaseline(dir, '/repo-a').head, 'head-a');
});

test('passedVerifyFor ignores entries whose tree changed during the run', () => {
  const dir = tempDir();
  appendVerify(dir, { tree: 'abc', key: 'k', exit: 0, tree_changed: true });
  assert.equal(passedVerifyFor(dir, 'abc'), null);
  appendVerify(dir, { tree: 'abc', key: 'k', exit: 0 });
  assert.equal(passedVerifyFor(dir, 'abc').key, 'k');
});

test('loadProfile rejects unsupported schema versions and corrupt files', () => {
  const root = makeRepo({ profile: { ...BASE_PROFILE, schema_version: 2 } });
  assert.throws(() => loadProfile(root), /schema_version 2.*expected 1/);
  const missing = makeRepo({ profile: { ...BASE_PROFILE, schema_version: undefined } });
  assert.throws(() => loadProfile(missing), /schema_version/);
  const corrupt = makeRepo({ profile: null });
  writeState(corrupt, 'profile.json', '{ nope');
  assert.throws(() => loadProfile(corrupt), /corrupt JSON in .*profile\.json/);
});

test('validateProfile checks verify targets and pack identity', () => {
  const errors = validateProfile({
    ...BASE_PROFILE,
    verify: { logic: 'commands.test.all', cli: 'commands.nope', skill: 3 },
    packs: [{ name: 'orm', kind: 'tech' }, { kind: 'domain' }, { name: 'x' }],
  });
  assert.deepEqual(errors, [
    'verify.cli points at commands.nope, which is not a command',
    'verify.skill must be a command key',
    'packs[1].name is required',
    'packs[2].kind is required',
  ]);
});

test('validateProfile covers workspace commands', () => {
  const errors = validateProfile({ ...BASE_PROFILE, workspaces: [{ name: 'api', commands: { build: { run: 'x', status: 'maybe' } } }] });
  assert.deepEqual(errors, ['workspaces.api.commands.build.status must be verified, unverified or manual']);
});

test('staleSources compares content hashes when the profile has them', () => {
  const root = makeRepo({ profile: null });
  const ancient = { generated_at: '2000-01-01T00:00:00.000Z' };
  const sources = ['package.json'];
  const sameHash = { ...ancient, stack: { sources, source_hashes: { 'package.json': sha256('{"name":"fixture"}\n') } } };
  assert.deepEqual(staleSources(sameHash, root), []);
  const otherHash = { ...ancient, stack: { sources, source_hashes: { 'package.json': sha256('changed') } } };
  assert.deepEqual(staleSources(otherHash, root), ['package.json']);
  assert.deepEqual(staleSources({ ...ancient, stack: { sources } }, root), ['package.json']);
});

test('signals: HOOK_BLOCK matches every ven hook and CORRECTION leads with the objection', () => {
  for (const hook of ['verify-gate', 'repro-first', 'no-workaround', 'format', 'decisions-log', 'context-inject']) {
    assert.deepEqual([...`blocked by ven ${hook}: reason`.matchAll(HOOK_BLOCK)].map(([text]) => text), [`ven ${hook}: reason`]);
  }
});

const CORRECTION_CASES = [
  ['no, that is wrong', true],
  ['No.', true],
  ["don't mock the db", true],
  ['do not touch the config', true],
  ['stop, use the real one', true],
  ['wrong file', true],
  ['actually use the other module', true],
  ["that's not what I asked", true],
  ['undo that', true],
  ['you forgot the tests', true],
  ['nie, zrób to inaczej', true],
  ['źle, popraw to', true],
  ['dlaczego to zmieniłeś', true],
  ['stopwatch widget please', false],
  ['undo-redo stack for the editor', false],
  ['wrongly typed field fix', false],
  ['notification settings page', false],
  ['nobody can log in', false],
  ['do nothing on empty input', false],
  ['no-op refactor of the parser', false],
  ['niebieski przycisk w nagłówku', false],
  ['never-ending list bug', false],
  ['reverting the migration is safe', false],
  ['looks good', false],
];

test('CORRECTION matches objections at a word boundary only', () => {
  for (const [prompt, expected] of CORRECTION_CASES) assert.equal(CORRECTION.test(prompt), expected, prompt);
});

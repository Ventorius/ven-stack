import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { utimesSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { PLUGIN_ROOT, BASE_PROFILE, makeRepo, runBin, stateDir, writeFile, writeState } from '../support/fixture.mjs';
import { workingTreeHash } from '../../scripts/lib/repo.mjs';
import { passedVerifyFor, verifyEntries } from '../../scripts/lib/state.mjs';

const json = (result) => JSON.parse(result.stdout);
const profile = (root, ...args) => runBin('ven-profile', args, { cwd: root });
const BIN = join(PLUGIN_ROOT, 'bin', 'ven-profile');
// A command that calls back into the bin while prove is still running, like a user `set` during a long prove.
const setDuringRun = (key, value) => `node ${JSON.stringify(BIN)} set ${key} ${value} && node -e "process.exit(0)"`;

test('prove keeps a set made while a command was running', () => {
  const root = makeRepo({
    profile: {
      ...BASE_PROFILE,
      commands: {
        slow: { run: setDuringRun('conventions.commit_style', "'\"conventional\"'"), status: 'unverified' },
        other: { run: 'node -e "process.exit(0)"', status: 'unverified' },
      },
      verify: {},
    },
  });
  const result = profile(root, 'prove');
  assert.equal(result.code, 0, result.stderr + result.stdout);
  const saved = json(profile(root, 'show'));
  assert.equal(saved.conventions.commit_style, 'conventional');
  assert.equal(saved.commands.slow.status, 'verified');
  assert.equal(saved.commands.other.status, 'verified');
});

test('prove-adapters proves adapters and skips manual ones', () => {
  const root = makeRepo();
  writeState(root, 'adapters.json', JSON.stringify({
    'code.search': { run: 'node -e "process.exit(0)"', status: 'unverified' },
    'graph.imports': { run: 'node -e "process.exit(4)"', status: 'verified' },
    'workspace.list': { run: 'sleep 100', status: 'manual' },
  }));
  const result = profile(root, 'prove-adapters');
  assert.match(result.stdout, /ok +code\.search/);
  assert.match(result.stdout, /FAIL +graph\.imports/);
  const adapters = json(profile(root, 'adapters'));
  assert.equal(adapters['code.search'].status, 'verified');
  assert.match(adapters['code.search'].proof, /^exit 0/);
  assert.equal(adapters['graph.imports'].status, 'unverified');
  assert.equal(adapters['workspace.list'].status, 'manual');
});

test('prove-adapters merges only proof fields into an adapters file edited meanwhile', () => {
  const root = makeRepo();
  const adaptersPath = join(stateDir(root), 'adapters.json');
  const rewrite = `node -e "const f=require('fs');const p=process.argv[1];const a=JSON.parse(f.readFileSync(p));a['schema.read']={run:'x',status:'unverified'};f.writeFileSync(p,JSON.stringify(a))" ${JSON.stringify(adaptersPath)}`;
  writeState(root, 'adapters.json', JSON.stringify({ 'code.search': { run: rewrite, status: 'unverified' } }));
  profile(root, 'prove-adapters');
  const adapters = json(profile(root, 'adapters'));
  assert.equal(adapters['code.search'].status, 'verified');
  assert.equal(adapters['schema.read'].run, 'x');
});

test('prove --strict exits 1 when any command fails, plain prove still exits 0', () => {
  const root = makeRepo({
    profile: { ...BASE_PROFILE, commands: { good: { run: 'node -e "process.exit(0)"', status: 'unverified' }, bad: { run: 'node -e "process.exit(1)"', status: 'unverified' } }, verify: {} },
  });
  assert.equal(profile(root, 'prove').code, 0);
  const strict = profile(root, 'prove', '--strict');
  assert.equal(strict.code, 1);
  assert.match(strict.stdout, /FAIL +commands\.bad/);
  const clean = makeRepo({ profile: { ...BASE_PROFILE, commands: { good: { run: 'node -e "process.exit(0)"', status: 'unverified' } }, verify: {} } });
  assert.equal(profile(clean, 'prove', '--strict').code, 0);
});

const WRITES_FILE = { run: `node -e "require('fs').writeFileSync('src/app.js','same')"`, status: 'verified' };

test('verify refuses to log a pass when the tree changed while the command ran', () => {
  const root = makeRepo({ profile: { ...BASE_PROFILE, commands: { gen: WRITES_FILE }, verify: { logic: 'commands.gen' } } });
  const first = profile(root, 'verify', 'gen');
  assert.equal(first.code, 1);
  assert.match(first.stdout + first.stderr, /tree changed while gen ran.*Re-run: ven-profile verify gen/);
  const [entry] = verifyEntries(stateDir(root));
  assert.equal(entry.exit, 0);
  assert.equal(entry.tree_changed, true);
  assert.equal(passedVerifyFor(stateDir(root), entry.tree), null);
});

test('verify logs a pass once the command no longer changes the tree', () => {
  const root = makeRepo({ profile: { ...BASE_PROFILE, commands: { gen: WRITES_FILE }, verify: { logic: 'commands.gen' } } });
  profile(root, 'verify', 'gen');
  const second = profile(root, 'verify', 'gen');
  assert.equal(second.code, 0, second.stdout + second.stderr);
  const entries = verifyEntries(stateDir(root));
  assert.equal(entries.length, 2);
  assert.equal(entries[1].tree_changed, undefined);
  assert.equal(passedVerifyFor(stateDir(root), entries[1].tree).key, 'gen');
});

test('verify logs a pass against the post-run tree when the command only adds an untracked file', () => {
  const writesOut = { run: `node -e "require('fs').writeFileSync('out.txt','x')"`, status: 'verified' };
  const root = makeRepo({ profile: { ...BASE_PROFILE, commands: { gen: writesOut }, verify: { logic: 'commands.gen' } } });
  const result = profile(root, 'verify', 'gen');
  assert.equal(result.code, 0, result.stdout + result.stderr);
  const [entry] = verifyEntries(stateDir(root));
  assert.equal(entry.tree_changed, undefined);
  assert.equal(passedVerifyFor(stateDir(root), workingTreeHash(root)).key, 'gen');
});

test('verify still refuses when the command edits a file that existed before, untracked or tracked', () => {
  const editsTracked = { run: `node -e "require('fs').appendFileSync('src/app.js','// x')"`, status: 'verified' };
  const editsUntracked = { run: `node -e "require('fs').appendFileSync('scratch.txt','x')"`, status: 'verified' };
  const root = makeRepo({ profile: { ...BASE_PROFILE, commands: { tracked: editsTracked, untracked: editsUntracked }, verify: {} } });
  writeFile(root, 'scratch.txt', 'before');
  assert.equal(profile(root, 'verify', 'tracked').code, 1);
  assert.equal(profile(root, 'verify', 'untracked').code, 1);
});

test('verify keeps the command exit code when the command fails', () => {
  const root = makeRepo();
  assert.equal(profile(root, 'verify', 'failing').code, 3);
});

test('write always stamps generated_at and source hashes', () => {
  const root = makeRepo({ profile: null });
  const stale = { ...BASE_PROFILE, stack: { sources: ['package.json', 'missing.lock'] } };
  assert.equal(runBin('ven-profile', ['write'], { cwd: root, input: JSON.stringify(stale) }).code, 0);
  const written = json(profile(root, 'show'));
  assert.notEqual(written.generated_at, BASE_PROFILE.generated_at);
  assert.ok(Date.now() - Date.parse(written.generated_at) < 60000);
  assert.deepEqual(written.stack.source_hashes, { 'package.json': createHash('sha256').update('{"name":"fixture"}\n').digest('hex') });
});

test('fresh compares content: a touch is fresh, an edit is stale, stamp makes it fresh again', () => {
  const root = makeRepo({ profile: null });
  runBin('ven-profile', ['write'], { cwd: root, input: JSON.stringify(BASE_PROFILE) });
  const future = new Date(Date.now() + 120000);
  utimesSync(join(root, 'package.json'), future, future);
  assert.equal(profile(root, 'fresh').code, 0);

  writeFile(root, 'package.json', '{"name":"changed"}\n');
  const stale = profile(root, 'fresh');
  assert.equal(stale.code, 1);
  assert.match(stale.stderr, /package\.json/);

  const before = json(profile(root, 'show'));
  const stamped = profile(root, 'stamp');
  assert.equal(stamped.code, 0, stamped.stderr);
  assert.equal(profile(root, 'fresh').code, 0);
  const after = json(profile(root, 'show'));
  assert.notEqual(after.stack.source_hashes['package.json'], before.stack.source_hashes['package.json']);
  assert.deepEqual({ ...after, generated_at: 0, stack: { ...after.stack, source_hashes: 0 } }, { ...before, generated_at: 0, stack: { ...before.stack, source_hashes: 0 } });
});

test('set prints the key it set', () => {
  const root = makeRepo();
  const result = profile(root, 'set', 'risk_areas', '[]');
  assert.equal(result.code, 0);
  assert.equal(result.stdout.trim(), 'set risk_areas');
});

test('set and write reject a verify entry that points at no command', () => {
  const root = makeRepo();
  const set = profile(root, 'set', 'verify.cli', '"commands.nope"');
  assert.equal(set.code, 1);
  assert.match(set.stderr, /verify\.cli points at commands\.nope, which is not a command/);
  const write = runBin('ven-profile', ['write'], { cwd: root, input: JSON.stringify({ ...BASE_PROFILE, packs: [{ name: 'orm' }] }) });
  assert.match(write.stderr, /packs\[0\]\.kind is required/);
});

test('a profile with another schema_version fails every command with a clear message', () => {
  const root = makeRepo({ profile: { ...BASE_PROFILE, schema_version: 2 } });
  const result = profile(root, 'show');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /ven-profile: .*schema_version 2, expected 1/);
});

test('a corrupt profile or adapters file fails with the file name, not a stack trace', () => {
  const root = makeRepo();
  writeState(root, 'profile.json', '{ nope');
  const result = profile(root, 'show');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^ven-profile: corrupt JSON in .*profile\.json/);
  assert.doesNotMatch(result.stderr, /\n\s+at /);

  const withAdapters = makeRepo();
  writeState(withAdapters, 'adapters.json', '[[');
  const adapters = profile(withAdapters, 'adapters');
  assert.equal(adapters.code, 1);
  assert.match(adapters.stderr, /corrupt JSON in .*adapters\.json/);
});

test('ven-profile exit codes: usage 2, unknown flags 2, valueless flags 2, runtime failure 1', () => {
  const root = makeRepo();
  const bare = runBin('ven-profile', [], { cwd: root });
  assert.equal(bare.code, 2);
  assert.match(bare.stderr, /ven-profile: the repo profile/);
  const unknown = profile(root, 'bogus');
  assert.equal(unknown.code, 2);
  assert.match(unknown.stderr, /unknown command bogus/);
  assert.equal(profile(root, 'show', '--bogus').code, 2);
  const valueless = profile(root, 'run', 'test.all', '--file');
  assert.equal(valueless.code, 2);
  assert.match(valueless.stderr, /--file needs a value/);
  assert.equal(profile(root, 'prove', '--strict=yes').code, 2);
  assert.equal(profile(root, 'get', 'nope').code, 1);
  assert.equal(profile(root, '--help').code, 0);
});

test('--timeout must be an integer of at least 1', () => {
  const root = makeRepo();
  for (const bad of ['0', 'abc', '-3', '1.5']) assert.equal(profile(root, 'run', 'test.all', '--timeout', bad).code, 2, bad);
  assert.equal(profile(root, 'run', 'test.all', '--timeout', '30').code, 0);
});

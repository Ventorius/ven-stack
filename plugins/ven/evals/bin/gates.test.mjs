import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BASE_PROFILE, SCRIPTS_DIR, makeRepo, runBin, stateDir, writeFile, writeState } from '../support/fixture.mjs';

const decisions = (root) => readFileSync(join(stateDir(root), 'decisions.tsv'), 'utf8');

test('verify refuses a diff that adds a suppression and logs no pass', () => {
  const root = makeRepo();
  writeFile(root, 'src/app.js', '// @ts-ignore\nexport const answer = 42;\n');
  const result = runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /src\/app\.js adds `\/\/ @ts-ignore`: hides a type error/);
  assert.match(result.stderr, /ven-allow:/);
  assert.doesNotMatch(result.stdout, /logged against tree/);
});

test('verify accepts a ven-allow suppression and logs the allowance once', () => {
  const root = makeRepo();
  writeFile(root, 'src/app.js', '// @ts-ignore ven-allow: SUB-1 vendor types\nexport const answer = 42;\n');
  assert.equal(runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root }).code, 0);
  assert.equal(runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root }).code, 0);
  assert.equal(decisions(root).match(/no-workaround\tallowed/g)?.length, 1);
});

test('verify refuses removed assertions in test files only, and ignores docs', () => {
  const root = makeRepo();
  writeFile(root, 'src/app.test.js', 'expect(a).toBe(1)\nexpect(b).toBe(2)\n');
  writeFile(root, 'src/helper.js', 'expect(a).toBe(1)\nexpect(b).toBe(2)\n');
  writeFile(root, 'README.md', '# fixture\n@ts-ignore in docs is fine\n');
  runBin('ven-decisions', ['start', 'feature'], { cwd: root });
  writeFile(root, 'src/helper.js', 'expect(a).toBe(1)\n');
  assert.equal(runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root }).code, 0);

  writeFile(root, 'src/app.test.js', 'expect(a).toBe(1)\n');
  const weakened = runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root });
  assert.equal(weakened.code, 1);
  assert.match(weakened.stderr, /src\/app\.test\.js removes 1 assertion/);
});

test('verify skips an invalid suppression pattern with a warning and still applies the rest', () => {
  const root = makeRepo();
  const profile = JSON.parse(readFileSync(join(stateDir(root), 'profile.json'), 'utf8'));
  profile.suppressions.push({ pattern: '(', why: 'broken' });
  writeState(root, 'profile.json', JSON.stringify(profile));
  writeFile(root, 'src/app.js', '// @ts-ignore\n');
  const result = runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /invalid suppression pattern `\(` skipped/);
  assert.match(result.stderr, /@ts-ignore/);
});

test('end refuses done while a code change has no passing verify, then accepts after verify', () => {
  const root = makeRepo();
  runBin('ven-decisions', ['start', 'feature'], { cwd: root });
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  runBin('ven-decisions', ['skip', '--step', 'learning-check', '--reason', 'test'], { cwd: root });

  const refused = runBin('ven-decisions', ['end'], { cwd: root });
  assert.equal(refused.code, 1);
  assert.match(refused.stderr, /src\/app\.js/);
  assert.match(refused.stderr, /ven-profile verify commands\.test\.all/);

  assert.equal(runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root }).code, 0);
  assert.equal(runBin('ven-decisions', ['end'], { cwd: root }).code, 0);
});

test('end ignores a failing verify and an edit made after verifying', () => {
  const root = makeRepo();
  runBin('ven-decisions', ['start', 'feature'], { cwd: root });
  runBin('ven-decisions', ['skip', '--step', 'learning-check', '--reason', 'test'], { cwd: root });
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  runBin('ven-profile', ['verify', 'commands.failing'], { cwd: root });
  assert.equal(runBin('ven-decisions', ['end'], { cwd: root }).code, 1);

  runBin('ven-profile', ['verify', 'commands.test.all'], { cwd: root });
  writeFile(root, 'src/app.js', 'export const answer = 44;\n');
  assert.equal(runBin('ven-decisions', ['end'], { cwd: root }).code, 1);
});

test('end needs no verify for docs-only changes or unfinished outcomes', () => {
  const root = makeRepo();
  runBin('ven-decisions', ['start', 'feature'], { cwd: root });
  runBin('ven-decisions', ['skip', '--step', 'learning-check', '--reason', 'test'], { cwd: root });
  writeFile(root, 'README.md', '# changed\n');
  assert.equal(runBin('ven-decisions', ['end'], { cwd: root }).code, 0);

  runBin('ven-decisions', ['start', 'feature'], { cwd: root });
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  assert.equal(runBin('ven-decisions', ['end', '--outcome', 'abandoned'], { cwd: root }).code, 0);
});

test('end --unverified closes the run and records UNVERIFIED with the reason', () => {
  const root = makeRepo();
  runBin('ven-decisions', ['start', 'feature'], { cwd: root });
  runBin('ven-decisions', ['skip', '--step', 'learning-check', '--reason', 'test'], { cwd: root });
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  assert.equal(runBin('ven-decisions', ['end', '--unverified', 'needs a staging database'], { cwd: root }).code, 0);
  assert.match(decisions(root), /verify\tUNVERIFIED\tneeds a staging database/);
});

test('context prints the state dir, a stale profile, the active playbook and covering solutions', () => {
  const root = makeRepo();
  writeState(root, 'solutions/billing/rounding.md', '---\ntitle: Rounding drift\nsymptoms: [totals off by one cent]\nfiles: [src/app.js]\n---\nbody');
  writeState(root, 'solutions/other/unrelated.md', '---\ntitle: Unrelated\nfiles: [src/other.js]\n---\nbody');
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  runBin('ven-decisions', ['start', 'feature'], { cwd: root });

  const { code, stdout } = runBin('ven-profile', ['context'], { cwd: root });
  assert.equal(code, 0);
  assert.match(stdout, new RegExp(stateDir(root).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(stdout, /Profile may be stale: package\.json/);
  assert.match(stdout, /Active playbook in this worktree: feature/);
  assert.match(stdout, /Rounding drift/);
  assert.doesNotMatch(stdout, /Unrelated/);
});

test('solutions-for lists only solutions covering the named files', () => {
  const root = makeRepo();
  writeState(root, 'solutions/billing/rounding.md', '---\ntitle: Rounding drift\nfiles: [src/app.js]\n---\nbody');
  writeState(root, 'solutions/other/unrelated.md', '---\ntitle: Unrelated\nfiles: [src/other.js]\n---\nbody');
  const { code, stdout } = runBin('ven-profile', ['solutions-for', 'src/app.js'], { cwd: root });
  assert.equal(code, 0);
  assert.match(stdout, /Rounding drift/);
  assert.doesNotMatch(stdout, /Unrelated/);
  assert.equal(runBin('ven-profile', ['solutions-for', 'src/none.js'], { cwd: root }).stdout.trim(), '');
});

test('solutions tolerate a scalar files: entry and one bad entry does not hide the others', () => {
  const root = makeRepo();
  writeState(root, 'solutions/scalar.md', '---\ntitle: Scalar\nfiles: src/app.js\n---\nbody');
  writeState(root, 'solutions/mixed.md', '---\ntitle: Mixed\nfiles: [5, "src/app.js"]\n---\nbody');
  writeState(root, 'solutions/number.md', '---\ntitle: Number\nfiles: 7\n---\nbody');
  const result = runBin('ven-profile', ['solutions-for', 'src/app.js'], { cwd: root });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Scalar/);
  assert.match(result.stdout, /Mixed/);
  assert.doesNotMatch(result.stdout, /Number/);
});

const bigOutputProfile = () => ({
  ...BASE_PROFILE,
  commands: { ...BASE_PROFILE.commands, big: { run: `node -e "process.stdout.write('a'.repeat(300000)+'END')"`, status: 'verified' } },
});

test('ven-profile run delivers more than 64KB of output', () => {
  const root = makeRepo({ profile: bigOutputProfile() });
  const result = runBin('ven-profile', ['run', 'big'], { cwd: root });
  assert.equal(result.stdout.length, 300003);
  assert.ok(result.stdout.endsWith('END'));
});

test('ven-profile verify delivers more than 64KB of output', () => {
  const root = makeRepo({ profile: bigOutputProfile() });
  const result = runBin('ven-profile', ['verify', 'big'], { cwd: root });
  assert.equal(result.code, 0);
  assert.match(result.stdout, /END\s+ven-profile verify: big exit 0/);
});

test('end survives a torn line in verify.jsonl', () => {
  const root = makeRepo();
  runBin('ven-decisions', ['start', 'feature'], { cwd: root });
  runBin('ven-decisions', ['skip', '--step', 'learning-check', '--reason', 'test'], { cwd: root });
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  assert.equal(runBin('ven-profile', ['verify', 'test.all'], { cwd: root }).code, 0);
  appendFileSync(join(stateDir(root), 'state', 'verify.jsonl'), '{"tree":"abc","ex\n');
  assert.equal(runBin('ven-decisions', ['end'], { cwd: root }).code, 0);
});

test('appendDecision concurrent first writes leave exactly one header and every row', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ven-dec-'));
  const script = `import { appendDecision } from ${JSON.stringify(join(SCRIPTS_DIR, 'lib/state.mjs'))}; appendDecision(${JSON.stringify(dir)}, { step: process.argv[1] });`;
  await Promise.all(
    Array.from({ length: 8 }, (_, index) => new Promise((resolve) => spawn('node', ['--input-type=module', '-e', script, String(index)]).on('close', resolve))),
  );
  const lines = readFileSync(join(dir, 'decisions.tsv'), 'utf8').trim().split('\n');
  assert.equal(lines.filter((line) => line.startsWith('ts\t')).length, 1);
  assert.equal(lines.length, 9);
});

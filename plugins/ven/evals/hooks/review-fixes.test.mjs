import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { appendFileSync, chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BASE_PROFILE, PLUGIN_ROOT, makeRepo, runBin, runHook, stateDir, writeFile } from '../support/fixture.mjs';

const session = (root, extra = {}) => ({ session_id: 's1', cwd: root, ...extra });
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const baselineDir = (root) => join(stateDir(root), 'state', 'baselines');
const decisions = (root) => readFileSync(join(stateDir(root), 'decisions.tsv'), 'utf8').trim().split('\n').slice(1);
const editInput = (root, file, extra = {}) => ({ session_id: 's1', cwd: root, tool_name: 'Edit', tool_input: { file_path: file }, ...extra });
const symlinkTo = (root) => {
  const link = join(mkdtempSync(join(tmpdir(), 'ven-link-')), 'repo');
  symlinkSync(root, link);
  return link;
};
const bigOutputProfile = () => ({
  ...BASE_PROFILE,
  commands: { ...BASE_PROFILE.commands, big: { run: `node -e "process.stdout.write('a'.repeat(300000)+'END')"`, status: 'verified' } },
});

test('verify-gate ignores a baseline recorded at another HEAD', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  git(root, 'switch', '-qc', 'other');
  writeFile(root, 'b.js', 'export const b = 1;\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'extra');
  runHook('verify-gate', session(root, { session_id: 's2', hook_event_name: 'SessionStart' }));
  assert.equal(runHook('verify-gate', session(root, { session_id: 's2', hook_event_name: 'Stop' })).code, 0);
});

test('verify-gate clears the baseline at Stop when the session changed nothing', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  assert.equal(readdirSync(baselineDir(root)).length, 1);
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 0);
  assert.equal(readdirSync(baselineDir(root)).length, 0);
});

test('verify-gate Stop on an internal error blocks once, then releases on stop_hook_active', () => {
  const root = makeRepo();
  mkdirSync(join(stateDir(root), 'state', 'sessions'), { recursive: true });
  const sessionFile = join(stateDir(root), 'state', 'sessions', 's1.json');
  writeFileSync(sessionFile, '{oops');
  const first = runHook('verify-gate', session(root, { hook_event_name: 'Stop' }));
  assert.equal(first.code, 2);
  assert.ok(first.stderr.includes(sessionFile), first.stderr);

  const second = runHook('verify-gate', session(root, { hook_event_name: 'Stop', stop_hook_active: true }));
  assert.equal(second.code, 0);
  assert.match(second.stderr, /released/);
  assert.match(decisions(root).join('\n'), /UNVERIFIED/);
});

test('verify-gate releases with a warning when the tree cannot be hashed', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  const unreadable = writeFile(root, 'src/unreadable.js', 'x\n');
  chmodSync(unreadable, 0o000);
  try {
    const result = runHook('verify-gate', session(root, { hook_event_name: 'Stop' }));
    assert.equal(result.code, 0);
    assert.match(result.stderr, /could not hash the working tree/);
  } finally {
    chmodSync(unreadable, 0o644);
  }
});

test('repro-first never blocks docs or test files on corrupt playbook state', () => {
  const root = makeRepo();
  const folder = join(stateDir(root), 'state', 'worktrees');
  runBin('ven-decisions', ['start', 'bug-fix'], { cwd: root });
  const stateFile = join(folder, readdirSync(folder)[0]);
  writeFileSync(stateFile, '{oops');
  assert.equal(runHook('repro-first', editInput(root, join(root, 'README.md'))).code, 0);
  assert.equal(runHook('repro-first', editInput(root, join(root, 'src/app.test.js'))).code, 0);

  const first = runHook('repro-first', editInput(root, join(root, 'src/app.js')));
  assert.equal(first.code, 2);
  assert.ok(first.stderr.includes(stateFile), first.stderr);
  assert.match(first.stderr, /ven-decisions start/);
  const second = runHook('repro-first', editInput(root, join(root, 'src/app.js')));
  assert.equal(second.code, 0);
  assert.match(second.stderr, /internal error/);
});

test('solutions tolerate a scalar files: entry and one bad entry does not hide the others', () => {
  const root = makeRepo();
  const dir = stateDir(root);
  writeFile(dir, 'solutions/scalar.md', '---\ntitle: Scalar\nfiles: src/app.js\n---\nbody');
  writeFile(dir, 'solutions/mixed.md', '---\ntitle: Mixed\nfiles: [5, "src/app.js"]\n---\nbody');
  writeFile(dir, 'solutions/number.md', '---\ntitle: Number\nfiles: 7\n---\nbody');
  const result = runHook('solutions-on-edit', editInput(root, join(root, 'src/app.js'), { hook_event_name: 'PreToolUse' }));
  assert.equal(result.code, 0, result.stderr);
  const context = JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
  assert.match(context, /Scalar/);
  assert.match(context, /Mixed/);
  assert.doesNotMatch(context, /Number/);
});

test('solutions-on-edit injects for a second covered file in the same session', () => {
  const root = makeRepo();
  writeFile(stateDir(root), 'solutions/src.md', '---\ntitle: Src\nfiles: ["src/**"]\n---\nbody');
  writeFile(root, 'src/other.js', 'x\n');
  const input = (file) => editInput(root, join(root, file), { hook_event_name: 'PreToolUse' });
  assert.notEqual(runHook('solutions-on-edit', input('src/app.js')).stdout, '');
  assert.equal(runHook('solutions-on-edit', input('src/app.js')).stdout, '');
  assert.match(runHook('solutions-on-edit', input('src/other.js')).stdout, /Src/);
});

test('hooks see edits made through a symlinked repo path', () => {
  const root = makeRepo();
  const link = symlinkTo(root);
  runBin('ven-decisions', ['start', 'bug-fix'], { cwd: root });
  const blocked = runHook('repro-first', editInput(link, join(link, 'src/app.js')));
  assert.equal(blocked.code, 2, blocked.stderr);

  const flagged = runHook('no-workaround', { cwd: link, session_id: 's1', tool_name: 'Write', tool_input: { file_path: join(link, 'src/new.js'), content: '// @ts-ignore\n' } });
  assert.equal(flagged.code, 2, flagged.stderr);

  writeFile(stateDir(root), 'solutions/src.md', '---\ntitle: Src\nfiles: ["src/**"]\n---\nbody');
  const injected = runHook('solutions-on-edit', editInput(link, join(link, 'src/app.js'), { hook_event_name: 'PreToolUse' }));
  assert.match(injected.stdout, /Src/);
});

test('context-inject output over 64KB is delivered whole as valid JSON', () => {
  const root = makeRepo();
  const map = `${'0123456789 '.repeat(20000)}END`;
  writeFile(stateDir(root), 'map.md', map);
  const result = runHook('context-inject', session(root, { hook_event_name: 'SessionStart' }));
  assert.equal(result.code, 0);
  assert.ok(JSON.parse(result.stdout).hookSpecificOutput.additionalContext.includes(map));
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

test('no-workaround logs a ven-allow line once per session and file', () => {
  const root = makeRepo();
  const write = (sessionId) =>
    runHook('no-workaround', { cwd: root, session_id: sessionId, tool_name: 'Write', tool_input: { file_path: join(root, 'src/new.js'), content: '// @ts-ignore ven-allow: T-1\n' } });
  const allowedRows = () => decisions(root).filter((row) => row.includes('\tallowed\t')).length;
  assert.equal(write('s1').code, 0);
  assert.equal(write('s1').code, 0);
  assert.equal(allowedRows(), 1);
  write('s2');
  assert.equal(allowedRows(), 2);
});

test('no-workaround allows removing expect( from a file that is not a test', () => {
  const root = makeRepo();
  writeFile(root, 'src/check.js', 'expect(a);\nexpect(b);\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'check');
  const result = runHook('no-workaround', { cwd: root, session_id: 's1', tool_name: 'Write', tool_input: { file_path: join(root, 'src/check.js'), content: 'expect(a);\n' } });
  assert.equal(result.code, 0, result.stderr);
});

test('capture-corrections redacts likely secrets before storing the prompt', () => {
  const root = makeRepo();
  const secrets = ['sk-abc123def456ghi789', 'hunter2', 'abc.def.ghi', 'ghp_aaaaBBBBccccDDDD1111', '0123456789abcdef0123456789abcdef', 'xoxb-1234-5678-abcd'];
  const text = 'no, use sk-abc123def456ghi789 and password=hunter2 with Bearer abc.def.ghi, ghp_aaaaBBBBccccDDDD1111, key 0123456789abcdef0123456789abcdef, xoxb-1234-5678-abcd';
  assert.equal(runHook('capture-corrections', { session_id: 's1', cwd: root, prompt: text }).code, 0);
  const row = decisions(root).join('\n');
  for (const secret of secrets) assert.ok(!row.includes(secret), `${secret} leaked: ${row}`);
  assert.match(row, /no, use \[redacted\]/);
});

test('context-inject stale-profile message points at ven-profile stamp', () => {
  const root = makeRepo();
  writeFile(root, 'package.json', '{"name":"changed"}\n');
  const result = runHook('context-inject', session(root, { hook_event_name: 'SessionStart' }));
  assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /ven-profile stamp/);
});

test('SubagentStart for a coder neither inherits nor overwrites the worktree baseline', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  const baselineFile = () => readFileSync(join(baselineDir(root), readdirSync(baselineDir(root))[0]), 'utf8');
  const before = baselineFile();
  const agent = { cwd: root, agent_id: 'a1', agent_type: 'ven:ven-coder' };
  runHook('verify-gate', { ...agent, hook_event_name: 'SubagentStart' });
  assert.equal(baselineFile(), before);
  assert.equal(runHook('verify-gate', { ...agent, hook_event_name: 'SubagentStop' }).code, 0);
});

test('verify-gate survives a torn line in verify.jsonl', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  assert.equal(runBin('ven-profile', ['verify', 'test.all'], { cwd: root }).code, 0);
  appendFileSync(join(stateDir(root), 'state', 'verify.jsonl'), '{"tree":"abc","ex\n');
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 0);
});

test('appendDecision concurrent first writes leave exactly one header and every row', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ven-dec-'));
  const script = `import { appendDecision } from ${JSON.stringify(join(PLUGIN_ROOT, 'scripts/lib/state.mjs'))}; appendDecision(${JSON.stringify(dir)}, { step: process.argv[1] });`;
  await Promise.all(
    Array.from({ length: 8 }, (_, index) => new Promise((resolve) => spawn('node', ['--input-type=module', '-e', script, String(index)]).on('close', resolve))),
  );
  const lines = readFileSync(join(dir, 'decisions.tsv'), 'utf8').trim().split('\n');
  assert.equal(lines.filter((line) => line.startsWith('ts\t')).length, 1);
  assert.equal(lines.length, 9);
});
